/**
 * WordPress Resource Manager
 * 
 * Manages MCP Resources for WordPress entities.
 */

import { Resource, ResourceContent, ResourceProvider, ResourceUri, MIME_TYPES } from './types.js';
import { WordPressSiteManager } from '../wordpress/site-manager.js';
import { logger } from '../utils/logger.js';

export class WordPressResourceManager implements ResourceProvider {
  constructor(private siteManager: WordPressSiteManager) {}
  
  /**
   * List all available WordPress resources
   * @param site Optional site filter
   * @returns List of resources
   */
  async listResources(site?: string): Promise<Resource[]> {
    const resources: Resource[] = [];
    const sites = site ? [{ name: site }] : this.siteManager.listSites();
    
    try {
      for (const siteConfig of sites) {
        const client = await this.siteManager.getClient(siteConfig.name);
        
        // Add site-level resource
        resources.push({
          uri: ResourceUri.create(siteConfig.name, 'site', 'info'),
          name: `WordPress Site: ${siteConfig.name}`,
          description: `WordPress site configuration and information`,
          mimeType: 'application/vnd.wordpress.site+json'
        });
        
        // List posts
        try {
          const posts = await client.getPosts({ per_page: 100 });
          for (const post of posts) {
            resources.push({
              uri: ResourceUri.create(siteConfig.name, 'posts', post.id.toString()),
              name: `Post: ${post.title.rendered}`,
              description: post.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 100),
              mimeType: MIME_TYPES.POST,
              metadata: {
                status: post.status,
                date: post.date,
                author: post.author
              }
            });
          }
        } catch (error) {
          logger.error(`Error listing posts for ${siteConfig.name}:`, error);
        }
        
        // List pages
        try {
          const pages = await client.getPages({ per_page: 100 });
          for (const page of pages) {
            resources.push({
              uri: ResourceUri.create(siteConfig.name, 'pages', page.id.toString()),
              name: `Page: ${page.title.rendered}`,
              description: page.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 100),
              mimeType: MIME_TYPES.PAGE,
              metadata: {
                status: page.status,
                date: page.date,
                parent: page.parent
              }
            });
          }
        } catch (error) {
          logger.error(`Error listing pages for ${siteConfig.name}:`, error);
        }
        
        // List media
        try {
          const media = await client.request<any[]>('/media', { method: 'GET', params: { per_page: 100 } });
          for (const item of media) {
            resources.push({
              uri: ResourceUri.create(siteConfig.name, 'media', item.id.toString()),
              name: `Media: ${item.title.rendered}`,
              description: item.caption?.rendered?.replace(/<[^>]*>/g, '').substring(0, 100),
              mimeType: MIME_TYPES.MEDIA,
              metadata: {
                media_type: item.media_type,
                mime_type: item.mime_type,
                source_url: item.source_url
              }
            });
          }
        } catch (error) {
          logger.error(`Error listing media for ${siteConfig.name}:`, error);
        }
        
        // List users
        try {
          const users = await client.request<any[]>('/users', { method: 'GET', params: { per_page: 100 } });
          for (const user of users) {
            resources.push({
              uri: ResourceUri.create(siteConfig.name, 'users', user.id.toString()),
              name: `User: ${user.name}`,
              description: `Username: ${user.username}, Role: ${user.roles?.[0]}`,
              mimeType: MIME_TYPES.USER,
              metadata: {
                username: user.username,
                roles: user.roles
              }
            });
          }
        } catch (error) {
          logger.error(`Error listing users for ${siteConfig.name}:`, error);
        }
        
        // List categories
        try {
          const categories = await client.request<any[]>('/categories', { method: 'GET', params: { per_page: 100 } });
          for (const category of categories) {
            resources.push({
              uri: ResourceUri.create(siteConfig.name, 'categories', category.id.toString()),
              name: `Category: ${category.name}`,
              description: category.description || `Posts: ${category.count}`,
              mimeType: MIME_TYPES.CATEGORY,
              metadata: {
                count: category.count,
                parent: category.parent
              }
            });
          }
        } catch (error) {
          logger.error(`Error listing categories for ${siteConfig.name}:`, error);
        }
        
        // List tags
        try {
          const tags = await client.request<any[]>('/tags', { method: 'GET', params: { per_page: 100 } });
          for (const tag of tags) {
            resources.push({
              uri: ResourceUri.create(siteConfig.name, 'tags', tag.id.toString()),
              name: `Tag: ${tag.name}`,
              description: tag.description || `Posts: ${tag.count}`,
              mimeType: MIME_TYPES.TAG,
              metadata: {
                count: tag.count
              }
            });
          }
        } catch (error) {
          logger.error(`Error listing tags for ${siteConfig.name}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in listResources:', error);
      throw error;
    }
    
    return resources;
  }
  
  /**
   * Get content for a specific resource
   * @param uri Resource URI
   * @returns Resource content or null if not found
   */
  async getResourceContent(uri: string): Promise<ResourceContent | null> {
    const parsed = ResourceUri.parse(uri);
    if (!parsed) {
      logger.warn(`Invalid resource URI: ${uri}`);
      return null;
    }
    
    const { site, type, id } = parsed;
    
    try {
      const client = await this.siteManager.getClient(site);
      
      switch (type) {
        case 'site':
          const siteInfo = await client.getSiteInfo();
          return {
            uri,
            mimeType: 'application/vnd.wordpress.site+json',
            text: JSON.stringify(siteInfo, null, 2)
          };
          
        case 'posts':
          const post = await client.getPost(parseInt(id));
          return {
            uri,
            mimeType: MIME_TYPES.POST,
            text: JSON.stringify(post, null, 2),
            metadata: {
              status: post.status,
              date: post.date,
              author: post.author
            }
          };
          
        case 'pages':
          const page = await client.getPage(parseInt(id));
          return {
            uri,
            mimeType: MIME_TYPES.PAGE,
            text: JSON.stringify(page, null, 2),
            metadata: {
              status: page.status,
              date: page.date,
              parent: page.parent
            }
          };
          
        case 'media':
          const media = await client.request<any>(`/media/${id}`, { method: 'GET' });
          return {
            uri,
            mimeType: MIME_TYPES.MEDIA,
            text: JSON.stringify(media, null, 2),
            metadata: {
              media_type: media.media_type,
              mime_type: media.mime_type,
              source_url: media.source_url
            }
          };
          
        case 'users':
          const user = await client.request<any>(`/users/${id}`, { method: 'GET' });
          return {
            uri,
            mimeType: MIME_TYPES.USER,
            text: JSON.stringify(user, null, 2),
            metadata: {
              username: user.username,
              roles: user.roles
            }
          };
          
        case 'categories':
          const category = await client.request<any>(`/categories/${id}`, { method: 'GET' });
          return {
            uri,
            mimeType: MIME_TYPES.CATEGORY,
            text: JSON.stringify(category, null, 2),
            metadata: {
              count: category.count,
              parent: category.parent
            }
          };
          
        case 'tags':
          const tag = await client.request<any>(`/tags/${id}`, { method: 'GET' });
          return {
            uri,
            mimeType: MIME_TYPES.TAG,
            text: JSON.stringify(tag, null, 2),
            metadata: {
              count: tag.count
            }
          };
          
        case 'plugins':
          const plugin = await client.request<any>(`/plugins/${encodeURIComponent(id)}`, { method: 'GET' });
          return {
            uri,
            mimeType: MIME_TYPES.PLUGIN,
            text: JSON.stringify(plugin, null, 2),
            metadata: {
              status: plugin.status,
              version: plugin.version
            }
          };
          
        case 'themes':
          const theme = await client.request<any>(`/themes/${encodeURIComponent(id)}`, { method: 'GET' });
          return {
            uri,
            mimeType: MIME_TYPES.THEME,
            text: JSON.stringify(theme, null, 2),
            metadata: {
              status: theme.status,
              version: theme.version
            }
          };
          
        default:
          logger.warn(`Unknown resource type: ${type}`);
          return null;
      }
    } catch (error) {
      logger.error(`Error fetching resource ${uri}:`, error);
      return null;
    }
  }
}
