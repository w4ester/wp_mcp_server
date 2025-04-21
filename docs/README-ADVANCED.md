# WordPress MCP Server: Developer & Contributor Guide

## Architecture Deep Dive

### Core Architecture

The WordPress MCP Server is built on a modular architecture with clear separation of concerns:

1. **Transport Layer**: Handles HTTP/WebSocket/STDIO connections
2. **Protocol Layer**: Implements JSON-RPC 2.0 and MCP protocols
3. **Service Layer**: WordPress client abstraction and site management
4. **Tool Layer**: Individual WordPress feature implementations
5. **Resource Layer**: MCP resource exposure and management

```
┌──────────────────────────────────────────────────────────────┐
│                        Transport Layer                       │
│  HTTPServer │ WebSocketServer │ STDIOTransport │ SSEStream  │
└─────────────┬────────────────┬────────────────┬────────────┘
              │                │                 │
┌─────────────▼────────────────▼─────────────────▼────────────┐
│                        Protocol Layer                       │
│  JSONRPCHandler │ MCPProtocol │ ResourceProtocol           │
└─────────────┬────────────────┬─────────────────────────────┘
              │                │
┌─────────────▼────────────────▼─────────────────────────────┐
│                         Service Layer                       │
│  WordPressClient │ SiteManager │ AuthManager │ MetricsCollector
└─────────────┬────────────────┬─────────────────────────────┘
              │                │
┌─────────────▼────────────────▼─────────────────────────────┐
│                          Tool Layer                         │
│  Posts │ Pages │ Media │ Users │ Categories │ Tags │ Plugins │
└─────────────┬──────────────────────────────────────────────┘
              │
┌─────────────▼──────────────────────────────────────────────┐
│                        Resource Layer                      │
│  ResourceManager │ ResourceProviders │ URIResolver         │
└────────────────────────────────────────────────────────────┘
```

### Design Patterns & Principles

1. **Dependency Injection**: All major components use constructor injection
2. **Strategy Pattern**: Different transport strategies (HTTP, STDIO)
3. **Factory Pattern**: Site manager creates configured clients
4. **Repository Pattern**: Resource providers abstract data access
5. **Middleware Pattern**: Express middleware for auth, logging, metrics

## Development Setup

### Environment Setup

```bash
# Clone repository
git clone https://github.com/your-org/wordpress-mcp-server.git
cd wordpress-mcp-server

# Install dependencies
npm install

# Set up development environment
cp config/default.json config/development.json
cp config/wp-sites.example.json config/wp-sites.json
cp config/wp-secrets.example.json config/wp-secrets.json

# Run in development mode
npm run dev
```

### Development Tools

1. **TypeScript Configuration**: Strict mode enabled for type safety
2. **ESLint**: Code quality and consistency
3. **Jest**: Unit and integration testing
4. **Nodemon**: Auto-reload during development
5. **VS Code Debug Config**: Included launch configurations

### Testing Strategy

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/wordpress-client.test.ts

# Run tests in watch mode
npm run test:watch
```

## Extension Points

### Adding New WordPress Tools

1. Create tool implementation:
```typescript
// src/wordpress/tools/custom.ts
import { z } from 'zod';
import { JsonRpcHandler } from '../../json-rpc/handler.js';
import { WordPressSiteManager } from '../site-manager.js';

export const CustomToolSchema = z.object({
  site: z.string(),
  // ... parameters
});

export function registerCustomTools(
  handler: JsonRpcHandler,
  siteManager: WordPressSiteManager
): void {
  handler.registerMethod(
    'wp.custom.action',
    async (params, context) => {
      const client = await siteManager.getClient(params.site);
      // Implementation
    },
    CustomToolSchema,
    'Description of the custom tool'
  );
}
```

2. Register tool in index:
```typescript
// src/wordpress/tools/index.ts
export function registerAllWordPressTools(...) {
  // ...
  registerCustomTools(handler, siteManager);
}
```

### Creating Resource Providers

1. Implement resource provider:
```typescript
// src/resources/providers/custom.ts
import { ResourceProvider } from '../types.js';

export class CustomResourceProvider implements ResourceProvider {
  async listResources(site?: string): Promise<Resource[]> {
    // Implementation
  }

  async getResourceContent(uri: string): Promise<ResourceContent | null> {
    // Implementation
  }
}
```

2. Register in resource manager:
```typescript
// src/resources/resource-manager.ts
export class WordPressResourceManager {
  private providers: Map<string, ResourceProvider> = new Map();

  constructor() {
    this.providers.set('custom', new CustomResourceProvider());
  }
}
```

### Custom Authentication Strategies

```typescript
// src/middleware/auth/oauth.ts
import { Request, Response, NextFunction } from 'express';

export function createOAuthMiddleware(config: OAuthConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // OAuth implementation
    next();
  };
}
```

## Advanced Configuration

### Multi-Region Deployment

```typescript
// config/multi-region.json
{
  "regions": {
    "us-east-1": {
      "sites": ["site1", "site2"],
      "server": { "port": 3001 }
    },
    "eu-west-1": {
      "sites": ["site3", "site4"],
      "server": { "port": 3002 }
    }
  }
}
```

### Custom Metrics Collection

```typescript
// src/utils/monitoring/custom-metrics.ts
import { Metrics } from './index.js';

