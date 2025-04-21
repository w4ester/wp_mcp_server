/**
 * WordPress Media Tool Tests
 * 
 * Tests for the WordPress media tool implementation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JsonRpcHandler } from '../../src/json-rpc/handler.js';
import { WordPressSiteManager } from '../../src/wordpress/site-manager.js';
import { registerMediaTools } from '../../src/wordpress/tools/media.js';
import { RequestContext } from '../../src/types/context.js';
import { createMockMedia } from '../test-utils.js';

// Mock the dependencies
jest.mock('../../src/wordpress/site-manager.js');
jest.mock('../../src/utils/logger.js');

describe('WordPress Media Tool', () => {
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
    
    // Register the media tools
    registerMediaTools(handler, siteManager);
  });

  describe('wp.media.list', () => {
    test('should list media with no filters', async () => {
      const mockMediaItems = [
        createMockMedia({ id: 1, title: { rendered: 'Image 1' } }),
        createMockMedia({ id: 2, title: { rendered: 'Image 2' } })
      ];
      mockClient.request.mockResolvedValue(mockMediaItems);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.media.list',
        params: { site: 'test-site' },
        id: 1
      }, mockContext);

      expect(siteManager.getClient).toHaveBeenCalledWith('test-site');
      expect(mockClient.request).toHaveBeenCalledWith('/media', {
        method: 'GET',
        params: {}
      });
      expect(result.result).toEqual({
        media: mockMediaItems,
        total: 2,
        page: 1
      });
    });

    test('should list media with filters', async () => {
      const mockMediaItems = [createMockMedia({ id: 1, title: { rendered: 'Filtered Image' } })];
      mockClient.request.mockResolvedValue(mockMediaItems);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.media.list',
        params: {
          site: 'test-site',
          page: 2,
          perPage: 10,
          mediaType: 'image',
          search: 'test'
        },
        id: 1
      }, mockContext);

      expect(mockClient.request).toHaveBeenCalledWith('/media', {
        method: 'GET',
        params: {
          page: 2,
          per_page: 10,
          media_type: 'image',
          search: 'test'
        }
      });
      expect(result.result).toEqual({
        media: mockMediaItems,
        total: 1,
        page: 2
      });
    });
  });

  describe('wp.media.get', () => {
    test('should get a single media item by ID', async () => {
      const mockMediaItem = createMockMedia({ id: 1, title: { rendered: 'Test Image' } });
      mockClient.request.mockResolvedValue(mockMediaItem);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.media.get',
        params: { site: 'test-site', id: 1 },
        id: 1
      }, mockContext);

      expect(mockClient.request).toHaveBeenCalledWith('/media/1', {
        method: 'GET'
      });
      expect(result.result).toEqual({ media: mockMediaItem });
    });

    test('should handle media not found error', async () => {
      mockClient.request.mockRejectedValue(new Error('Media not found'));

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.media.get',
        params: { site: 'test-site', id: 999 },
        id: 1
      }, mockContext);

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Media not found');
    });
  });

  describe('wp.media.create', () => {
    test('should upload a new media file', async () => {
      const mockMediaItem = createMockMedia({
        id: 1,
        title: { rendered: 'Uploaded Image' },
        source_url: 'https://example.com/wp-content/uploads/2023/01/uploaded.jpg'
      });
      mockClient.request.mockResolvedValue(mockMediaItem);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.media.create',
        params: {
          site: 'test-site',
          file: 'base64encodedcontent',
          filename: 'test.jpg',
          title: 'Test Upload'
        },
        id: 1
      }, mockContext);

      expect(mockClient.request).toHaveBeenCalledWith('/media', {
        method: 'POST',
        data: expect.any(FormData),
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      expect(result.result).toEqual({ media: mockMediaItem });
    });

    test('should handle validation errors', async () => {
      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.media.create',
        params: {
          site: 'test-site'
          // Missing required fields
        },
        id: 1
      }, mockContext);

      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32602); // Invalid params
    });
  });

  describe('wp.media.update', () => {
    test('should update media metadata', async () => {
      const updateData = { title: 'Updated Title', alt_text: 'Updated Alt Text' };
      const updatedMedia = createMockMedia({ id: 1, ...updateData });
      mockClient.request.mockResolvedValue(updatedMedia);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.media.update',
        params: {
          site: 'test-site',
          id: 1,
          ...updateData
        },
        id: 1
      }, mockContext);

      expect(mockClient.request).toHaveBeenCalledWith('/media/1', {
        method: 'POST',
        data: updateData
      });
      expect(result.result).toEqual({ media: updatedMedia });
    });
  });

  describe('wp.media.delete', () => {
    test('should delete a media item', async () => {
      const deletedMedia = createMockMedia({ id: 1, status: 'deleted' });
      mockClient.request.mockResolvedValue(deletedMedia);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.media.delete',
        params: { site: 'test-site', id: 1 },
        id: 1
      }, mockContext);

      expect(mockClient.request).toHaveBeenCalledWith('/media/1', {
        method: 'DELETE',
        params: { force: false }
      });
      expect(result.result).toEqual({ success: true, media: deletedMedia });
    });

    test('should force delete a media item', async () => {
      const deletedMedia = createMockMedia({ id: 1, status: 'deleted' });
      mockClient.request.mockResolvedValue(deletedMedia);

      const result = await handler.handleRequest({
        jsonrpc: '2.0',
        method: 'wp.media.delete',
        params: { site: 'test-site', id: 1, force: true },
        id: 1
      }, mockContext);

      expect(mockClient.request).toHaveBeenCalledWith('/media/1', {
        method: 'DELETE',
        params: { force: true }
      });
      expect(result.result).toEqual({ success: true, media: deletedMedia });
    });
  });
});
