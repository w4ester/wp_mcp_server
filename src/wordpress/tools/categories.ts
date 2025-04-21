/**
 * WordPress Categories Tool
 * 
 * MCP tool implementation for managing WordPress categories.
 */

import { z } from 'zod';
import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';
import { RequestContext } from '../../types/context.js';
import { logger } from '../../utils/logger.js';

// Schema for listing categories
export const ListCategoriesSchema = z.object({
  site: z.string().describe('Site identifier'),
  page: z.number().optional().describe('Page number'),
  perPage: z.number().optional().describe('Items per page'),
  search: z.string().optional().describe('Search term'),
  exclude: z.array(z.number()).optional().describe('Category IDs to exclude'),
  include: z.array(z.number()).optional().describe('Category IDs to include'),
  hideEmpty: z.boolean().optional().describe('Hide empty categories'),
  parent: z.number().optional().describe('Parent category ID'),
  orderBy: z.string().optional().describe('Sort field'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort direction')
});

// Schema for getting a category
export const GetCategorySchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Category ID')
});

// Schema for creating a category
export const CreateCategorySchema = z.object({
  site: z.string().describe('Site identifier'),
  name: z.string().describe('Category name'),
  description: z.string().optional().describe('Category description'),
  slug: z.string().optional().describe('Category slug'),
  parent: z.number().optional().describe('Parent category ID')
});

// Schema for updating a category
export const UpdateCategorySchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Category ID'),
  name: z.string().optional().describe('Category name'),
  description: z.string().optional().describe('Category description'),
  slug: z.string().optional().describe('Category slug'),
  parent: z.number().optional().describe('Parent category ID')
});

// Schema for deleting a category
export const DeleteCategorySchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Category ID'),
  force: z.boolean().optional().default(false).describe('Force delete instead of trash')
});

/**
 * Register categories tool methods with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param siteManager WordPress site manager
 */
export function registerCategoriesTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  // List categories
  handler.registerMethod(
    'wp.categories.list',
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
      if (params.parent !== undefined) apiParams.parent = params.parent;
      if (params.orderBy !== undefined) apiParams.orderby = params.orderBy;
      if (params.order !== undefined) apiParams.order = params.order;
      
      // Make API request
      const categories = await client.request<any[]>('/categories', {
        method: 'GET',
        params: apiParams
      });
      
      return {
        categories,
        total: categories.length,
        page: params.page || 1
      };
    },
    ListCategoriesSchema,
    'List WordPress categories with optional filtering'
  );
  
  // Get a category by ID
  handler.registerMethod(
    'wp.categories.get',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const category = await client.request<any>(`/categories/${params.id}`, {
        method: 'GET'
      });
      
      return { category };
    },
    GetCategorySchema,
    'Get a WordPress category by ID'
  );
  
  // Create a new category
  handler.registerMethod(
    'wp.categories.create',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, ...categoryData } = params;
      
      // Make API request
      const category = await client.request<any>('/categories', {
        method: 'POST',
        data: categoryData
      });
      
      logger.info(`Created category ${category.id} on site ${params.site}`, {
        categoryId: category.id,
        site: params.site,
        name: params.name,
        client: context.authContext?.clientId
      });
      
      return { category };
    },
    CreateCategorySchema,
    'Create a new WordPress category'
  );
  
  // Update a category
  handler.registerMethod(
    'wp.categories.update',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, id, ...categoryData } = params;
      
      // Make API request
      const category = await client.request<any>(`/categories/${id}`, {
        method: 'POST',
        data: categoryData
      });
      
      logger.info(`Updated category ${id} on site ${params.site}`, {
        categoryId: id,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { category };
    },
    UpdateCategorySchema,
    'Update an existing WordPress category'
  );
  
  // Delete a category
  handler.registerMethod(
    'wp.categories.delete',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const category = await client.request<any>(`/categories/${params.id}`, {
        method: 'DELETE',
        params: { force: params.force }
      });
      
      logger.info(`Deleted category ${params.id} on site ${params.site}`, {
        categoryId: params.id,
        site: params.site,
        force: params.force,
        client: context.authContext?.clientId
      });
      
      return { success: true, category };
    },
    DeleteCategorySchema,
    'Delete a WordPress category'
  );
}
