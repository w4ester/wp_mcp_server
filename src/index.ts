/**
 * WordPress MCP Server
 * 
 * Main entry point for the WordPress MCP server with specialized tools
 * for WordPress site development and management
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables early in the process
try {
  // First try to load .env.local if it exists (for local overrides)
  const localEnvPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  }
  
  // Then load the standard .env file
  const result = dotenv.config();
  if (result.error) {
    console.warn('Warning: .env file not found or has syntax errors');
  }
} catch (error) {
  console.error('Error loading environment variables:', error);
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './utils/logger.js';
import { metrics } from './utils/monitoring/index.js';
import { JsonRpcHandler } from './json-rpc/handler.js';
import { WordPressSiteManager, FileSecretsManager, EnvSecretsManager } from './wordpress/site-manager.js';
import { ApiKeyManager } from './middleware/auth.js';
import { createHttpServer } from './server/http.js';
import { registerPostsTools } from './wordpress/tools/posts.js';
import { registerAllWordPressTools } from './wordpress/tools/index.js';
import { WordPressResourceManager, registerResourceMethods } from './resources/index.js';

/**
 * Load configuration based on environment with environment variable overrides
 */
function loadConfig() {
  const env = process.env.NODE_ENV || 'development';
  const configPath = path.resolve(process.cwd(), 'config', `${env}.json`);
  
  let config;
  try {
    if (!fs.existsSync(configPath)) {
      logger.warn(`Config file not found: ${configPath}, falling back to default.json`);
      config = require('../config/default.json');
    } else {
      config = require(configPath);
    }
    
    // Apply environment variable overrides
    applyEnvironmentOverrides(config);
    
    // Validate critical configuration
    validateConfig(config);
    
    return config;
  } catch (error) {
    logger.error('Failed to load configuration', { error });
    throw new Error('Configuration failed to load: ' + error.message);
  }
}

/**
 * Apply environment variable overrides to configuration
 */
function applyEnvironmentOverrides(config) {
  // Server configuration
  if (process.env.PORT) config.server.port = parseInt(process.env.PORT, 10);
  if (process.env.HOST) config.server.host = process.env.HOST;
  
  // API key configuration
  if (process.env.API_KEY_SOURCE) config.security.apiKeys.source = process.env.API_KEY_SOURCE;
  if (process.env.API_KEY_PATH) config.security.apiKeys.path = process.env.API_KEY_PATH;
  
  // WordPress configuration
  if (process.env.WP_SITES_CONFIG_PATH) config.wordpress.sitesConfigPath = process.env.WP_SITES_CONFIG_PATH;
  if (process.env.WP_SECRETS_PATH) config.wordpress.secretsPath = process.env.WP_SECRETS_PATH;
  if (process.env.WP_SECRETS_SOURCE) config.wordpress.secretsSource = process.env.WP_SECRETS_SOURCE;
  if (process.env.WP_API_TIMEOUT) config.wordpress.apiTimeout = parseInt(process.env.WP_API_TIMEOUT, 10);
  
  // Logging configuration
  if (process.env.LOG_LEVEL) config.logging.level = process.env.LOG_LEVEL;
  
  return config;
}

/**
 * Validate critical configuration
 */
function validateConfig(config) {
  if (!config.server) {
    throw new Error('Server configuration missing');
  }
  
  if (!config.security || !config.security.apiKeys) {
    throw new Error('Security configuration missing');
  }
  
  if (!config.wordpress) {
    throw new Error('WordPress configuration missing');
  }
  
  return true;
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
    
    // Initialize secrets manager based on configuration
    let secretsManager;
    if (config.wordpress.secretsSource === 'env') {
      secretsManager = new EnvSecretsManager();
    } else {
      secretsManager = new FileSecretsManager(config.wordpress.secretsPath);
    }
    
    // Initialize site manager
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


/*Updates Key Security Improvements
Enhanced Environment Variable Loading:
First tries to load .env.local for local overrides
Then loads standard .env file with proper error handling
Logs warnings instead of failing if files don't exist


Robust Configuration Loading:
Added function to override JSON config with environment variables
Added validation for critical configuration sections
Better error handling with descriptive messages

Conditional Secrets Manager:
Uses EnvSecretsManager when secretsSource is set to 'env'
Falls back to FileSecretsManager for backward compatibility
(Note: EnvSecretsManager class needs to be implemented in src/wordpress/site-manager.ts)

Configuration Validation:
Validates critical configuration sections before using them
Provides clear error messages for missing configuration

This implementation maintains the overall architecture while adding important security improvements. The additions are meant to be backward compatible, so existing deployments should continue to work while allowing for more secure configurations via environment variables.*/