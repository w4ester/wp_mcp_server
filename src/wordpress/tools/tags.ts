/**
 * WordPress Tags Tool
 * 
 * MCP tool implementation for managing WordPress tags.
 */

import { z } from 'zod';
import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';
import { RequestContext } from '../../types/context.js';
import { logger } from '../../utils/logger.js';

// Schema for listing tags
export const ListTagsSchema = z.object({
  site: z.string().describe('Site identifier'),
  page: z.number().optional().describe('Page number'),
  perPage: z.number().optional().describe('Items per page'),
  search: z.string().optional().describe('Search term'),
  exclude: z.array(z.number()).optional().describe('Tag IDs to exclude'),
  include: z.array(z.number()).optional().describe('Tag IDs to include'),
  hideEmpty: z.boolean().optional().describe('Hide empty tags'),
  orderBy: z.string().optional().describe('Sort field'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort direction')
});

// Schema for getting a tag
export const GetTagSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Tag ID')
});

// Schema for creating a tag
export const CreateTagSchema = z.object({
  site: z.string().describe('Site identifier'),
  name: z.string().describe('Tag name'),
  description: z.string().optional().describe('Tag description'),
  slug: z.string().optional().describe('Tag slug')
});

// Schema for updating a tag
export const UpdateTagSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Tag ID'),
  name: z.string().optional().describe('Tag name'),
  description: z.string().optional().describe('Tag description'),
  slug: z.string().optional().describe('Tag slug')
});

// Schema for deleting a tag
export const DeleteTagSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Tag ID'),
  force: z.boolean().optional().default(false).describe('Force delete instead of trash')
});

/**
 * Register tags tool methods with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param siteManager WordPress site manager
 */
export function registerTagsTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  // List tags
  handler.registerMethod(
    'wp.tags.list',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const apiParams: Record<string, any> = {};
      
      if (params.page !== undefined) apiParams.page = params.page;
      if (params.perPage !== undefined) apiParams.per_page = params.perPage;
      if (params.search !== undefined) apiParams.search = params.search;
      if (params.exclude !== undefined) apiParams.exclude = params.exclude;
      if (params.include !== undefined) apiParams.include = params.include;
      if (params.hideEmpty !== undefined) apiParams.hide_empty = params.hideEmpty;
      if (params.orderBy !== undefined) apiParams.orderby = params.orderBy;
      if (params.order !== undefined) apiParams.order = params.order;
      
      // Make API request
      const tags = await client.request<any[]>('/tags', {
        method: 'GET',
        params: apiParams
      });
      
      return {
        tags,
        total: tags.length,
        page: params.page || 1
      };
    },
    ListTagsSchema,
    'List WordPress tags with optional filtering'
  );
  
  // Get a tag by ID
  handler.registerMethod(
    'wp.tags.get',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const tag = await client.request<any>(`/tags/${params.id}`, {
        method: 'GET'
      });
      
      return { tag };
    },
    GetTagSchema,
    'Get a WordPress tag by ID'
  );
  
  // Create a new tag
  handler.registerMethod(
    'wp.tags.create',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, ...tagData } = params;
      
      // Make API request
      const tag = await client.request<any>('/tags', {
        method: 'POST',
        data: tagData
      });
      
      logger.info(`Created tag ${tag.id} on site ${params.site}`, {
        tagId: tag.id,
        site: params.site,
        name: params.name,
        client: context.authContext?.clientId
      });
      
      return { tag };
    },
    CreateTagSchema,
    'Create a new WordPress tag'
  );
  
  // Update a tag
  handler.registerMethod(
    'wp.tags.update',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, id, ...tagData } = params;
      
      // Make API request
      const tag = await client.request<any>(`/tags/${id}`, {
        method: 'POST',
        data: tagData
      });
      
      logger.info(`Updated tag ${id} on site ${params.site}`, {
        tagId: id,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { tag };
    },
    UpdateTagSchema,
    'Update an existing WordPress tag'
  );
  
  // Delete a tag
  handler.registerMethod(
    'wp.tags.delete',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const tag = await client.request<any>(`/tags/${params.id}`, {
        method: 'DELETE',
        params: { force: params.force }
      });
      
      logger.info(`Deleted tag ${params.id} on site ${params.site}`, {
        tagId: params.id,
        site: params.site,
        force: params.force,
        client: context.authContext?.clientId
      });
      
      return { success: true, tag };
    },
    DeleteTagSchema,
    'Delete a WordPress tag'
  );
}
