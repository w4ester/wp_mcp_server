/**
 * WordPress API Client
 * 
 * Provides a client for interacting with the WordPress REST API.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/monitoring/index.js';
import { 
  WordPressSiteConfig, 
  WordPressApiOptions,
  WordPressErrorResponse,
  WordPressPost,
  CreatePostRequest,
  WordPressPage,
  WordPressMedia,
  WordPressUser,
  WordPressPlugin,
  WordPressTheme,
  WordPressCategory,
  WordPressTag
} from './types.js';

/**
 * Error class for WordPress API errors
 */
export class WordPressApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly data?: any
  ) {
    super(message);
    this.name = 'WordPressApiError';
  }
}

/**
 * Client for WordPress REST API
 */
export class WordPressClient {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  
  constructor(private readonly config: WordPressSiteConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    
    // Create axios client with auth and defaults
    this.client = axios.create({
      baseURL: `${this.baseUrl}/wp-json/wp/v2`,
      auth: {
        username: config.credentials.username,
        password: config.credentials.applicationPassword
      },
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add request interceptor for metrics
    this.client.interceptors.request.use((config) => {
      // Add timing info
      config.headers = config.headers || {};
      config.headers['X-Request-Start'] = Date.now().toString();
      return config;
    });
    
    // Add response interceptor for metrics and error handling
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const startTime = parseInt(response.config.headers['X-Request-Start'] || '0');
        const duration = startTime ? Date.now() - startTime : 0;
        
        // Record metrics
        metrics.recordHistogram('wordpress_api_request_duration_ms', duration, {
          method: response.config.method || 'unknown',
          endpoint: response.config.url || 'unknown',
          status: response.status.toString()
        });
        
        return response;
      },
      (error: AxiosError) => {
        // Calculate request duration even for errors
        const startTime = parseInt(error.config?.headers?.['X-Request-Start'] || '0');
        const duration = startTime ? Date.now() - startTime : 0;
        
        // Record error metrics
        metrics.incrementCounter('wordpress_api_errors_total', {
          method: error.config?.method || 'unknown',
          endpoint: error.config?.url || 'unknown',
          status: error.response?.status?.toString() || 'network_error'
        });
        
        if (duration > 0) {
          metrics.recordHistogram('wordpress_api_request_duration_ms', duration, {
            method: error.config?.method || 'unknown',
            endpoint: error.config?.url || 'unknown',
            status: error.response?.status?.toString() || 'network_error'
          });
        }
        
        // Transform error to WordPressApiError
        if (error.response) {
          const wpError = error.response.data as WordPressErrorResponse;
          throw new WordPressApiError(
            wpError.message || error.message,
            wpError.code || 'unknown_error',
            error.response.status,
            wpError.data
          );
        }
        
        // Network errors
        throw new WordPressApiError(
          error.message,
          'network_error',
          0
        );
      }
    );
  }
  
  /**
   * Make a request to the WordPress API
   * @param endpoint API endpoint path
   * @param options Request options
   * @returns API response data
   */
  private async request<T>(endpoint: string, options: WordPressApiOptions = {}): Promise<T> {
    const config: AxiosRequestConfig = {
      method: options.method || 'GET',
      url: endpoint,
      params: options.params,
      data: options.data,
      timeout: options.timeout || this.config.timeout,
      headers: options.headers
    };
    
    logger.debug(`WordPress API Request: ${config.method} ${endpoint}`, {
      params: options.params,
      siteUrl: this.baseUrl
    });
    
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      if (error instanceof WordPressApiError) {
        throw error;
      }
      
      // Rethrow other errors
      throw error;
    }
  }
  
  /**
   * Get a list of posts
   * @param params Query parameters
   * @returns List of posts
   */
  async getPosts(params: Record<string, any> = {}): Promise<WordPressPost[]> {
    return this.request<WordPressPost[]>('/posts', { params });
  }
  
  /**
   * Get a single post by ID
   * @param id Post ID
   * @param params Query parameters
   * @returns Post data
   */
  async getPost(id: number, params: Record<string, any> = {}): Promise<WordPressPost> {
    return this.request<WordPressPost>(`/posts/${id}`, { params });
  }
  
  /**
   * Create a new post
   * @param data Post data
   * @returns Created post
   */
  async createPost(data: CreatePostRequest): Promise<WordPressPost> {
    return this.request<WordPressPost>('/posts', {
      method: 'POST',
      data
    });
  }
  
  /**
   * Update an existing post
   * @param id Post ID
   * @param data Post data
   * @returns Updated post
   */
  async updatePost(id: number, data: Partial<CreatePostRequest>): Promise<WordPressPost> {
    return this.request<WordPressPost>(`/posts/${id}`, {
      method: 'POST', // WordPress REST API uses POST with ID for updates
      data
    });
  }
  
  /**
   * Delete a post
   * @param id Post ID
   * @param force Force deletion instead of trash
   * @returns Deleted post
   */
  async deletePost(id: number, force: boolean = false): Promise<WordPressPost> {
    return this.request<WordPressPost>(`/posts/${id}`, {
      method: 'DELETE',
      params: { force }
    });
  }
  
  /**
   * Get a list of pages
   * @param params Query parameters
   * @returns List of pages
   */
  async getPages(params: Record<string, any> = {}): Promise<WordPressPage[]> {
    return this.request<WordPressPage[]>('/pages', { params });
  }
  
  /**
   * Get a single page by ID
   * @param id Page ID
   * @param params Query parameters
   * @returns Page data
   */
  async getPage(id: number, params: Record<string, any> = {}): Promise<WordPressPage> {
    return this.request<WordPressPage>(`/pages/${id}`, { params });
  }
  
  /**
   * Get a list of media items
   * @param params Query parameters
   * @returns List of media items
   */
  async getMedia(params: Record<string, any> = {}): Promise<WordPressMedia[]> {
    return this.request<WordPressMedia[]>('/media', { params });
  }
  
  /**
   * Get a list of users
   * @param params Query parameters
   * @returns List of users
   */
  async getUsers(params: Record<string, any> = {}): Promise<WordPressUser[]> {
    return this.request<WordPressUser[]>('/users', { params });
  }
  
  /**
   * Get a list of categories
   * @param params Query parameters
   * @returns List of categories
   */
  async getCategories(params: Record<string, any> = {}): Promise<WordPressCategory[]> {
    return this.request<WordPressCategory[]>('/categories', { params });
  }
  
  /**
   * Get a list of tags
   * @param params Query parameters
   * @returns List of tags
   */
  async getTags(params: Record<string, any> = {}): Promise<WordPressTag[]> {
    return this.request<WordPressTag[]>('/tags', { params });
  }
  
  /**
   * Get a list of plugins
   * @param params Query parameters
   * @returns List of plugins
   */
  async getPlugins(params: Record<string, any> = {}): Promise<WordPressPlugin[]> {
    return this.request<WordPressPlugin[]>('/plugins', { params });
  }
  
  /**
   * Get a list of themes
   * @param params Query parameters
   * @returns List of themes
   */
  async getThemes(params: Record<string, any> = {}): Promise<WordPressTheme[]> {
    return this.request<WordPressTheme[]>('/themes', { params });
  }
  
  /**
   * Check if we can connect to the WordPress site
   * @returns True if connection is successful
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.request<any>('/');
      return true;
    } catch (error) {
      logger.error('WordPress connection check failed', { 
        error, 
        baseUrl: this.baseUrl 
      });
      return false;
    }
  }
}
