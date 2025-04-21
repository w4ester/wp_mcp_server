/**
 * JSON-RPC Handler
 * 
 * Core implementation of the JSON-RPC 2.0 protocol handler
 */

import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/monitoring/index.js';
import { RequestContext } from '../types/context.js';
import { 
  JsonRpcRequest, 
  JsonRpcResponse, 
  JsonRpcBatchRequest,
  JsonRpcError,
  MethodHandler 
} from '../types/json-rpc.js';

export class JsonRpcHandler {
  // Standard JSON-RPC 2.0 error codes
  public static readonly ERROR_CODES = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    // WordPress-specific custom error codes
    WP_AUTH_ERROR: -32000,
    WP_PERMISSION_ERROR: -32001,
    WP_RESOURCE_NOT_FOUND: -32002,
    WP_VALIDATION_ERROR: -32003,
    RATE_LIMIT_EXCEEDED: -32029
  };
  
  // Method registry with strong typing
  private methods = new Map<string, MethodHandler<any, any>>();
  
  constructor() {}
  
  // Register method implementations
  public registerMethod<TParams, TResult>(
    name: string,
    handler: (params: TParams, context: RequestContext) => Promise<TResult>,
    schema: z.ZodType<TParams>,
    description?: string
  ): void {
    this.methods.set(name, {
      handler,
      schema,
      name,
      description
    });
    
    logger.info(`Registered JSON-RPC method: ${name}`);
  }
  
  // Get all registered methods
  public getRegisteredMethods(): string[] {
    return Array.from(this.methods.keys());
  }
  
  // Process JSON-RPC request
  public async processRequest(
    request: unknown,
    context: RequestContext
  ): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
    const startTime = performance.now();
    
    try {
      metrics.incrementCounter('jsonrpc_requests_total');
      
      // Batch request handling
      if (Array.isArray(request)) {
        return this.processBatchRequest(request as JsonRpcBatchRequest, context);
      }
      
      // Validate request structure
      const validationResult = this.validateRequest(request);
      if (!validationResult.valid) {
        return this.createErrorResponse(
          validationResult.id,
          JsonRpcHandler.ERROR_CODES.INVALID_REQUEST,
          'Invalid Request',
          validationResult.error
        );
      }
      
      const rpcRequest = request as JsonRpcRequest;
      
      // Record method-specific metrics
      metrics.incrementCounter('jsonrpc_method_calls', {
        method: rpcRequest.method
      });
      
      // Process notification (no response needed)
      if (rpcRequest.id === undefined) {
        await this.invokeMethod(rpcRequest.method, rpcRequest.params, context);
        return null;
      }
      
      // Process normal method call
      try {
        const result = await this.invokeMethod(
          rpcRequest.method, 
          rpcRequest.params, 
          context
        );
        
        // Record success metrics
        const duration = performance.now() - startTime;
        metrics.recordHistogram('jsonrpc_request_duration_ms', duration, {
          method: rpcRequest.method,
          status: 'success'
        });
        
        return {
          jsonrpc: '2.0',
          result,
          id: rpcRequest.id
        };
      } catch (error) {
        // Record error metrics
        metrics.incrementCounter('jsonrpc_errors_total', {
          method: rpcRequest.method,
          error_type: error.name
        });
        
        const duration = performance.now() - startTime;
        metrics.recordHistogram('jsonrpc_request_duration_ms', duration, {
          method: rpcRequest.method,
          status: 'error'
        });
        
        // Create appropriate error response
        return this.handleMethodError(rpcRequest.id, error);
      }
    } catch (error) {
      logger.error('Unhandled error processing JSON-RPC request', { 
        error, 
        context: context.logContext() 
      });
      
      return this.createErrorResponse(
        null,
        JsonRpcHandler.ERROR_CODES.INTERNAL_ERROR,
        'Internal error',
        { message: error.message }
      );
    }
  }
  
  // Process a batch of requests
  private async processBatchRequest(
    requests: JsonRpcBatchRequest,
    context: RequestContext
  ): Promise<JsonRpcResponse[]> {
    if (requests.length === 0) {
      return [{
        jsonrpc: '2.0',
        error: {
          code: JsonRpcHandler.ERROR_CODES.INVALID_REQUEST,
          message: 'Invalid Request: Empty batch'
        },
        id: null
      }];
    }
    
    // Process each request in the batch
    const responses: (JsonRpcResponse | null)[] = await Promise.all(
      requests.map(request => this.processRequest(request, context.createChild()))
    );
    
    // Filter out null responses (from notifications)
    return responses.filter(response => response !== null) as JsonRpcResponse[];
  }
  
  // Validate a JSON-RPC request
  private validateRequest(request: unknown): { 
    valid: boolean; 
    id?: string | number | null; 
    error?: any 
  } {
    // Object validation
    if (!request || typeof request !== 'object') {
      return { valid: false, error: 'Request must be an object' };
    }
    
    const req = request as Record<string, any>;
    
    // Check jsonrpc version
    if (req.jsonrpc !== '2.0') {
      return { 
        valid: false, 
        id: req.id, 
        error: 'Invalid or missing jsonrpc field (must be "2.0")' 
      };
    }
    
    // Check method exists and is string
    if (typeof req.method !== 'string' || req.method === '') {
      return { 
        valid: false, 
        id: req.id, 
        error: 'Method must be a non-empty string' 
      };
    }
    
    // Params must be object or array if present
    if (req.params !== undefined && 
        (typeof req.params !== 'object' || req.params === null)) {
      return { 
        valid: false, 
        id: req.id, 
        error: 'Params must be an object or array' 
      };
    }
    
    // ID validation - can be string, number, null, or undefined (notification)
    if (req.id !== undefined && 
        req.id !== null && 
        typeof req.id !== 'string' && 
        typeof req.id !== 'number') {
      return { 
        valid: false, 
        id: null, 
        error: 'Id must be string, number, null, or undefined' 
      };
    }
    
    return { valid: true, id: req.id };
  }
  
  // Invoke a registered method
  private async invokeMethod(
    methodName: string,
    params: unknown,
    context: RequestContext
  ): Promise<any> {
    // Check method exists
    const method = this.methods.get(methodName);
    if (!method) {
      throw new JsonRpcError(
        `Method not found: ${methodName}`,
        JsonRpcHandler.ERROR_CODES.METHOD_NOT_FOUND
      );
    }
    
    // Validate params against schema
    try {
      const validatedParams = method.schema.parse(params);
      
      // Invoke the handler
      return await method.handler(validatedParams, context);
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new JsonRpcError(
          'Invalid params: ' + error.message,
          JsonRpcHandler.ERROR_CODES.INVALID_PARAMS,
          error.format()
        );
      }
      
      throw error;
    }
  }
  
  // Create a JSON-RPC error response
  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: any
  ): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      error: {
        code,
        message,
        data
      },
      id
    };
  }
  
  // Handle method errors
  private handleMethodError(id: string | number | null, error: any): JsonRpcResponse {
    // Handle JSON-RPC errors
    if (error instanceof JsonRpcError) {
      return this.createErrorResponse(
        id,
        error.code,
        error.message,
        error.data
      );
    }
    
    // Handle other errors
    logger.error('Method execution error', { error });
    
    return this.createErrorResponse(
      id,
      JsonRpcHandler.ERROR_CODES.INTERNAL_ERROR,
      'Internal server error',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
}
