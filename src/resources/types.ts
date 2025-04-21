/**
 * MCP Resource Types
 * 
 * Types and interfaces for MCP Resources representing WordPress entities.
 */

import { z } from 'zod';

/**
 * Resource URI format: wordpress://site/type/id
 */
export class ResourceUri {
  private static readonly SCHEME = 'wordpress';
  
  /**
   * Create a URI for a WordPress resource
   * @param site Site identifier
   * @param type Resource type (posts, pages, media, etc.)
   * @param id Resource ID
   * @returns Resource URI string
   */
  static create(site: string, type: string, id: string): string {
    return `${this.SCHEME}://${site}/${type}/${id}`;
  }
  
  /**
   * Parse a resource URI into its components
   * @param uri Resource URI string
   * @returns URI components or null if invalid
   */
  static parse(uri: string): { site: string; type: string; id: string } | null {
    const pattern = new RegExp(`^${this.SCHEME}://([^/]+)/([^/]+)/([^/]+)$`);
    const match = uri.match(pattern);
    
    if (!match) {
      return null;
    }
    
    return {
      site: match[1],
      type: match[2],
      id: match[3]
    };
  }
}

/**
 * Schema for WordPress resource
 */
export const ResourceSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mimeType: z.string(),
  metadata: z.record(z.unknown()).optional()
});

export type Resource = z.infer<typeof ResourceSchema>;

/**
 * Schema for resource content
 */
export const ResourceContentSchema = z.object({
  uri: z.string(),
  mimeType: z.string(),
  text: z.string().optional(),
  blob: z.string().optional(), // Base64 encoded binary data
  metadata: z.record(z.unknown()).optional()
});

export type ResourceContent = z.infer<typeof ResourceContentSchema>;

/**
 * Resource type specific MIME types
 */
export const MIME_TYPES = {
  POST: 'application/vnd.wordpress.post+json',
  PAGE: 'application/vnd.wordpress.page+json',
  MEDIA: 'application/vnd.wordpress.media+json',
  USER: 'application/vnd.wordpress.user+json',
  CATEGORY: 'application/vnd.wordpress.category+json',
  TAG: 'application/vnd.wordpress.tag+json',
  PLUGIN: 'application/vnd.wordpress.plugin+json',
  THEME: 'application/vnd.wordpress.theme+json'
} as const;

/**
 * Interface for resource providers
 */
export interface ResourceProvider {
  /**
   * List available resources
   * @param site Optional site filter
   * @returns List of resources
   */
  listResources(site?: string): Promise<Resource[]>;
  
  /**
   * Get resource content by URI
   * @param uri Resource URI
   * @returns Resource content or null if not found
   */
  getResourceContent(uri: string): Promise<ResourceContent | null>;
}
