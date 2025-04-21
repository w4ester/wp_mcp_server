/**
 * HTTP Server for WordPress MCP
 * 
 * Implements the HTTP transport for the MCP server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/inMemory.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/monitoring/index.js';
import { JsonRpcHandler } from '../json-rpc/handler.js';
import { createAuthMiddleware, ApiKeyManager } from '../middleware/auth.js';
import { RequestContext } from '../types/context.js';
import { WordPressResourceManager } from '../resources/resource-manager.js';
import { createResourceRouter } from './resources.js';

/**
 * HTTP server configuration
 */
export interface HttpServerConfig {
  port: number;
  host: string;
  trustProxy: boolean;
  cors: {
    origin: string | string[];
    methods: string[];
    allowedHeaders: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
    standardHeaders: boolean;
  };
}

/**
 * Create and start the HTTP server
 * @param mcpServer MCP server
 * @param jsonRpcHandler JSON-RPC handler
 * @param apiKeyManager API key manager
 * @param resourceManager Resource manager
 * @param config Server configuration
 * @returns HTTP server instance
 */
export async function createHttpServer(
  mcpServer: McpServer,
  jsonRpcHandler: JsonRpcHandler,
  apiKeyManager: ApiKeyManager,
  resourceManager: WordPressResourceManager,
  config: HttpServerConfig
) {
  const app = express();
  
  // Trust proxy if configured (for AWS ELB, etc.)
  if (config.trustProxy) {
    app.set('trust proxy', true);
  }
  
  // Apply security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders
  }));
  
  // Apply rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: config.rateLimit.standardHeaders,
    message: JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: JsonRpcHandler.ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests, please try again later',
      },
      id: null
    })
  });
  app.use('/mcp', limiter);
  
  // JSON parsing for request bodies
  app.use(express.json({ limit: '1mb' }));
  
  // Request logging
  app.use((req, res, next) => {
    const requestStart = Date.now();
    
    // Log when the request completes
    res.on('finish', () => {
      const duration = Date.now() - requestStart;
      const statusCode = res.statusCode;
      
      logger.debug(`${req.method} ${req.originalUrl} ${statusCode} ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        status: statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      // Record metrics
      metrics.incrementCounter('http_requests_total', {
        method: req.method,
        status: statusCode.toString(),
        path: req.path
      });
      
      metrics.recordHistogram('http_request_duration_ms', duration, {
        method: req.method,
        status: statusCode.toString(),
        path: req.path
      });
    });
    
    next();
  });
  
  // Storage for MCP transports
  const transports: Record<string, StreamableHTTPServerTransport> = {};
  
  // Auth middleware for MCP endpoint
  const authMiddleware = createAuthMiddleware(apiKeyManager);
  
  // Mount resource router
  const resourceRouter = createResourceRouter(resourceManager);
  app.use('/api/v1', authMiddleware, resourceRouter);
  
  // Handle POST requests for MCP client-to-server communication
  app.post('/mcp', authMiddleware, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;
    
    try {
      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        const eventStore = new InMemoryEventStore();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          eventStore, // Enable resumability
          onsessioninitialized: (sessionId) => {
            // Store the transport by session ID
            transports[sessionId] = transport;
          }
        });
        
        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            delete transports[transport.sessionId];
          }
        };
        
        // Connect to the MCP server
        await mcpServer.connect(transport);
      } else {
        // Handle as direct JSON-RPC request
        const context = new RequestContext();
        
        // Copy auth context from request
        if (req.authContext) {
          context.authContext = req.authContext;
        }
        
        // Process the JSON-RPC request
        const response = await jsonRpcHandler.processRequest(req.body, context);
        
        if (response) {
          return res.json(response);
        }
        
        // Notification with no response
        return res.status(204).end();
      }
      
      // Handle the request through MCP transport
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error('Error handling MCP request', { error });
      
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: JsonRpcHandler.ERROR_CODES.INTERNAL_ERROR,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });
  
  // Handle GET requests for server-to-client notifications via SSE
  app.get('/mcp', authMiddleware, async (req, res) => {
    await handleSessionRequest(req, res, transports);
  });
  
  // Handle DELETE requests for session termination
  app.delete('/mcp', authMiddleware, async (req, res) => {
    await handleSessionRequest(req, res, transports);
  });
  
  // Add a health check endpoint
  app.get('/health', (req, res) => {
    const healthStatus = {
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      activeSessions: Object.keys(transports).length,
      uptime: process.uptime()
    };
    
    res.status(200).json(healthStatus);
  });
  
  // Add a metrics endpoint
  app.get('/metrics', (req, res) => {
    res.set('Content-Type', metrics.contentType);
    res.status(200).send('TODO: Implement metrics export');
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Not Found',
      },
      id: null
    });
  });
  
  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err });
    
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: JsonRpcHandler.ERROR_CODES.INTERNAL_ERROR,
          message: 'Internal server error',
        },
        id: null
      });
    }
  });
  
  // Start the server
  return new Promise<any>((resolve) => {
    const server = app.listen(config.port, config.host, () => {
      logger.info(`HTTP server listening on ${config.host}:${config.port}`);
      resolve(server);
    });
  });
}

/**
 * Handle session-based GET and DELETE requests
 */
async function handleSessionRequest(
  req: express.Request,
  res: express.Response,
  transports: Record<string, StreamableHTTPServerTransport>
) {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  
  try {
    await transport.handleRequest(req, res);
  } catch (error) {
    logger.error('Error handling session request', { error });
    
    if (!res.headersSent) {
      res.status(500).send('Internal server error');
    }
  }
}

/**
 * Check if a request is an initialize request
 */
function isInitializeRequest(body: any): boolean {
  return (
    body &&
    body.jsonrpc === '2.0' &&
    body.method === 'initialize' &&
    body.params &&
    body.id
  );
}
