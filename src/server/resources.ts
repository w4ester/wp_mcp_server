/**
 * MCP Resources HTTP Endpoint
 * 
 * Exposes MCP resources via HTTP following the MCP REST protocol.
 */

import { Router, Request, Response } from 'express';
import { WordPressResourceManager } from '../resources/resource-manager.js';
import { logger } from '../utils/logger.js';

/**
 * Create Express router for MCP resources
 * @param resourceManager WordPress resource manager
 * @returns Express router
 */
export function createResourceRouter(resourceManager: WordPressResourceManager): Router {
  const router = Router();
  
  // List resources endpoint
  router.get('/resources', async (req: Request, res: Response) => {
    try {
      // Extract filters from query parameters
      const site = req.query.site as string | undefined;
      const type = req.query.type as string | undefined;
      
      // Get client info from request
      const clientId = (req as any).authContext?.clientId || 'anonymous';
      
      logger.info('HTTP: List resources request', {
        site,
        type,
        clientId
      });
      
      // Get resources
      const resources = await resourceManager.listResources(site);
      
      // Filter by type if specified
      let filteredResources = resources;
      if (type) {
        filteredResources = resources.filter(r => r.uri.includes(`/${type}/`));
      }
      
      res.json({
        resources: filteredResources,
        _metadata: {
          total: filteredResources.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error listing resources:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get resource content endpoint
  router.get('/resources/:uri(*)', async (req: Request, res: Response) => {
    try {
      const uri = decodeURIComponent(req.params.uri);
      
      // Get client info from request
      const clientId = (req as any).authContext?.clientId || 'anonymous';
      
      logger.info('HTTP: Get resource content request', {
        uri,
        clientId
      });
      
      // Get resource content
      const content = await resourceManager.getResourceContent(uri);
      
      if (!content) {
        res.status(404).json({
          error: 'Resource not found',
          uri
        });
        return;
      }
      
      // Set appropriate content headers
      res.setHeader('Content-Type', content.mimeType);
      res.setHeader('X-MCP-Resource-Uri', uri);
      
      // Return text content for JSON resources
      if (content.mimeType.includes('json')) {
        res.send(content.text);
      }
      // Return binary content for media
      else if (content.blob) {
        const buffer = Buffer.from(content.blob, 'base64');
        res.send(buffer);
      }
      // Return text content for others
      else {
        res.send(content.text);
      }
    } catch (error) {
      logger.error('Error getting resource content:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get resource metadata endpoint
  router.head('/resources/:uri(*)', async (req: Request, res: Response) => {
    try {
      const uri = decodeURIComponent(req.params.uri);
      
      // Get client info from request
      const clientId = (req as any).authContext?.clientId || 'anonymous';
      
      logger.info('HTTP: Get resource metadata request', {
        uri,
        clientId
      });
      
      // Get resource content but only return headers
      const content = await resourceManager.getResourceContent(uri);
      
      if (!content) {
        res.status(404).end();
        return;
      }
      
      // Set appropriate headers
      res.setHeader('Content-Type', content.mimeType);
      res.setHeader('X-MCP-Resource-Uri', uri);
      if (content.metadata) {
        res.setHeader('X-MCP-Resource-Metadata', JSON.stringify(content.metadata));
      }
      
      res.end();
    } catch (error) {
      logger.error('Error getting resource metadata:', error);
      res.status(500).end();
    }
  });
  
  return router;
}
