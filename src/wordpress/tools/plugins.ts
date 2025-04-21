/**
 * WordPress Plugins Tool
 * 
 * MCP tool implementation for managing WordPress plugins.
 */

import { z } from 'zod';
import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';
import { RequestContext } from '../../types/context.js';
import { logger } from '../../utils/logger.js';

// Schema for listing plugins
export const ListPluginsSchema = z.object({
  site: z.string().describe('Site identifier'),
  search: z.string().optional().describe('Search term'),
  status: z.enum(['active', 'inactive', 'recently_activated', 'upgrade', 'mustuse', 'dropins']).optional().describe('Plugin status filter'),
  context: z.enum(['view', 'embed', 'edit']).optional().describe('Context for the request')
});

// Schema for getting a plugin
export const GetPluginSchema = z.object({
  site: z.string().describe('Site identifier'),
  plugin: z.string().describe('Plugin file path (e.g., akismet/akismet.php)')
});

// Schema for installing a plugin
export const InstallPluginSchema = z.object({
  site: z.string().describe('Site identifier'),
  slug: z.string().describe('Plugin slug from WordPress.org repository'),
  status: z.enum(['active', 'inactive']).optional().default('inactive').describe('Status after installation')
});

// Schema for activating a plugin
export const ActivatePluginSchema = z.object({
  site: z.string().describe('Site identifier'),
  plugin: z.string().describe('Plugin file path (e.g., akismet/akismet.php)')
});

// Schema for deactivating a plugin
export const DeactivatePluginSchema = z.object({
  site: z.string().describe('Site identifier'),
  plugin: z.string().describe('Plugin file path (e.g., akismet/akismet.php)')
});

// Schema for updating a plugin
export const UpdatePluginSchema = z.object({
  site: z.string().describe('Site identifier'),
  plugin: z.string().describe('Plugin file path (e.g., akismet/akismet.php)')
});

// Schema for deleting a plugin
export const DeletePluginSchema = z.object({
  site: z.string().describe('Site identifier'),
  plugin: z.string().describe('Plugin file path (e.g., akismet/akismet.php)')
});

/**
 * Register plugins tool methods with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param siteManager WordPress site manager
 */
export function registerPluginsTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  // List plugins
  handler.registerMethod(
    'wp.plugins.list',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Convert params for WordPress API
      const apiParams: Record<string, any> = {};
      
      if (params.search !== undefined) apiParams.search = params.search;
      if (params.status !== undefined) apiParams.status = params.status;
      if (params.context !== undefined) apiParams.context = params.context;
      
      // Make API request
      const plugins = await client.request<any[]>('/plugins', {
        method: 'GET',
        params: apiParams
      });
      
      return {
        plugins,
        total: plugins.length
      };
    },
    ListPluginsSchema,
    'List WordPress plugins with optional filtering'
  );
  
  // Get a plugin by ID
  handler.registerMethod(
    'wp.plugins.get',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const plugin = await client.request<any>(`/plugins/${encodeURIComponent(params.plugin)}`, {
        method: 'GET'
      });
      
      return { plugin };
    },
    GetPluginSchema,
    'Get a WordPress plugin by ID'
  );
  
  // Install a plugin
  handler.registerMethod(
    'wp.plugins.install',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const plugin = await client.request<any>('/plugins', {
        method: 'POST',
        data: {
          slug: params.slug,
          status: params.status
        }
      });
      
      logger.info(`Installed plugin ${params.slug} on site ${params.site}`, {
        plugin: params.slug,
        site: params.site,
        status: params.status,
        client: context.authContext?.clientId
      });
      
      return { plugin };
    },
    InstallPluginSchema,
    'Install a WordPress plugin from the plugin repository'
  );
  
  // Activate a plugin
  handler.registerMethod(
    'wp.plugins.activate',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const plugin = await client.request<any>(`/plugins/${encodeURIComponent(params.plugin)}`, {
        method: 'POST',
        data: {
          status: 'active'
        }
      });
      
      logger.info(`Activated plugin ${params.plugin} on site ${params.site}`, {
        plugin: params.plugin,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { plugin };
    },
    ActivatePluginSchema,
    'Activate a WordPress plugin'
  );
  
  // Deactivate a plugin
  handler.registerMethod(
    'wp.plugins.deactivate',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const plugin = await client.request<any>(`/plugins/${encodeURIComponent(params.plugin)}`, {
        method: 'POST',
        data: {
          status: 'inactive'
        }
      });
      
      logger.info(`Deactivated plugin ${params.plugin} on site ${params.site}`, {
        plugin: params.plugin,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { plugin };
    },
    DeactivatePluginSchema,
    'Deactivate a WordPress plugin'
  );
  
  // Update a plugin
  handler.registerMethod(
    'wp.plugins.update',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const plugin = await client.request<any>(`/plugins/${encodeURIComponent(params.plugin)}`, {
        method: 'PUT'
      });
      
      logger.info(`Updated plugin ${params.plugin} on site ${params.site}`, {
        plugin: params.plugin,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { plugin };
    },
    UpdatePluginSchema,
    'Update a WordPress plugin to its latest version'
  );
  
  // Delete a plugin
  handler.registerMethod(
    'wp.plugins.delete',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      
      // Make API request
      const plugin = await client.request<any>(`/plugins/${encodeURIComponent(params.plugin)}`, {
        method: 'DELETE'
      });
      
      logger.info(`Deleted plugin ${params.plugin} on site ${params.site}`, {
        plugin: params.plugin,
        site: params.site,
        client: context.authContext?.clientId
      });
      
      return { success: true, plugin };
    },
    DeletePluginSchema,
    'Delete a WordPress plugin'
  );
}
