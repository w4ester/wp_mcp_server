/**
 * WordPress Themes Tool Tests
 * 
 * Tests for the WordPress themes tool implementation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JsonRpcHandler } from '../../src/json-rpc/handler.js';
import { WordPressSiteManager } from '../../src/wordpress/site-manager.js';
import { registerThemesTools } from '../../src/wordpress/tools/themes.js';
import { RequestContext } from '../../src/types/context.js';
import { createMockTheme } from '../test-utils.js';

// Mock the dependencies
jest.mock('../../src/wordpress/site-manager.js');
jest.mock('../../src/utils/logger.js');

describe('WordPress Themes Tool', () => {
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
    
    // Register the themes tools
    registerThemesTools(handler, siteManager);
  });

  test('should list themes', async () => {
    const mockThemes = [
      createMockTheme({ stylesheet: 'twentytwentythree', name: { rendered: 'Twenty Twenty-Three' } }),
      createMockTheme({ stylesheet: 'twentytwentytwo', name: { rendered: 'Twenty Twenty-Two' } })
    ];
    mockClient.request.mockResolvedValue(mockThemes);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.themes.list',
      params: { site: 'test-site' },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/themes', {
      method: 'GET',
      params: {}
    });
    expect(result.result).toEqual({
      themes: mockThemes,
      total: 2
    });
  });

  test('should activate a theme', async () => {
    const activatedTheme = createMockTheme({
      stylesheet: 'twentytwentythree',
      status: 'active',
      name: { rendered: 'Twenty Twenty-Three' }
    });
    mockClient.request.mockResolvedValue(activatedTheme);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.themes.activate',
      params: {
        site: 'test-site',
        stylesheet: 'twentytwentythree'
      },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/themes/twentytwentythree', {
      method: 'POST',
      data: {
        status: 'active'
      }
    });
    expect(result.result).toEqual({ theme: activatedTheme });
  });
});
