/**
 * WordPress Tags Tool Tests
 * 
 * Tests for the WordPress tags tool implementation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JsonRpcHandler } from '../../src/json-rpc/handler.js';
import { WordPressSiteManager } from '../../src/wordpress/site-manager.js';
import { registerTagsTools } from '../../src/wordpress/tools/tags.js';
import { RequestContext } from '../../src/types/context.js';
import { createMockTag } from '../test-utils.js';

// Mock the dependencies
jest.mock('../../src/wordpress/site-manager.js');
jest.mock('../../src/utils/logger.js');

describe('WordPress Tags Tool', () => {
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
    
    // Register the tags tools
    registerTagsTools(handler, siteManager);
  });

  test('should list tags', async () => {
    const mockTags = [
      createMockTag({ id: 1, name: 'JavaScript' }),
      createMockTag({ id: 2, name: 'TypeScript' })
    ];
    mockClient.request.mockResolvedValue(mockTags);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.tags.list',
      params: { site: 'test-site' },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/tags', {
      method: 'GET',
      params: {}
    });
    expect(result.result).toEqual({
      tags: mockTags,
      total: 2,
      page: 1
    });
  });

  test('should create a tag', async () => {
    const newTag = createMockTag({
      id: 3,
      name: 'NodeJS',
      slug: 'nodejs'
    });
    mockClient.request.mockResolvedValue(newTag);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.tags.create',
      params: {
        site: 'test-site',
        name: 'NodeJS',
        description: 'Server-side JavaScript runtime'
      },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/tags', {
      method: 'POST',
      data: {
        name: 'NodeJS',
        description: 'Server-side JavaScript runtime'
      }
    });
    expect(result.result).toEqual({ tag: newTag });
  });
});
