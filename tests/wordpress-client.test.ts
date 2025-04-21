/**
 * WordPress Client Tests
 * 
 * Tests for the WordPress REST API client.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { WordPressClient } from '../src/wordpress/client.js';
import { WordPressSiteConfig } from '../src/wordpress/types.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WordPressClient', () => {
  let client: WordPressClient;
  let mockConfig: WordPressSiteConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock axios create method
    mockedAxios.create.mockReturnValue(mockedAxios);
    
    mockConfig = {
      name: 'test-site',
      url: 'https://example.com',
      username: 'admin',
      applicationPassword: 'password',
      environment: 'production',
      staging: {
        url: 'https://staging.example.com',
        applicationPassword: 'staging-pass'
      }
    };

    client = new WordPressClient(mockConfig);
  });

  describe('Initialization', () => {
    test('should create axios instance with correct base URL', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://example.com/wp-json/wp/v2'
        })
      );
    });

    test('should set correct authorization headers', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic ')
          })
        })
      );
    });

    test('should use staging URL when environment is set to staging', () => {
      client.useEnvironment('staging');
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://staging.example.com/wp-json/wp/v2'
        })
      );
    });
  });

  describe('API Requests', () => {
    test('should make GET request correctly', async () => {
      const mockResponse = { data: [{ id: 1, title: 'Test Post' }] };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await client.request('/posts', { method: 'GET' });

      expect(mockedAxios.get).toHaveBeenCalledWith('/posts', {});
      expect(result).toEqual(mockResponse.data);
    });

    test('should make POST request correctly', async () => {
      const mockResponse = { data: { id: 1, title: 'New Post' } };
      const postData = { title: 'New Post', content: 'Content' };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await client.request('/posts', { 
        method: 'POST',
        data: postData
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/posts', postData, {});
      expect(result).toEqual(mockResponse.data);
    });

    test('should handle request errors', async () => {
      const errorMessage = 'API Error';
      mockedAxios.get.mockRejectedValue({
        response: {
          data: { message: errorMessage },
          status: 404
        }
      });

      await expect(client.request('/posts', { method: 'GET' }))
        .rejects.toThrow(errorMessage);
    });

    test('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(client.request('/posts', { method: 'GET' }))
        .rejects.toThrow('Network Error');
    });
  });

  describe('WordPress API Methods', () => {
    test('should get posts', async () => {
      const mockPosts = [{ id: 1, title: 'Test Post' }];
      mockedAxios.get.mockResolvedValue({ data: mockPosts });

      const result = await client.getPosts({ page: 1 });

      expect(mockedAxios.get).toHaveBeenCalledWith('/posts', {
        params: { page: 1 }
      });
      expect(result).toEqual(mockPosts);
    });

    test('should create post', async () => {
      const newPost = { title: 'New Post', content: 'Content' };
      const mockResponse = { id: 1, ...newPost };
      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await client.createPost(newPost);

      expect(mockedAxios.post).toHaveBeenCalledWith('/posts', newPost, {});
      expect(result).toEqual(mockResponse);
    });

    test('should update post', async () => {
      const updateData = { title: 'Updated Post' };
      const mockResponse = { id: 1, ...updateData };
      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await client.updatePost(1, updateData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/posts/1', updateData, {});
      expect(result).toEqual(mockResponse);
    });

    test('should delete post', async () => {
      const mockResponse = { deleted: true };
      mockedAxios.delete.mockResolvedValue({ data: mockResponse });

      const result = await client.deletePost(1, true);

      expect(mockedAxios.delete).toHaveBeenCalledWith('/posts/1', {
        params: { force: true }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Site Info', () => {
    test('should get site info', async () => {
      const mockSiteInfo = {
        name: 'Test Site',
        description: 'A test WordPress site',
        url: 'https://example.com'
      };
      mockedAxios.get.mockResolvedValue({ data: mockSiteInfo });

      const result = await client.getSiteInfo();

      expect(mockedAxios.get).toHaveBeenCalledWith('/', {});
      expect(result).toEqual(mockSiteInfo);
    });
  });
});
