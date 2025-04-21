/**
 * WordPress Plugins Tool Tests
 * 
 * Tests for the WordPress plugins tool implementation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JsonRpcHandler } from '../../src/json-rpc/handler.js';
import { WordPressSiteManager } from '../../src/wordpress/site-manager.js';
import { registerPluginsTools } from '../../src/wordpress/tools/plugins.js';
import { RequestContext } from '../../src/types/context.js';
import { createMockPlugin } from '../test-utils.js';

// Mock the dependencies
jest.mock('../../src/wordpress/site-manager.js');
jest.mock('../../src/utils/logger.js');

describe('WordPress Plugins Tool', () => {
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
    
    // Register the plugins tools
    registerPluginsTools(handler, siteManager);
  });

  test('should list plugins', async () => {
    const mockPlugins = [
      createMockPlugin({ plugin: 'akismet/akismet.php', name: 'Akismet' }),
      createMockPlugin({ plugin: 'hello-dolly/hello.php', name: 'Hello Dolly' })
    ];
    mockClient.request.mockResolvedValue(mockPlugins);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.plugins.list',
      params: { site: 'test-site' },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/plugins', {
      method: 'GET',
      params: {}
    });
    expect(result.result).toEqual({
      plugins: mockPlugins,
      total: 2
    });
  });

  test('should activate a plugin', async () => {
    const activatedPlugin = createMockPlugin({
      plugin: 'akismet/akismet.php',
      status: 'active',
      name: 'Akismet'
    });
    mockClient.request.mockResolvedValue(activatedPlugin);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.plugins.activate',
      params: {
        site: 'test-site',
        plugin: 'akismet/akismet.php'
      },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/plugins/akismet%2Fakismet.php', {
      method: 'POST',
      data: {
        status: 'active'
      }
    });
    expect(result.result).toEqual({ plugin: activatedPlugin });
  });
});
