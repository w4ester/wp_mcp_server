/**
 * JSON-RPC 2.0 Type Definitions
 * 
 * These types define the structure of JSON-RPC requests and responses
 * following the JSON-RPC 2.0 specification.
 */

import { z } from 'zod';
import { RequestContext } from './context.js';

/**
 * JSON-RPC 2.0 Request object
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id?: string | number | null;
}

/**
 * JSON-RPC 2.0 Batch Request (array of requests)
 */
export type JsonRpcBatchRequest = JsonRpcRequest[];

/**
 * JSON-RPC 2.0 Success Response
 */
export interface JsonRpcSuccessResponse {
  jsonrpc: '2.0';
  result: any;
  id: string | number | null;
}

/**
 * JSON-RPC 2.0 Error Object
 */
export interface JsonRpcErrorObject {
  code: number;
  message: string;
  data?: any;
}

/**
 * JSON-RPC 2.0 Error Response
 */
export interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  error: JsonRpcErrorObject;
  id: string | number | null;
}

/**
 * JSON-RPC 2.0 Response (success or error)
 */
export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

/**
 * JSON-RPC Error class with code, message, and optional data
 */
export class JsonRpcError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly data?: any
  ) {
    super(message);
    this.name = 'JsonRpcError';
  }
}

/**
 * Method handler interface with validation schema
 */
export interface MethodHandler<TParams, TResult> {
  name: string;
  description?: string;
  schema: z.ZodType<TParams>;
  handler: (params: TParams, context: RequestContext) => Promise<TResult>;
}
