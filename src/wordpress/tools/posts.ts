/**
 * WordPress Posts Tool
 * 
 * MCP tool implementation for managing WordPress posts.
 */

import { z } from 'zod';
import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';
import { RequestContext } from '../../types/context.js';
import { logger } from '../../utils/logger.js';

// Schema for listing posts
export const ListPostsSchema = z.object({
  site: z.string().describe('Site identifier'),
  page: z.number().optional().describe('Page number'),
  perPage: z.number().optional().describe('Items per page'),
  search: z.string().optional().describe('Search term'),
  author: z.union([z.number(), z.string()]).optional().describe('Author ID'),
  categories: z.union([
    z.number(),
    z.string(),
    z.array(z.union([z.number(), z.string()]))
  ]).optional().describe('Category ID(s)'),
  tags: z.union([
    z.number(),
    z.string(),
    z.array(z.union([z.number(), z.string()]))
  ]).optional().describe('Tag ID(s)'),
  status: z.string().optional().describe('Post status'),
  orderBy: z.string().optional().describe('Sort field'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort direction')
});

// Schema for getting a post
export const GetPostSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Post ID')
});

// Schema for creating a post
export const CreatePostSchema = z.object({
  site: z.string().describe('Site identifier'),
  title: z.string().describe('Post title'),
  content: z.string().describe('Post content'),
  status: z.enum(['publish', 'future', 'draft', 'pending', 'private'])
    .optional()
    .default('draft')
    .describe('Post status'),
  excerpt: z.string().optional().describe('Post excerpt'),
  categories: z.array(z.number()).optional().describe('Category IDs'),
  tags: z.array(z.number()).optional().describe('Tag IDs'),
  featured_media: z.number().optional().describe('Featured image ID'),
  author: z.number().optional().describe('Author ID')
});

// Schema for updating a post
export const UpdatePostSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Post ID'),
  title: z.string().optional().describe('Post title'),
  content: z.string().optional().describe('Post content'),
  status: z.enum(['publish', 'future', 'draft', 'pending', 'private'])
    .optional()
    .describe('Post status'),
  excerpt: z.string().optional().describe('Post excerpt'),
  categories: z.array(z.number()).optional().describe('Category IDs'),
  tags: z.array(z.number()).optional().describe('Tag IDs'),
  featured_media: z.number().optional().describe('Featured image ID')
});

// Schema for deleting a post
export const DeletePostSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('Post ID'),
  force: z.boolean().optional().default(false).describe('Force delete instead of trash')
});

/**
 * Register posts tool methods with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param siteManager WordPress site manager
 */
export function registerPostsTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  // List posts
  handler.registerMethod(
    'wp.posts.list',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const apiParams: Record<string, any> = {};
      
      if (params.page !== undefined) apiParams.page = params.page;
      if (params.perPage !== undefined) apiParams.per_page = params.perPage;
      if (params.search !== undefined) apiParams.search = params.search;
      if (params.author !== undefined) apiParams.author = params.author;
      if (params.categories !== undefined) apiParams.categories = params.categories;
      if (params.tags !== undefined) apiParams.tags = params.tags;
      if (params.status !== undefined) apiParams.status = params.status;
      if (params.orderBy !== undefined) apiParams.orderby = params.orderBy;
      if (params.order !== undefined) apiParams.order = params.order;
      
      // Make API request
      const posts = await client.getPosts(apiParams);
      
      return {
        posts,
        total: posts.length,
        page: params.page || 1
      };
    },
    ListPostsSchema,
    'List WordPress posts with optional filtering'
  );
  
  // Get a post by ID
  handler.registerMethod(
    'wp.posts.get',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const post = await client.getPost(params.id);
      
      return { post };
    },
    GetPostSchema,
    'Get a WordPress post by ID'
  );
  
  // Create a new post
  handler.registerMethod(
    'wp.posts.create',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, ...postData } = params;
      
      // Make API request
      const post = await client.createPost(postData);
      
      logger.info(`Created post ${post.id} on site ${params.site}`, {
        postId: post.id,
        site: params.site,
        title: params.title,
        client: context.authContext?.clientId
      });
      
      return { post };
    },
    CreatePostSchema,
    'Create a new WordPress post'
  );
  
  // Update a post
  handler.registerMethod(
    'wp.posts.update',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, id, ...postData } = params;
      
      // Make API request
      const post = await client.updatePost(id, postData);
      
      logger.info(`Updated post ${id} on site ${params.site}`, {
        postId: id,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { post };
    },
    UpdatePostSchema,
    'Update an existing WordPress post'
  );
  
  // Delete a post
  handler.registerMethod(
    'wp.posts.delete',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const post = await client.deletePost(params.id, params.force);
      
      logger.info(`Deleted post ${params.id} on site ${params.site}`, {
        postId: params.id,
        site: params.site,
        force: params.force,
        client: context.authContext?.clientId
      });
      
      return { success: true, post };
    },
    DeletePostSchema,
    'Delete a WordPress post'
  );
}
