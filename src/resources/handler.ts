/**
 * MCP Resources JSON-RPC Handler
 * 
 * Handles JSON-RPC requests for MCP resources.
 */

import { z } from 'zod';
import { JsonRpcHandler } from '../json-rpc/handler.js';
import { WordPressResourceManager } from './resource-manager.js';
import { RequestContext } from '../types/context.js';
import { logger } from '../utils/logger.js';

// Schema for listing resources
export const ListResourcesSchema = z.object({
  site: z.string().optional().describe('Optional site filter'),
  type: z.string().optional().describe('Optional resource type filter')
});

// Schema for getting resource content
export const GetResourceContentSchema = z.object({
  uri: z.string().describe('Resource URI')
});

/**
 * Register resource methods with the JSON-RPC handler
 * @param handler JSON-RPC handler
 * @param resourceManager WordPress resource manager
 */
export function registerResourceMethods(
  handler: JsonRpcHandler,
  resourceManager: WordPressResourceManager
): void {
  // List resources
  handler.registerMethod(
    'resources.list',
    async (params, context) => {
      logger.info('Listing resources', {
        site: params.site,
        type: params.type,
        client: context.authContext?.clientId
      });
      
      const resources = await resourceManager.listResources(params.site);
      
      // Filter by type if specified
      if (params.type) {
        return {
          resources: resources.filter(r => r.uri.includes(`/${params.type}/`))
        };
      }
      
      return { resources };
    },
    ListResourcesSchema,
    'List available WordPress resources'
  );
  
  // Get resource content
  handler.registerMethod(
    'resources.get',
    async (params, context) => {
      logger.info('Getting resource content', {
        uri: params.uri,
        client: context.authContext?.clientId
      });
      
      const content = await resourceManager.getResourceContent(params.uri);
      
      if (!content) {
        throw new Error(`Resource not found: ${params.uri}`);
      }
      
      return { content };
    },
    GetResourceContentSchema,
    'Get content for a specific WordPress resource'
  );
}
