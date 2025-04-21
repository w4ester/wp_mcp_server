/**
 * WordPress Users Tool
 * 
 * MCP tool implementation for managing WordPress users.
 */

import { z } from 'zod';
import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';
import { RequestContext } from '../../types/context.js';
import { logger } from '../../utils/logger.js';

// Schema for listing users
export const ListUsersSchema = z.object({
  site: z.string().describe('Site identifier'),
  page: z.number().optional().describe('Page number'),
  perPage: z.number().optional().describe('Items per page'),
  search: z.string().optional().describe('Search term'),
  roles: z.union([
    z.string(),
    z.array(z.string())
  ]).optional().describe('Filter by role(s)'),
  orderBy: z.string().optional().describe('Sort field'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  exclude: z.array(z.number()).optional().describe('User IDs to exclude'),
  include: z.array(z.number()).optional().describe('User IDs to include')
});

// Schema for getting a user
export const GetUserSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('User ID')
});

// Schema for creating a user
export const CreateUserSchema = z.object({
  site: z.string().describe('Site identifier'),
  username: z.string().describe('Username (login name)'),
  email: z.string().email().describe('Email address'),
  password: z.string().describe('User password'),
  first_name: z.string().optional().describe('First name'),
  last_name: z.string().optional().describe('Last name'),
  name: z.string().optional().describe('Display name'),
  roles: z.array(z.string()).optional().describe('User roles'),
  url: z.string().optional().describe('User website URL'),
  description: z.string().optional().describe('User description')
});

// Schema for updating a user
export const UpdateUserSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('User ID'),
  email: z.string().email().optional().describe('Email address'),
  password: z.string().optional().describe('User password'),
  first_name: z.string().optional().describe('First name'),
  last_name: z.string().optional().describe('Last name'),
  name: z.string().optional().describe('Display name'),
  roles: z.array(z.string()).optional().describe('User roles'),
  url: z.string().optional().describe('User website URL'),
  description: z.string().optional().describe('User description')
});

// Schema for deleting a user
export const DeleteUserSchema = z.object({
  site: z.string().describe('Site identifier'),
  id: z.number().describe('User ID'),
  reassign: z.number().optional().describe('User ID to reassign posts to'),
  force: z.boolean().optional().default(false).describe('Force delete instead of trash')
});

// Schema for getting current user
export const GetCurrentUserSchema = z.object({
  site: z.string().describe('Site identifier')
});

/**
 * Register users tool methods with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param siteManager WordPress site manager
 */
export function registerUsersTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  // List users
  handler.registerMethod(
    'wp.users.list',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const apiParams: Record<string, any> = {};
      
      if (params.page !== undefined) apiParams.page = params.page;
      if (params.perPage !== undefined) apiParams.per_page = params.perPage;
      if (params.search !== undefined) apiParams.search = params.search;
      if (params.roles !== undefined) apiParams.roles = params.roles;
      if (params.orderBy !== undefined) apiParams.orderby = params.orderBy;
      if (params.order !== undefined) apiParams.order = params.order;
      if (params.exclude !== undefined) apiParams.exclude = params.exclude;
      if (params.include !== undefined) apiParams.include = params.include;
      
      // Make API request
      const users = await client.request<any[]>('/users', {
        method: 'GET',
        params: apiParams
      });
      
      return {
        users,
        total: users.length,
        page: params.page || 1
      };
    },
    ListUsersSchema,
    'List WordPress users with optional filtering'
  );
  
  // Get a user by ID
  handler.registerMethod(
    'wp.users.get',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const user = await client.request<any>(`/users/${params.id}`, {
        method: 'GET'
      });
      
      return { user };
    },
    GetUserSchema,
    'Get a WordPress user by ID'
  );
  
  // Get current user (authenticated user)
  handler.registerMethod(
    'wp.users.me',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const user = await client.request<any>('/users/me', {
        method: 'GET'
      });
      
      return { user };
    },
    GetCurrentUserSchema,
    'Get the currently authenticated WordPress user'
  );
  
  // Create a new user
  handler.registerMethod(
    'wp.users.create',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, ...userData } = params;
      
      // Make API request
      const user = await client.request<any>('/users', {
        method: 'POST',
        data: userData
      });
      
      logger.info(`Created user ${user.id} on site ${params.site}`, {
        userId: user.id,
        site: params.site,
        username: params.username,
        client: context.authContext?.clientId
      });
      
      return { user };
    },
    CreateUserSchema,
    'Create a new WordPress user'
  );
  
  // Update a user
  handler.registerMethod(
    'wp.users.update',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const { site, id, ...userData } = params;
      
      // Make API request
      const user = await client.request<any>(`/users/${id}`, {
        method: 'POST',
        data: userData
      });
      
      logger.info(`Updated user ${id} on site ${params.site}`, {
        userId: id,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { user };
    },
    UpdateUserSchema,
    'Update an existing WordPress user'
  );
  
  // Delete a user
  handler.registerMethod(
    'wp.users.delete',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Prepare delete parameters
      const deleteParams: Record<string, any> = {
        force: params.force
      };
      
      if (params.reassign !== undefined) {
        deleteParams.reassign = params.reassign;
      }
      
      // Make API request
      const user = await client.request<any>(`/users/${params.id}`, {
        method: 'DELETE',
        params: deleteParams
      });
      
      logger.info(`Deleted user ${params.id} on site ${params.site}`, {
        userId: params.id,
        site: params.site,
        reassignTo: params.reassign,
        force: params.force,
        client: context.authContext?.clientId
      });
      
      return { success: true, user };
    },
    DeleteUserSchema,
    'Delete a WordPress user'
  );
}
