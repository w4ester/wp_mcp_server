/**
 * Resource Manager Tests
 * 
 * Tests for the MCP resource implementation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { WordPressResourceManager } from '../src/resources/resource-manager.js';
import { WordPressSiteManager } from '../src/wordpress/site-manager.js';
import { ResourceUri } from '../src/resources/types.js';

// Mock the dependencies
jest.mock('../src/wordpress/site-manager.js');
jest.mock('../src/utils/logger.js');

describe('ResourceManager', () => {
  let resourceManager: WordPressResourceManager;
  let siteManager: jest.Mocked<WordPressSiteManager>;
  let mockClient: any;

  beforeEach(() => {
    // Create fresh instances
    siteManager = new WordPressSiteManager() as jest.Mocked<WordPressSiteManager>;
    resourceManager = new WordPressResourceManager(siteManager);
    
    // Mock client methods
    mockClient = {
      getPosts: jest.fn().mockResolvedValue([
        { id: 1, title: { rendered: 'Test Post' }, excerpt: { rendered: 'Test excerpt' } }
      ]),
      getPages: jest.fn().mockResolvedValue([
        { id: 1, title: { rendered: 'Test Page' }, excerpt: { rendered: 'Page excerpt' } }
      ]),
      request: jest.fn().mockResolvedValue([]),
      getSiteInfo: jest.fn().mockResolvedValue({ name: 'Test Site' }),
      getPost: jest.fn().mockResolvedValue({ id: 1, title: { rendered: 'Test Post' } }),
      getPage: jest.fn().mockResolvedValue({ id: 1, title: { rendered: 'Test Page' } })
    };
    
    // Mock getClient to return our mock client
    siteManager.getClient.mockResolvedValue(mockClient);
    siteManager.listSites.mockReturnValue([{ name: 'test-site' }]);
  });

  describe('listResources', () => {
    test('should list all resource types', async () => {
      const resources = await resourceManager.listResources();
      
      // Verify site resource
      expect(resources).toContainEqual(
        expect.objectContaining({
          uri: 'wordpress://test-site/site/info',
          name: 'WordPress Site: test-site'
        })
      );
      
      // Verify post resource
      expect(resources).toContainEqual(
        expect.objectContaining({
          uri: 'wordpress://test-site/posts/1',
          name: 'Post: Test Post'
        })
      );
      
      // Verify page resource
      expect(resources).toContainEqual(
        expect.objectContaining({
          uri: 'wordpress://test-site/pages/1',
          name: 'Page: Test Page'
        })
      );
    });
    
    test('should filter by site', async () => {
      const resources = await resourceManager.listResources('test-site');
      
      expect(siteManager.getClient).toHaveBeenCalledWith('test-site');
      expect(resources.every(r => r.uri.startsWith('wordpress://test-site/'))).toBe(true);
    });
  });

  describe('getResourceContent', () => {
    test('should get post content', async () => {
      const uri = 'wordpress://test-site/posts/1';
      const content = await resourceManager.getResourceContent(uri);
      
      expect(content).toBeDefined();
      expect(content?.uri).toBe(uri);
      expect(content?.mimeType).toBe('application/vnd.wordpress.post+json');
      expect(mockClient.getPost).toHaveBeenCalledWith(1);
    });
    
    test('should get page content', async () => {
      const uri = 'wordpress://test-site/pages/1';
      const content = await resourceManager.getResourceContent(uri);
      
      expect(content).toBeDefined();
      expect(content?.uri).toBe(uri);
      expect(content?.mimeType).toBe('application/vnd.wordpress.page+json');
      expect(mockClient.getPage).toHaveBeenCalledWith(1);
    });
    
    test('should handle invalid URI', async () => {
      const uri = 'invalid://uri';
      const content = await resourceManager.getResourceContent(uri);
      
      expect(content).toBeNull();
    });
    
    test('should handle resource not found', async () => {
      mockClient.getPost.mockRejectedValue(new Error('Not found'));
      
      const uri = 'wordpress://test-site/posts/999';
      const content = await resourceManager.getResourceContent(uri);
      
      expect(content).toBeNull();
    });
  });
});

describe('ResourceUri', () => {
  test('should create valid URI', () => {
    const uri = ResourceUri.create('test-site', 'posts', '123');
    expect(uri).toBe('wordpress://test-site/posts/123');
  });
  
  test('should parse valid URI', () => {
    const parsed = ResourceUri.parse('wordpress://test-site/posts/123');
    expect(parsed).toEqual({
      site: 'test-site',
      type: 'posts',
      id: '123'
    });
  });
  
  test('should return null for invalid URI', () => {
    const parsed = ResourceUri.parse('invalid://uri');
    expect(parsed).toBeNull();
  });
});
