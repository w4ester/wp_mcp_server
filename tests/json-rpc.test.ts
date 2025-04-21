/**
 * JSON-RPC Handler Tests
 * 
 * Tests for the JSON-RPC 2.0 implementation.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JsonRpcHandler } from '../src/json-rpc/handler.js';
import { z } from 'zod';
import { RequestContext } from '../src/types/context.js';

describe('JsonRpcHandler', () => {
  let handler: JsonRpcHandler;
  let mockContext: RequestContext;

  beforeEach(() => {
    handler = new JsonRpcHandler();
    mockContext = new RequestContext();
  });

  describe('Method Registration', () => {
    test('should register a method', () => {
      const methodName = 'test.method';
      const schema = z.object({ value: z.string() });
      const method = jest.fn().mockResolvedValue({ result: 'ok' });

      handler.registerMethod(methodName, method, schema, 'Test method');

      expect(() => {
        handler.registerMethod(methodName, method, schema, 'Test method');
      }).toThrow('Method already registered');
    });

    test('should fail to register invalid method name', () => {
      const schema = z.object({ value: z.string() });
      const method = jest.fn();

      expect(() => {
        handler.registerMethod('', method, schema, 'Invalid method');
      }).toThrow();
    });
  });

  describe('Request Validation', () => {
    test('should validate valid JSON-RPC request', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'test.method',
        params: { value: 'test' },
        id: 1
      };

      const schema = z.object({ value: z.string() });
      const method = jest.fn().mockResolvedValue({ result: 'ok' });
      
      handler.registerMethod('test.method', method, schema, 'Test method');
      
      const result = await handler.handleRequest(request, mockContext);
      
      expect(result).toEqual({
        jsonrpc: '2.0',
        result: { result: 'ok' },
        id: 1
      });
    });

    test('should handle invalid JSON-RPC version', async () => {
      const request = {
        jsonrpc: '1.0',
        method: 'test.method',
        params: {},
        id: 1
      };

      const result = await handler.handleRequest(request, mockContext);
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32600);
    });

    test('should handle missing method', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'unknown.method',
        params: {},
        id: 1
      };

      const result = await handler.handleRequest(request, mockContext);
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32601);
    });

    test('should handle invalid params', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'test.method',
        params: { invalidParam: 'value' },
        id: 1
      };

      const schema = z.object({ value: z.string() });
      const method = jest.fn();
      
      handler.registerMethod('test.method', method, schema, 'Test method');
      
      const result = await handler.handleRequest(request, mockContext);
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32602);
    });
  });

  describe('Batch Requests', () => {
    test('should handle batch requests', async () => {
      const schema = z.object({ value: z.string() });
      const method = jest.fn()
        .mockResolvedValueOnce({ result: 'ok1' })
        .mockResolvedValueOnce({ result: 'ok2' });
      
      handler.registerMethod('test.method', method, schema, 'Test method');

      const batch = [
        { jsonrpc: '2.0', method: 'test.method', params: { value: 'test1' }, id: 1 },
        { jsonrpc: '2.0', method: 'test.method', params: { value: 'test2' }, id: 2 }
      ];

      const result = await handler.handleRequest(batch, mockContext);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].result).toEqual({ result: 'ok1' });
      expect(result[1].result).toEqual({ result: 'ok2' });
    });

    test('should handle empty batch requests', async () => {
      const batch: any[] = [];
      const result = await handler.handleRequest(batch, mockContext);
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32600);
    });
  });

  describe('Error Handling', () => {
    test('should handle method throwing error', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'test.method',
        params: { value: 'test' },
        id: 1
      };

      const schema = z.object({ value: z.string() });
      const method = jest.fn().mockRejectedValue(new Error('Method failed'));
      
      handler.registerMethod('test.method', method, schema, 'Test method');
      
      const result = await handler.handleRequest(request, mockContext);
      
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32000);
      expect(result.error.message).toBe('Method failed');
    });

    test('should handle notifications (no id)', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'test.method',
        params: { value: 'test' }
      };

      const schema = z.object({ value: z.string() });
      const method = jest.fn().mockResolvedValue({ result: 'ok' });
      
      handler.registerMethod('test.method', method, schema, 'Test method');
      
      const result = await handler.handleRequest(request, mockContext);
      
      expect(result).toBeUndefined();
    });
  });
});
