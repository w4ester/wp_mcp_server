/**
 * WordPress Users Tool Tests
 * 
 * Tests for the WordPress users tool implementation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JsonRpcHandler } from '../../src/json-rpc/handler.js';
import { WordPressSiteManager } from '../../src/wordpress/site-manager.js';
import { registerUsersTools } from '../../src/wordpress/tools/users.js';
import { RequestContext } from '../../src/types/context.js';
import { createMockUser } from '../test-utils.js';

// Mock the dependencies
jest.mock('../../src/wordpress/site-manager.js');
jest.mock('../../src/utils/logger.js');

describe('WordPress Users Tool', () => {
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
    
    // Register the users tools
    registerUsersTools(handler, siteManager);
  });

  test('should list users', async () => {
    const mockUsers = [
      createMockUser({ id: 1, username: 'user1' }),
      createMockUser({ id: 2, username: 'user2' })
    ];
    mockClient.request.mockResolvedValue(mockUsers);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.users.list',
      params: { site: 'test-site' },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/users', {
      method: 'GET',
      params: {}
    });
    expect(result.result).toEqual({
      users: mockUsers,
      total: 2,
      page: 1
    });
  });

  test('should create a user', async () => {
    const newUser = createMockUser({
      id: 1,
      username: 'newuser',
      email: 'new@example.com'
    });
    mockClient.request.mockResolvedValue(newUser);

    const result = await handler.handleRequest({
      jsonrpc: '2.0',
      method: 'wp.users.create',
      params: {
        site: 'test-site',
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      },
      id: 1
    }, mockContext);

    expect(mockClient.request).toHaveBeenCalledWith('/users', {
      method: 'POST',
      data: {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      }
    });
    expect(result.result).toEqual({ user: newUser });
  });
});
