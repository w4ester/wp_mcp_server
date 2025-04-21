/**
 * Authentication Middleware
 * 
 * Handles API key validation and authorization
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/monitoring/index.js';
import { AuthContext } from '../types/context.js';
import { JsonRpcHandler } from '../json-rpc/handler.js';

/**
 * API key definition
 */
interface ApiKey {
  key: string;
  name: string;
  clientId: string;
  permissions: string[];
  authorizedSites: string[];
  active: boolean;
  created: string;
  expires: string | null;
}

/**
 * API key storage
 */
interface ApiKeyStorage {
  keys: ApiKey[];
}

/**
 * API key manager
 */
export class ApiKeyManager {
  private keys: ApiKey[] = [];
  private loading = false;
  private lastLoaded = 0;
  
  constructor(private readonly source: string, private readonly path: string) {}
  
  /**
   * Initialize the API key manager
   */
  async initialize(): Promise<void> {
    await this.loadKeys();
  }
  
  /**
   * Validate an API key
   * @param apiKey API key to validate
   * @returns Validation result
   */
  validateApiKey(apiKey: string): { 
    valid: boolean; 
    clientId?: string; 
    authorizedSites?: string[];
    permissions?: string[];
    scopes?: string[];
  } {
    // Auto-reload keys if needed
    this.reloadIfNeeded();
    
    // Find matching key
    const key = this.keys.find(k => k.key === apiKey);
    
    // Invalid key
    if (!key) {
      metrics.incrementCounter('auth_invalid_key_attempts');
      return { valid: false };
    }
    
    // Inactive key
    if (!key.active) {
      metrics.incrementCounter('auth_inactive_key_attempts');
      return { valid: false };
    }
    
    // Expired key
    if (key.expires && new Date(key.expires) < new Date()) {
      metrics.incrementCounter('auth_expired_key_attempts');
      return { valid: false };
    }
    
    // Valid key
    metrics.incrementCounter('auth_successful_key_validations', {
      clientId: key.clientId
    });
    
    return {
      valid: true,
      clientId: key.clientId,
      authorizedSites: key.authorizedSites,
      permissions: key.permissions,
      scopes: [] // Add scopes if you implement OAuth
    };
  }
  
  /**
   * Load API keys from the configured source
   */
// File: src/middleware/auth.ts
// Around line ~89:

private async loadKeys(): Promise<void> {
  if (this.loading) {
    return;
  }
  
  this.loading = true;
  
  try {
    if (this.source === 'file') {
      await this.loadKeysFromFile();
    } else if (this.source === 'env') {
      this.loadKeysFromEnv();
    } else if (this.source === 'aws') {
      // Implementation for AWS Secrets Manager would go here
      logger.warn('AWS Secrets Manager not implemented yet');
    } else {
      logger.error(`Unknown API key source: ${this.source}`);
    }
    
    this.lastLoaded = Date.now();
  } catch (error) {
    logger.error('Failed to load API keys', { error });
  } finally {
    this.loading = false;
  }
}
  
  /**
   * Load API keys from a file
   */
  // Add this new method to load keys from environment variables
private loadKeysFromEnv(): void {
  try {
    // First try the JSON format for multiple keys
    const apiKeys = process.env.API_KEYS;
    if (apiKeys) {
      try {
        const storage = JSON.parse(apiKeys) as ApiKeyStorage;
        this.keys = storage.keys || [];
        logger.info(`Loaded ${this.keys.length} API keys from environment variable`);
        return;
      } catch (error) {
        logger.warn('Failed to parse API_KEYS as JSON, trying single key format');
      }
    }
    
    // Try single key format
    const singleKey = process.env.API_KEY;
    if (singleKey) {
      this.keys = [{
        key: singleKey,
        name: 'Environment API Key',
        clientId: process.env.API_CLIENT_ID || 'default-client',
        permissions: (process.env.API_PERMISSIONS || 'read,write').split(','),
        authorizedSites: (process.env.API_AUTHORIZED_SITES || '*').split(','),
        active: true,
        created: new Date().toISOString(),
        expires: null
      }];
      logger.info('Loaded single API key from environment variable');
      return;
    }
    
    // No keys found
    logger.warn('No API keys found in environment variables');
    this.keys = [];
  } catch (error) {
    logger.error('Failed to load API keys from environment', { error });
    throw error;
  }
}

/*REMOVE IN PRODUCTION*/
  private async loadKeysFromFile(): Promise<void> {
    try {
      const data = await fs.readFile(this.path, 'utf8');
      const storage = JSON.parse(data) as ApiKeyStorage;
      
      this.keys = storage.keys || [];
      
      logger.info(`Loaded ${this.keys.length} API keys from file`);
    } catch (error) {
      logger.error('Failed to load API keys from file', { error });
      throw error;
    }
  }

/**
   * Reload keys if they haven't been loaded recently
   */
  private reloadIfNeeded(): void {
    // Reload if last loaded more than 5 minutes ago
    const RELOAD_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    if (Date.now() - this.lastLoaded > RELOAD_INTERVAL) {
      // Don't await, just trigger reload
      this.loadKeys().catch(error => {
        logger.error('Failed to reload API keys', { error });
      });
    }
  }
}

/**
 * Create authentication middleware
 * @param manager API key manager
 * @returns Express middleware
 */
export function createAuthMiddleware(manager: ApiKeyManager) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Get API key from header
    const apiKey = req.header('X-API-Key') || req.header('X-MCP-Key');
    
    if (!apiKey) {
      return res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: JsonRpcHandler.ERROR_CODES.WP_AUTH_ERROR,
          message: 'Authentication required',
        },
        id: null
      });
    }
    
    try {
      // Validate API key
      const auth = manager.validateApiKey(apiKey);
      
      if (!auth.valid) {
        return res.status(401).json({
          jsonrpc: '2.0',
          error: {
            code: JsonRpcHandler.ERROR_CODES.WP_AUTH_ERROR,
            message: 'Invalid API key',
          },
          id: null
        });
      }
      
      // Attach auth context to request
      req.authContext = {
        clientId: auth.clientId!,
        authorizedSites: auth.authorizedSites!,
        permissions: auth.permissions!,
        scopes: auth.scopes!
      };
      
      // Add auth context to response headers for debugging in dev
      if (process.env.NODE_ENV === 'development') {
        res.setHeader('X-MCP-Client', auth.clientId!);
      }
      
      // Log access
      logger.debug('Authenticated API request', {
        clientId: auth.clientId,
        ip: req.ip
      });
      
      next();
    } catch (error) {
      logger.error('Authentication error', { error });
      
      return res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: JsonRpcHandler.ERROR_CODES.INTERNAL_ERROR,
          message: 'Authentication service error',
        },
        id: null
      });
    }
  };
}

// Add auth context to Express Request
declare global {
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}
