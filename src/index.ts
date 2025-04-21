/**
 * WordPress MCP Server
 * 
 * Main entry point for the WordPress MCP server with specialized tools
 * for WordPress site development and management
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './utils/logger.js';
import { metrics } from './utils/monitoring/index.js';
import { JsonRpcHandler } from './json-rpc/handler.js';
import { WordPressSiteManager, FileSecretsManager } from './wordpress/site-manager.js';
import { ApiKeyManager } from './middleware/auth.js';
import { createHttpServer } from './server/http.js';
import { registerPostsTools } from './wordpress/tools/posts.js';
import { registerAllWordPressTools } from './wordpress/tools/index.js';
import { WordPressResourceManager, registerResourceMethods } from './resources/index.js';

// Load environment variables
dotenv.config();

/**
 * Load configuration based on environment
 */
function loadConfig() {
  const env = process.env.NODE_ENV || 'development';
  const configPath = path.resolve(process.cwd(), 'config', `${env}.json`);
  
  if (!fs.existsSync(configPath)) {
    logger.warn(`Config file not found: ${configPath}, falling back to default.json`);
    return require('../config/default.json');
  }
  
  return require(configPath);
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Load configuration
    const config = loadConfig();
    logger.info(`Starting WordPress MCP Server in ${config.environment} mode`);
    
    // Initialize API key manager
    const apiKeyManager = new ApiKeyManager(
      config.security.apiKeys.source,
      config.security.apiKeys.path
    );
    await apiKeyManager.initialize();
    
    // Initialize site manager
    const secretsManager = new FileSecretsManager(config.wordpress.secretsPath);
    const siteManager = new WordPressSiteManager(
      config.wordpress.sitesConfigPath,
      secretsManager
    );
    await siteManager.initialize();
    
    // Create resource manager
    const resourceManager = new WordPressResourceManager(siteManager);
    
    // Create MCP server
    const mcpServer = new McpServer({
      name: config.mcp.name,
      version: config.mcp.version
    });
    
    // Create JSON-RPC handler
    const jsonRpcHandler = new JsonRpcHandler();
    
    // Register WordPress tools
    registerAllWordPressTools(jsonRpcHandler, siteManager);
    
    // Register resource methods
    registerResourceMethods(jsonRpcHandler, resourceManager);
    
    // Start the appropriate transport
    if (config.mcp.transport === 'stdio') {
      // STDIO transport (for CLI use)
      const transport = new StdioServerTransport();
      await mcpServer.connect(transport);
      
      logger.info('WordPress MCP Server running with stdio transport');
    } else {
      // HTTP transport
      const httpServer = await createHttpServer(
        mcpServer,
        jsonRpcHandler,
        apiKeyManager,
        resourceManager,
        config.server
      );
      
      // Setup graceful shutdown
      const shutdown = () => {
        logger.info('Shutting down server...');
        httpServer.close(() => {
          logger.info('Server shutdown complete');
          process.exit(0);
        });
      };
      
      // Handle termination signals
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    }
  } catch (error) {
    logger.error('Server initialization failed', { error });
    process.exit(1);
  }
}

// Start the server
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
