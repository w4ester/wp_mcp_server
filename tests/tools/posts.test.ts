/**
 * WordPress Posts Tool Tests
 * 
 * Tests for the WordPress posts tool implementation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JsonRpcHandler } from '../../src/json-rpc/handler.js';
import { WordPressSiteManager } from '../../src/wordpress/site-manager.js';
import { registerPostsTools } from '../../src/wordpress/tools/posts.js';
import { RequestContext } from '../../src/types/context.js';

// Mock the dependencies
jest.mock('../../src/wordpress/site-manager.js');
jest.mock('../../src/utils/logger.js');

describe('WordPress Posts Tool', () => {
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
      getPosts: jest.fn(),
      getPost: jest.fn(),
      createPost: jest.fn(),
      updatePost: jest.fn(),
      deletePost: jest.fn()
    };
    
    // Mock getClient to return our mock client
    siteManager.getClient.mockResolvedValue(mockClient);
    
    // Register the posts tools
    registerPostsTools(handler, siteManager);
  });

  describe('wp.posts.list', () => {
    test('should list posts with no filters', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' }
      ];
      mockClient.getPosts.mockResolvedValue(mockPosts);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.posts.list',
        params: { site: 'test-site' },
        id: 1
      }, mockContext);

      expect(siteManager.getClient).toHaveBeenCalledWith('test-site');
      expect(mockClient.getPosts).toHaveBeenCalledWith({});
      expect(result.result).toEqual({
        posts: mockPosts,
        total: 2,
        page: 1
      });
    });

    test('should list posts with filters', async () => {
      const mockPosts = [{ id: 1, title: 'Filtered Post' }];
      mockClient.getPosts.mockResolvedValue(mockPosts);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.posts.list',
        params: {
          site: 'test-site',
          page: 2,
          perPage: 10,
          search: 'test',
          status: 'draft'
        },
        id: 1
      }, mockContext);

      expect(mockClient.getPosts).toHaveBeenCalledWith({
        page: 2,
        per_page: 10,
        search: 'test',
        status: 'draft'
      });
      expect(result.result).toEqual({
        posts: mockPosts,
        total: 1,
        page: 2
      });
    });
  });

  describe('wp.posts.get', () => {
    test('should get a single post by ID', async () => {
      const mockPost = { id: 1, title: 'Test Post' };
      mockClient.getPost.mockResolvedValue(mockPost);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.posts.get',
        params: { site: 'test-site', id: 1 },
        id: 1
      }, mockContext);

      expect(siteManager.getClient).toHaveBeenCalledWith('test-site');
      expect(mockClient.getPost).toHaveBeenCalledWith(1);
      expect(result.result).toEqual({ post: mockPost });
    });

    test('should handle post not found error', async () => {
      mockClient.getPost.mockRejectedValue(new Error('Post not found'));

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.posts.get',
        params: { site: 'test-site', id: 999 },
        id: 1
      }, mockContext);

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Post not found');
    });
  });

  describe('wp.posts.create', () => {
    test('should create a new post', async () => {
      const newPost = { title: 'New Post', content: 'Content' };
      const createdPost = { id: 1, ...newPost };
      mockClient.createPost.mockResolvedValue(createdPost);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.posts.create',
        params: { site: 'test-site', ...newPost },
        id: 1
      }, mockContext);

      expect(mockClient.createPost).toHaveBeenCalledWith(newPost);
      expect(result.result).toEqual({ post: createdPost });
    });

    test('should handle validation errors', async () => {
      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.posts.create',
        params: { site: 'test-site' }, // Missing required fields
        id: 1
      }, mockContext);

      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32602); // Invalid params
    });
  });

  describe('wp.posts.update', () => {
    test('should update an existing post', async () => {
      const updateData = { title: 'Updated Title' };
      const updatedPost = { id: 1, ...updateData };
      mockClient.updatePost.mockResolvedValue(updatedPost);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.posts.update',
        params: { site: 'test-site', id: 1, ...updateData },
        id: 1
      }, mockContext);

      expect(mockClient.updatePost).toHaveBeenCalledWith(1, updateData);
      expect(result.result).toEqual({ post: updatedPost });
    });
  });

  describe('wp.posts.delete', () => {
    test('should delete a post', async () => {
      const deletedPost = { id: 1, status: 'trash' };
      mockClient.deletePost.mockResolvedValue(deletedPost);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.posts.delete',
        params: { site: 'test-site', id: 1 },
        id: 1
      }, mockContext);

      expect(mockClient.deletePost).toHaveBeenCalledWith(1, false);
      expect(result.result).toEqual({ success: true, post: deletedPost });
    });

    test('should force delete a post', async () => {
      const deletedPost = { id: 1, status: 'deleted' };
      mockClient.deletePost.mockResolvedValue(deletedPost);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.posts.delete',
        params: { site: 'test-site', id: 1, force: true },
        id: 1
      }, mockContext);

      expect(mockClient.deletePost).toHaveBeenCalledWith(1, true);
      expect(result.result).toEqual({ success: true, post: deletedPost });
    });
  });
});
