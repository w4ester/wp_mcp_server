/**
 * WordPress Themes Tool
 * 
 * MCP tool implementation for managing WordPress themes.
 */

import { z } from 'zod';
import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';
import { RequestContext } from '../../types/context.js';
import { logger } from '../../utils/logger.js';

// Schema for listing themes
export const ListThemesSchema = z.object({
  site: z.string().describe('Site identifier'),
  status: z.enum(['active', 'inactive']).optional().describe('Theme status filter'),
  context: z.enum(['view', 'embed', 'edit']).optional().describe('Context for the request')
});

// Schema for getting a theme
export const GetThemeSchema = z.object({
  site: z.string().describe('Site identifier'),
  stylesheet: z.string().describe('Theme stylesheet (theme directory name)')
});

// Schema for installing a theme
export const InstallThemeSchema = z.object({
  site: z.string().describe('Site identifier'),
  slug: z.string().describe('Theme slug from WordPress.org repository')
});

// Schema for activating a theme
export const ActivateThemeSchema = z.object({
  site: z.string().describe('Site identifier'),
  stylesheet: z.string().describe('Theme stylesheet (theme directory name)')
});

// Schema for updating a theme
export const UpdateThemeSchema = z.object({
  site: z.string().describe('Site identifier'),
  stylesheet: z.string().describe('Theme stylesheet (theme directory name)')
});

// Schema for deleting a theme
export const DeleteThemeSchema = z.object({
  site: z.string().describe('Site identifier'),
  stylesheet: z.string().describe('Theme stylesheet (theme directory name)')
});

/**
 * Register themes tool methods with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param siteManager WordPress site manager
 */
export function registerThemesTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  // List themes
  handler.registerMethod(
    'wp.themes.list',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const apiParams: Record<string, any> = {};
      
      if (params.status !== undefined) apiParams.status = params.status;
      if (params.context !== undefined) apiParams.context = params.context;
      
      // Make API request
      const themes = await client.request<any[]>('/themes', {
        method: 'GET',
        params: apiParams
      });
      
      return {
        themes,
        total: themes.length
      };
    },
    ListThemesSchema,
    'List WordPress themes with optional filtering'
  );
  
  // Get a theme by ID
  handler.registerMethod(
    'wp.themes.get',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const theme = await client.request<any>(`/themes/${encodeURIComponent(params.stylesheet)}`, {
        method: 'GET'
      });
      
      return { theme };
    },
    GetThemeSchema,
    'Get a WordPress theme by stylesheet name'
  );
  
  // Install a theme
  handler.registerMethod(
    'wp.themes.install',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const theme = await client.request<any>('/themes', {
        method: 'POST',
        data: {
          slug: params.slug
        }
      });
      
      logger.info(`Installed theme ${params.slug} on site ${params.site}`, {
        theme: params.slug,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { theme };
    },
    InstallThemeSchema,
    'Install a WordPress theme from the theme repository'
  );
  
  // Activate a theme
  handler.registerMethod(
    'wp.themes.activate',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const theme = await client.request<any>(`/themes/${encodeURIComponent(params.stylesheet)}`, {
        method: 'POST',
        data: {
          status: 'active'
        }
      });
      
      logger.info(`Activated theme ${params.stylesheet} on site ${params.site}`, {
        theme: params.stylesheet,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { theme };
    },
    ActivateThemeSchema,
    'Activate a WordPress theme'
  );
  
  // Update a theme
  handler.registerMethod(
    'wp.themes.update',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const theme = await client.request<any>(`/themes/${encodeURIComponent(params.stylesheet)}`, {
        method: 'PUT'
      });
      
      logger.info(`Updated theme ${params.stylesheet} on site ${params.site}`, {
        theme: params.stylesheet,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { theme };
    },
    UpdateThemeSchema,
    'Update a WordPress theme to its latest version'
  );
  
  // Delete a theme
  handler.registerMethod(
    'wp.themes.delete',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const theme = await client.request<any>(`/themes/${encodeURIComponent(params.stylesheet)}`, {
        method: 'DELETE'
      });
      
      logger.info(`Deleted theme ${params.stylesheet} on site ${params.site}`, {
        theme: params.stylesheet,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { success: true, theme };
    },
    DeleteThemeSchema,
    'Delete a WordPress theme'
  );
}
