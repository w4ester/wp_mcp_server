/**
 * WordPress Media Tool
 * 
 * MCP tool implementation for managing WordPress media library.
 */

import { z } from 'zod';
import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';
import { RequestContext } from '../../types/context.js';
import { logger } from '../../utils/logger.js';

// Schema for listing media
export const ListMediaSchema = z.object({
  site: z.string().describe('Site identifier'),
  page: z.number().optional().describe('Page number'),
  perPage: z.number().optional().describe('Items per page'),
  search: z.string().optional().describe('Search term'),
  mediaType: z.enum(['image', 'video', 'audio', 'application']).optional().describe('Media type'),
  mimeType: z.string().optional().describe('MIME type (e.g., image/jpeg)'),
  author: z.union([z.number(), z.string()]).optional().describe('Author ID'),
  parent: z.number().optional().describe('Parent post ID'),
  status: z.string().optional().describe('Media status'),
  orderBy: z.string().optional().describe('Sort field'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort direction')
});

// Schema for getting a media item
export const GetMediaSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Media ID')
});

// Schema for creating/uploading media
export const CreateMediaSchema = z.object({
  site: z.string().describe('Site identifier'),
  file: z.string().describe('Base64 encoded file content'),
  filename: z.string().describe('Original filename'),
  title: z.string().optional().describe('Media title'),
  caption: z.string().optional().describe('Media caption'),
  alt_text: z.string().optional().describe('Alternative text'),
  description: z.string().optional().describe('Media description'),
  post: z.number().optional().describe('Associated post ID')
});

// Schema for updating media
export const UpdateMediaSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Media ID'),
  title: z.string().optional().describe('Media title'),
  caption: z.string().optional().describe('Media caption'),
  alt_text: z.string().optional().describe('Alternative text'),
  description: z.string().optional().describe('Media description'),
  post: z.number().optional().describe('Associated post ID')
});

// Schema for deleting media
export const DeleteMediaSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Media ID'),
  force: z.boolean().optional().default(false).describe('Force delete instead of trash')
});

/**
 * Register media tool methods with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param siteManager WordPress site manager
 */
export function registerMediaTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  // List media
  handler.registerMethod(
    'wp.media.list',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const apiParams: Record<string, any> = {};
      
      if (params.page !== undefined) apiParams.page = params.page;
      if (params.perPage !== undefined) apiParams.per_page = params.perPage;
      if (params.search !== undefined) apiParams.search = params.search;
      if (params.mediaType !== undefined) apiParams.media_type = params.mediaType;
      if (params.mimeType !== undefined) apiParams.mime_type = params.mimeType;
      if (params.author !== undefined) apiParams.author = params.author;
      if (params.parent !== undefined) apiParams.parent = params.parent;
      if (params.status !== undefined) apiParams.status = params.status;
      if (params.orderBy !== undefined) apiParams.orderby = params.orderBy;
      if (params.order !== undefined) apiParams.order = params.order;
      
      // Make API request
      const media = await client.request<any[]>('/media', {
        method: 'GET',
        params: apiParams
      });
      
      return {
        media,
        total: media.length,
        page: params.page || 1
      };
    },
    ListMediaSchema,
    'List WordPress media library items with optional filtering'
  );
  
  // Get a media item by ID
  handler.registerMethod(
    'wp.media.get',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const mediaItem = await client.request<any>(`/media/${params.id}`, {
        method: 'GET'
      });
      
      return { media: mediaItem };
    },
    GetMediaSchema,
    'Get a WordPress media item by ID'
  );
  
  // Upload new media
  handler.registerMethod(
    'wp.media.create',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert base64 to buffer
      const fileBuffer = Buffer.from(params.file, 'base64');
      
      // Prepare form data for multipart upload
      const formData = new FormData();
      const blob = new Blob([fileBuffer]);
      formData.append('file', blob, params.filename);
      
      // Add additional fields if provided
      if (params.title) formData.append('title', params.title);
      if (params.caption) formData.append('caption', params.caption);
      if (params.alt_text) formData.append('alt_text', params.alt_text);
      if (params.description) formData.append('description', params.description);
      if (params.post) formData.append('post', params.post.toString());
      
      // Make API request with multipart form data
      const mediaItem = await client.request<any>('/media', {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      logger.info(`Uploaded media ${mediaItem.id} on site ${params.site}`, {
        mediaId: mediaItem.id,
        site: params.site,
        filename: params.filename,
        client: context.authContext?.clientId
      });
      
      return { media: mediaItem };
    },
    CreateMediaSchema,
    'Upload a new media item to WordPress'
  );
  
  // Update a media item
  handler.registerMethod(
    'wp.media.update',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, id, ...mediaData } = params;
      
      // Make API request
      const mediaItem = await client.request<any>(`/media/${id}`, {
        method: 'POST',
        data: mediaData
      });
      
      logger.info(`Updated media ${id} on site ${params.site}`, {
        mediaId: id,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { media: mediaItem };
    },
    UpdateMediaSchema,
    'Update an existing WordPress media item'
  );
  
  // Delete a media item
  handler.registerMethod(
    'wp.media.delete',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const mediaItem = await client.request<any>(`/media/${params.id}`, {
        method: 'DELETE',
        params: { force: params.force }
      });
      
      logger.info(`Deleted media ${params.id} on site ${params.site}`, {
        mediaId: params.id,
        site: params.site,
        force: params.force,
        client: context.authContext?.clientId
      });
      
      return { success: true, media: mediaItem };
    },
    DeleteMediaSchema,
    'Delete a WordPress media item'
  );
}
