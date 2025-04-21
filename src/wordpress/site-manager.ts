/**
 * WordPress Site Manager
 * 
 * Manages multiple WordPress sites and their connections.
 */

import fs from 'fs/promises';
import { WordPressClient } from './client.js';
import { WordPressSiteConfig } from './types.js';
import { logger } from '../utils/logger.js';
import { JsonRpcError } from '../types/json-rpc.js';

/**
 * Interface for secrets management
 */
export interface SecretsManager {
  getCredentials(siteId: string): Promise<{ username: string; applicationPassword: string }>;
  storeCredentials(siteId: string, credentials: { username: string; applicationPassword: string }): Promise<void>;
}

/**
 * Simple file-based secrets manager for development
 */
export class FileSecretsManager implements SecretsManager {
  constructor(private readonly secretsPath: string) {}
  
  async getCredentials(siteId: string): Promise<{ username: string; applicationPassword: string }> {
    try {
      const data = await fs.readFile(this.secretsPath, 'utf8');
      const secrets = JSON.parse(data);
      
      if (!secrets[siteId]) {
        throw new Error(`No credentials found for site: ${siteId}`);
      }
      
      return {
        username: secrets[siteId].username,
        applicationPassword: secrets[siteId].applicationPassword
      };
    } catch (error) {
      logger.error('Failed to load credentials', { error, siteId });
      throw new Error(`Failed to load credentials for site: ${siteId}`);
    }
  }
  
  async storeCredentials(siteId: string, credentials: { username: string; applicationPassword: string }): Promise<void> {
    try {
      let secrets: Record<string, any> = {};
      
      try {
        const data = await fs.readFile(this.secretsPath, 'utf8');
        secrets = JSON.parse(data);
      } catch (error) {
        // File doesn't exist or isn't valid JSON, start with empty object
        logger.info('Creating new secrets file');
      }
      
      secrets[siteId] = credentials;
      
      await fs.writeFile(this.secretsPath, JSON.stringify(secrets, null, 2), 'utf8');
    } catch (error) {
      logger.error('Failed to store credentials', { error, siteId });
      throw new Error('Failed to store credentials');
    }
  }
}

/**
 * Manager for WordPress sites
 */
export class WordPressSiteManager {
  private sites = new Map<string, WordPressSiteConfig>();
  private clients = new Map<string, WordPressClient>();
  
  constructor(
    private readonly configPath: string,
    private readonly secretsManager: SecretsManager
  ) {}
  
  /**
   * Initialize the site manager by loading configurations
   */
  async initialize(): Promise<void> {
    await this.loadSiteConfigurations();
  }
  
  /**
   * Load site configurations from a file
   */
  private async loadSiteConfigurations(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(data);
      
      // Clear existing sites
      this.sites.clear();
      
      // Load each site configuration
      for (const [siteId, siteConfig] of Object.entries<any>(config.sites || {})) {
        try {
          // Get credentials from secrets manager
          const credentials = await this.secretsManager.getCredentials(siteId);
          
          this.sites.set(siteId, {
            ...siteConfig,
            credentials
          });
          
          logger.info(`Loaded configuration for site: ${siteId}`);
        } catch (error) {
          logger.error(`Failed to load configuration for site: ${siteId}`, { error });
        }
      }
      
      logger.info(`Loaded ${this.sites.size} WordPress site configurations`);
    } catch (error) {
      logger.error('Failed to load site configurations', { error });
      throw new Error('Site configuration failed to load');
    }
  }
  
  /**
   * Get a client for a WordPress site
   * @param siteId Site identifier
   * @returns WordPress client
   */
  async getClient(siteId: string): Promise<WordPressClient> {
    // Check if site exists
    if (!this.sites.has(siteId)) {
      throw new JsonRpcError(
        `Unknown WordPress site: ${siteId}`,
        -32001,
        { siteId }
      );
    }
    
    // Return existing client if available
    if (this.clients.has(siteId)) {
      return this.clients.get(siteId)!;
    }
    
    // Create new client
    const config = this.sites.get(siteId)!;
    const client = new WordPressClient(config);
    
    // Check connection to ensure it works
    const isConnected = await client.checkConnection();
    if (!isConnected) {
      throw new JsonRpcError(
        `Failed to connect to WordPress site: ${siteId}`,
        -32002,
        { siteId }
      );
    }
    
    // Store client for reuse
    this.clients.set(siteId, client);
    
    return client;
  }
  
  /**
   * Get all available site IDs
   * @returns Array of site IDs
   */
  getSiteIds(): string[] {
    return Array.from(this.sites.keys());
  }
  
  /**
   * Get site configuration
   * @param siteId Site identifier
   * @returns Site configuration (without credentials)
   */
  getSiteConfig(siteId: string): Omit<WordPressSiteConfig, 'credentials'> | null {
    const config = this.sites.get(siteId);
    if (!config) {
      return null;
    }
    
    // Return config without credentials
    const { credentials, ...safeConfig } = config;
    return safeConfig;
  }
  
  /**
   * Add a new site configuration
   * @param siteId Site identifier
   * @param config Site configuration
   * @param credentials Site credentials
   */
  async addSite(
    siteId: string,
    config: Omit<WordPressSiteConfig, 'credentials'>,
    credentials: { username: string; applicationPassword: string }
  ): Promise<void> {
    // Store credentials in secrets manager
    await this.secretsManager.storeCredentials(siteId, credentials);
    
    // Add site configuration
    this.sites.set(siteId, {
      ...config,
      credentials
    });
    
    // Save configuration to file
    await this.saveSiteConfigurations();
    
    logger.info(`Added new WordPress site: ${siteId}`);
  }
  
  /**
   * Remove a site configuration
   * @param siteId Site identifier
   */
  async removeSite(siteId: string): Promise<void> {
    // Remove client if exists
    if (this.clients.has(siteId)) {
      this.clients.delete(siteId);
    }
    
    // Remove site configuration
    if (this.sites.has(siteId)) {
      this.sites.delete(siteId);
      
      // Save configuration to file
      await this.saveSiteConfigurations();
      
      logger.info(`Removed WordPress site: ${siteId}`);
    }
  }
  
  /**
   * Save site configurations to file
   */
  private async saveSiteConfigurations(): Promise<void> {
    try {
      // Create configuration object without credentials
      const sitesConfig: Record<string, any> = {};
      
      for (const [siteId, config] of this.sites.entries()) {
        const { credentials, ...safeConfig } = config;
        sitesConfig[siteId] = safeConfig;
      }
      
      const configData = JSON.stringify({ sites: sitesConfig }, null, 2);
      
      await fs.writeFile(this.configPath, configData, 'utf8');
    } catch (error) {
      logger.error('Failed to save site configurations', { error });
      throw new Error('Failed to save site configurations');
    }
  }
}
