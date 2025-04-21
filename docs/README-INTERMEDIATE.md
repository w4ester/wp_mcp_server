# WordPress MCP Server: Comprehensive Guide

## Overview

The WordPress MCP Server is a TypeScript-based implementation that provides a standardized JSON-RPC 2.0 API for interacting with WordPress sites. It enables AI applications and other clients to manage WordPress content through the Model Context Protocol (MCP).

## Architecture Overview

The server is built with several key components:

1. **JSON-RPC Handler**: Processes and validates JSON-RPC 2.0 requests
2. **WordPress Client**: Manages connections to WordPress REST API
3. **Site Manager**: Handles multi-tenant WordPress site configurations
4. **Tools**: Implementations for specific WordPress features (posts, pages, media, etc.)
5. **MCP Resources**: Exposes WordPress entities as MCP resources
6. **HTTP Server**: Provides HTTP transport with authentication and rate limiting

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  MCP Clients    │────▶│ HTTP Server  │────▶│  JSON-RPC       │
│ (AI, Tools)     │     │ (Express)    │     │  Handler        │
└─────────────────┘     └──────────────┘     └─────────────────┘
                                                     │
                                                     ▼
                        ┌──────────────┐     ┌─────────────────┐
                        │ WordPress    │◀────│  Site Manager   │
                        │ REST API     │     │                 │
                        └──────────────┘     └─────────────────┘
```

## Installation & Setup

### Prerequisites
- Node.js 16+
- WordPress 5.6+ with REST API enabled
- Application passwords or JWT authentication

### Configuration Files

1. **Site Configuration** (`config/wp-sites.json`):
```json
{
  "sites": [
    {
      "name": "main-site",
      "url": "https://example.com",
      "username": "admin",
      "environment": "production",
      "staging": {
        "url": "https://staging.example.com",
        "applicationPassword": "xxxx xxxx xxxx xxxx"
      }
    }
  ]
}
```

2. **Secrets Configuration** (`config/wp-secrets.json`):
```json
{
  "main-site": {
    "applicationPassword": "xxxx xxxx xxxx xxxx",
    "staging": {
      "applicationPassword": "yyyy yyyy yyyy yyyy"
    }
  }
}
```

3. **Server Configuration** (`config/production.json`):
```json
{
  "environment": "production",
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "trustProxy": true,
    "cors": {
      "origin": ["https://trusted-client.com"],
      "methods": ["GET", "POST", "DELETE"],
      "allowedHeaders": ["Content-Type", "Authorization", "X-API-Key"]
    },
    "rateLimit": {
      "windowMs": 900000,
      "max": 100
    }
  },
  "security": {
    "apiKeys": {
      "source": "file",
      "path": "/path/to/api-keys.json"
    }
  }
}
```

## API Reference

### Authentication

The server supports API key authentication via the `X-API-Key` header:
```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/mcp
```

### WordPress Tool Methods

#### Posts Management
- `wp.posts.list` - List posts with filtering
- `wp.posts.get` - Get single post by ID
- `wp.posts.create` - Create new post
- `wp.posts.update` - Update existing post
- `wp.posts.delete` - Delete post

Example:
```json
{
  "jsonrpc": "2.0",
  "method": "wp.posts.create",
  "params": {
    "site": "main-site",
    "title": "Advanced Post",
    "content": "Content with HTML support",
    "status": "publish",
    "categories": [1, 2],
    "tags": [3, 4],
    "featured_media": 123
  },
  "id": 1
}
```

#### Media Management
- `wp.media.list` - List media items
- `wp.media.get` - Get media item
- `wp.media.create` - Upload media file (base64 encoded)
- `wp.media.update` - Update media metadata
- `wp.media.delete` - Delete media item

#### Users Management
- `wp.users.list` - List users
- `wp.users.get` - Get user by ID
- `wp.users.create` - Create new user
- `wp.users.update` - Update user
- `wp.users.delete` - Delete user

### MCP Resources

Resources are exposed with standardized URIs:
```
wordpress://site-name/resource-type/id
```

Resource types:
- `posts` - Blog posts
- `pages` - WordPress pages
- `media` - Media library items
- `users` - User accounts
- `categories` - Post categories
- `tags` - Post tags

## Advanced Usage

### Multi-Environment Setup
```javascript
// Switch between environments programmatically
{
  "method": "wp.site.useEnvironment",
  "params": {
    "site": "main-site",
    "environment": "staging"
  }
}
```

### Batch Operations
```javascript
// Batch request example
[
  { "jsonrpc": "2.0", "method": "wp.posts.list", "params": {"site": "main-site"}, "id": 1 },
  { "jsonrpc": "2.0", "method": "wp.users.list", "params": {"site": "main-site"}, "id": 2 }
]
```

### Resource Discovery
```bash
# List all resources
GET /api/v1/resources

# Get specific resource
GET /api/v1/resources/wordpress://main-site/posts/123
```

## Deployment

### Docker Deployment
```bash
docker build -t wordpress-mcp-server .
docker run -p 3000:3000 \
  -v /path/to/config:/app/config \
  -e NODE_ENV=production \
  wordpress-mcp-server
```

### AWS Deployment
Use the provided CloudFormation template:
```bash
aws cloudformation create-stack \
  --stack-name wordpress-mcp \
  --template-body file://deployment/aws/cloudformation.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production
```

## Monitoring & Logging

The server includes built-in monitoring with metrics for:
- Request counts and latency
- Error rates
- WordPress API response times
- Active sessions

Access metrics at:
```
GET /metrics
```

Log levels can be configured:
```json
{
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

## Best Practices

1. **Security**
   - Always use HTTPS in production
   - Rotate API keys regularly
   - Set up rate limiting appropriately
   - Use application passwords instead of main account credentials

2. **Performance**
   - Implement caching for frequently accessed resources
   - Use batch operations for multiple requests
   - Monitor API response times

3. **Error Handling**
   - Implement proper error recovery
   - Log errors with correlation IDs
   - Use appropriate status codes

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API key is correct
   - Check site credentials in wp-secrets.json
   - Ensure WordPress application passwords are enabled

2. **Connection Issues**
   - Verify WordPress site URL is correct
   - Check if REST API is enabled
   - Test connectivity with curl

3. **Rate Limiting**
   - Monitor request counts
   - Implement backoff strategies
   - Consider increasing limits for production

### Debug Mode
Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

## Integration Examples

### Using with AI Assistants
```javascript
// Example integration with Claude
const response = await claude.invoke('tools.use', {
  tool: 'wordpress-mcp',
  method: 'wp.posts.create',
  params: {
    site: 'blog',
    title: 'AI-Generated Post',
    content: aiGeneratedContent
  }
});
```

### Webhook Integration
```javascript
// Listen for WordPress events
app.post('/webhook', (req, res) => {
  const event = req.body;
  // Process WordPress webhook
});
```

## Contributing

See our contributing guide for:
- Setting up development environment
- Running tests
- Submitting pull requests
- Code style guidelines

## Support

- GitHub Issues: Report bugs and feature requests
- Documentation: Complete API reference
- Community Forum: Get help from other users
