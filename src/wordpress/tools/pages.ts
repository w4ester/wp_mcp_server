/**
 * WordPress Pages Tool
 * 
 * MCP tool implementation for managing WordPress pages.
 */

import { z } from 'zod';
import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';
import { RequestContext } from '../../types/context.js';
import { logger } from '../../utils/logger.js';

// Schema for listing pages
export const ListPagesSchema = z.object({
  site: z.string().describe('Site identifier'),
  page: z.number().optional().describe('Page number'),
  perPage: z.number().optional().describe('Items per page'),
  search: z.string().optional().describe('Search term'),
  author: z.union([z.number(), z.string()]).optional().describe('Author ID'),
  parent: z.number().optional().describe('Parent page ID'),
  status: z.string().optional().describe('Page status'),
  orderBy: z.string().optional().describe('Sort field'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  slug: z.string().optional().describe('Page slug')
});

// Schema for getting a page
export const GetPageSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Page ID')
});

// Schema for creating a page
export const CreatePageSchema = z.object({
  site: z.string().describe('Site identifier'),
  title: z.string().describe('Page title'),
  content: z.string().describe('Page content'),
  status: z.enum(['publish', 'future', 'draft', 'pending', 'private'])
    .optional()
    .default('draft')
    .describe('Page status'),
  excerpt: z.string().optional().describe('Page excerpt'),
  parent: z.number().optional().describe('Parent page ID'),
  menu_order: z.number().optional().describe('Menu order'),
  template: z.string().optional().describe('Page template'),
  featured_media: z.number().optional().describe('Featured image ID'),
  author: z.number().optional().describe('Author ID')
});

// Schema for updating a page
export const UpdatePageSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Page ID'),
  title: z.string().optional().describe('Page title'),
  content: z.string().optional().describe('Page content'),
  status: z.enum(['publish', 'future', 'draft', 'pending', 'private'])
    .optional()
    .describe('Page status'),
  excerpt: z.string().optional().describe('Page excerpt'),
  parent: z.number().optional().describe('Parent page ID'),
  menu_order: z.number().optional().describe('Menu order'),
  template: z.string().optional().describe('Page template'),
  featured_media: z.number().optional().describe('Featured image ID')
});

// Schema for deleting a page
export const DeletePageSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Page ID'),
  force: z.boolean().optional().default(false).describe('Force delete instead of trash')
});

/**
 * Register pages tool methods with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param siteManager WordPress site manager
 */
export function registerPagesTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  // List pages
  handler.registerMethod(
    'wp.pages.list',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const apiParams: Record<string, any> = {};
      
      if (params.page !== undefined) apiParams.page = params.page;
      if (params.perPage !== undefined) apiParams.per_page = params.perPage;
      if (params.search !== undefined) apiParams.search = params.search;
      if (params.author !== undefined) apiParams.author = params.author;
      if (params.parent !== undefined) apiParams.parent = params.parent;
      if (params.status !== undefined) apiParams.status = params.status;
      if (params.orderBy !== undefined) apiParams.orderby = params.orderBy;
      if (params.order !== undefined) apiParams.order = params.order;
      if (params.slug !== undefined) apiParams.slug = params.slug;
      
      // Make API request
      const pages = await client.getPages(apiParams);
      
      return {
        pages,
        total: pages.length,
        page: params.page || 1
      };
    },
    ListPagesSchema,
    'List WordPress pages with optional filtering'
  );
  
  // Get a page by ID
  handler.registerMethod(
    'wp.pages.get',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const page = await client.getPage(params.id);
      
      return { page };
    },
    GetPageSchema,
    'Get a WordPress page by ID'
  );
  
  // Create a new page
  handler.registerMethod(
    'wp.pages.create',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, ...pageData } = params;
      
      // Make API request - use the same createPost method since the API is similar
      const page = await client.request<any>('/pages', {
        method: 'POST',
        data: pageData
      });
      
      logger.info(`Created page ${page.id} on site ${params.site}`, {
        pageId: page.id,
        site: params.site,
        title: params.title,
        client: context.authContext?.clientId
      });
      
      return { page };
    },
    CreatePageSchema,
    'Create a new WordPress page'
  );
  
  // Update a page
  handler.registerMethod(
    'wp.pages.update',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, id, ...pageData } = params;
      
      // Make API request
      const page = await client.request<any>(`/pages/${id}`, {
        method: 'POST', // WordPress REST API uses POST with ID for updates
        data: pageData
      });
      
      logger.info(`Updated page ${id} on site ${params.site}`, {
        pageId: id,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { page };
    },
    UpdatePageSchema,
    'Update an existing WordPress page'
  );
  
  // Delete a page
  handler.registerMethod(
    'wp.pages.delete',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const page = await client.request<any>(`/pages/${params.id}`, {
        method: 'DELETE',
        params: { force: params.force }
      });
      
      logger.info(`Deleted page ${params.id} on site ${params.site}`, {
        pageId: params.id,
        site: params.site,
        force: params.force,
        client: context.authContext?.clientId
      });
      
      return { success: true, page };
    },
    DeletePageSchema,
    'Delete a WordPress page'
  );
}