export function registerCustomMetrics(metrics: Metrics) {
  metrics.registerGauge('wordpress_cache_hit_ratio', 'Cache hit ratio');
  metrics.registerHistogram('wordpress_api_latency', 'API latency', {
    buckets: [0.1, 0.5, 1, 2, 5]
  });
}
```

## Performance Optimization

### Caching Strategies

1. **Response Caching**: Cache WordPress API responses
```typescript
import NodeCache from 'node-cache';

class CachedWordPressClient extends WordPressClient {
  private cache = new NodeCache({ stdTTL: 600 });

  async request<T>(path: string, options: RequestInit): Promise<T> {
    const cacheKey = `${path}:${JSON.stringify(options)}`;
    const cached = this.cache.get<T>(cacheKey);
    
    if (cached) return cached;
    
    const result = await super.request<T>(path, options);
    this.cache.set(cacheKey, result);
    return result;
  }
}
```

2. **Connection Pooling**: Reuse HTTP connections
```typescript
import { Agent } from 'https';

const agent = new Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 10
});
```

### Horizontal Scaling

1. **Redis Session Storage**: For multi-instance deployments
```typescript
import Redis from 'ioredis';
import { EventStore } from '@modelcontextprotocol/sdk/inMemory.js';

class RedisEventStore implements EventStore {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  // Implementation
}
```

2. **Load Balancing**: Configure for AWS ALB or Nginx
```nginx
upstream mcp_servers {
  least_conn;
  server 10.0.0.1:3000;
  server 10.0.0.2:3000;
  server 10.0.0.3:3000;
}
```

## Security Considerations

### Rate Limiting Strategies

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip
});
```

### Input Validation

```typescript
// Enhanced validation with custom refinements
const PostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
  status: z.enum(['publish', 'draft', 'private'])
}).refine(data => {
  // Custom validation logic
  return true;
}, {
  message: "Custom validation failed"
});
```

## Contributing Guidelines

### Code Style

1. **TypeScript**: Use strict mode, explicit types
2. **File Structure**: One component per file
3. **Naming Conventions**: 
   - Files: kebab-case
   - Classes: PascalCase
   - Functions/Variables: camelCase
4. **Documentation**: JSDoc for all public APIs

### Pull Request Process

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Update documentation
6. Submit pull request

### Feature Development

#### Example: Adding GraphQL Support

1. Create GraphQL handler:
```typescript
// src/graphql/handler.ts
import { GraphQLSchema } from 'graphql';

export class GraphQLHandler {
  private schema: GraphQLSchema;

  constructor(siteManager: WordPressSiteManager) {
    this.schema = this.buildSchema(siteManager);
  }

  private buildSchema(siteManager: WordPressSiteManager): GraphQLSchema {
    // Build schema dynamically from WordPress structure
  }
}
```

2. Integrate with Express:
```typescript
// src/server/http.ts
import { graphqlHTTP } from 'express-graphql';

app.use('/graphql', graphqlHTTP({
  schema: graphqlHandler.schema,
  graphiql: process.env.NODE_ENV === 'development'
}));
```

## Advanced Deployment

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress-mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wordpress-mcp
  template:
    metadata:
      labels:
        app: wordpress-mcp
    spec:
      containers:
      - name: wordpress-mcp
        image: wordpress-mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
```

### Serverless Deployment (AWS Lambda)

```typescript
// src/lambda.ts
import serverless from 'serverless-http';
import { createApp } from './app.js';

export const handler = serverless(createApp());
```

## Monitoring & Observability

### OpenTelemetry Integration

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const sdk = new NodeSDK({
  metricReader: new PrometheusExporter({
    port: 9464,
  }),
  instrumentations: [
    // Add instrumentations
  ],
});

sdk.start();
```

### Custom Health Checks

```typescript
app.get('/health/detailed', async (req, res) => {
  const checks = await Promise.all([
    checkWordPressConnectivity(),
    checkDatabaseConnection(),
    checkRedisConnection()
  ]);

  res.json({
    status: checks.every(c => c.status === 'ok') ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

## Ideas for Improvement

1. **Plugin System**: Allow dynamic loading of plugins
2. **WebSocket Support**: Real-time updates for WordPress changes
3. **GraphQL API**: Alternative to JSON-RPC
4. **CLI Tool**: Command-line management interface
5. **Admin Dashboard**: Web-based management UI
6. **Automated Testing**: Integration with WordPress test instances
7. **Event Sourcing**: Track all WordPress changes
8. **Multi-tenancy**: Better isolation between sites
9. **Custom Post Types**: Support for WordPress custom types
10. **Gutenberg Integration**: Support for block editor content

## Getting Help

- GitHub Discussions: Technical discussions
- Issue Tracker: Bug reports and feature requests
- Discord Community: Real-time help
- Weekly Dev Calls: Join our planning sessions

Remember: The best contributions come from solving real problems. Start with what you need, build it well, and share it with the community!
