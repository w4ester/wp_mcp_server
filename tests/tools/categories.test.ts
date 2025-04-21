/**
 * WordPress Categories Tool Tests
 * 
 * Tests for the WordPress categories tool implementation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JsonRpcHandler } from '../../src/json-rpc/handler.js';
import { WordPressSiteManager } from '../../src/wordpress/site-manager.js';
import { registerCategoriesTools } from '../../src/wordpress/tools/categories.js';
import { RequestContext } from '../../src/types/context.js';
import { createMockCategory } from '../test-utils.js';

// Mock the dependencies
jest.mock('../../src/wordpress/site-manager.js');
jest.mock('../../src/utils/logger.js');

describe('WordPress Categories Tool', () => {
  let handler: JsonRpcHandler;
  let siteManager: jest.Mocked<WordPressSiteManager>;
  let mockClient: any;
  let mockContext: RequestContext;

  beforeEach(() => {
    // Create fresh instances
    handler = new JsonRpcHandler();
    siteManager = new WordPressSiteManager() as jest.Mocked<WordPressSiteManager>;
    mockContext = new RequestContext();
    
    // Mock client methods
    mockClient = {
      request: jest.fn()
    };
    
    // Mock getClient to return our mock client
    siteManager.getClient.mockResolvedValue(mockClient);
    
    // Register the categories tools
    registerCategoriesTools(handler, siteManager);
  });

  test('should list categories', async () => {
    const mockCategories = [
      createMockCategory({ id: 1, name: 'Uncategorized' }),
      createMockCategory({ id: 2, name: 'Technology' })
    ];
    mockClient.request.mockResolvedValue(mockCategories);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.categories.list',
      params: { site: 'test-site' },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/categories', {
      method: 'GET',
      params: {}
    });
    expect(result.result).toEqual({
      categories: mockCategories,
      total: 2,
      page: 1
    });
  });

  test('should create a category', async () => {
    const newCategory = createMockCategory({
      id: 3,
      name: 'News',
      slug: 'news'
    });
    mockClient.request.mockResolvedValue(newCategory);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.categories.create',
      params: {
        site: 'test-site',
        name: 'News',
        description: 'Latest news and updates'
      },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/categories', {
      method: 'POST',
      data: {
        name: 'News',
        description: 'Latest news and updates'
      }
    });
    expect(result.result).toEqual({ category: newCategory });
  });
});
