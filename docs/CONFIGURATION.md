# Configuration Guide

## Overview

The WordPress MCP Server uses a layered configuration system that supports multiple environments and secure credential management.

## Configuration Files

### 1. Main Configuration (`config/default.json`)

Main server settings, environment configuration, and general options.

```json
{
  "environment": "development",
  "server": {
    "port": 3000,
    "host": "localhost",
    "trustProxy": false,
    "cors": {
      "origin": "*",
      "methods": ["GET", "POST", "DELETE"],
      "allowedHeaders": ["Content-Type", "Authorization", "X-API-Key"]
    },
    "rateLimit": {
      "windowMs": 900000,
      "max": 100,
      "standardHeaders": false
    }
  },
  "logging": {
    "level": "info",
    "format": "json"
  },
  "security": {
    "apiKeys": {
      "source": "file",
      "path": "./config/api-keys.json"
    }
  },
  "wordpress": {
    "sitesConfigPath": "./config/wp-sites.json",
    "secretsPath": "./config/wp-secrets.json"
  },
  "mcp": {
    "name": "wordpress-mcp-server",
    "version": "1.0.0",
    "transport": "http"
  }
}
```

### 2. Production Configuration (`config/production.json`)

Overrides for production environment:

```json
{
  "environment": "production",
  "server": {
    "port": 80,
    "host": "0.0.0.0",
    "trustProxy": true,
    "cors": {
      "origin": ["https://app.example.com", "https://dashboard.example.com"],
      "methods": ["GET", "POST", "DELETE"],
      "allowedHeaders": ["Content-Type", "Authorization", "X-API-Key"]
    },
    "rateLimit": {
      "windowMs": 900000,
      "max": 100,
      "standardHeaders": true
    }
  },
  "logging": {
    "level": "warn",
    "format": "json"
  },
  "security": {
    "apiKeys": {
      "source": "aws",
      "secretName": "wordpress-mcp/api-keys"
    }
  },
  "wordpress": {
    "sitesConfigPath": "/etc/wordpress-mcp/wp-sites.json",
    "secretsPath": "/etc/wordpress-mcp/wp-secrets.json"
  }
}
```

### 3. WordPress Sites Configuration (`config/wp-sites.json`)

Configure all WordPress sites you want to manage:

```json
{
  "sites": [
    {
      "name": "main-blog",
      "url": "https://blog.example.com",
      "username": "api-user",
      "environment": "production",
      "staging": {
        "url": "https://staging.blog.example.com",
        "username": "api-user-staging"
      }
    },
    {
      "name": "corporate-site",
      "url": "https://www.example.com",
      "username": "wp-admin",
      "environment": "production"
    }
  ]
}
```

### 4. WordPress Secrets (`config/wp-secrets.json`)

Sensitive credentials for WordPress sites:

```json
{
  "main-blog": {
    "applicationPassword": "xxxx xxxx xxxx xxxx",
    "staging": {
      "applicationPassword": "yyyy yyyy yyyy yyyy"
    }
  },
  "corporate-site": {
    "applicationPassword": "zzzz zzzz zzzz zzzz"
  }
}
```

### 5. API Keys Configuration (`config/api-keys.json`)

Define API keys for client authentication:

```json
{
  "keys": [
    {
      "id": "client-1",
      "key": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "name": "Production Client",
      "permissions": ["read", "write"],
      "sites": ["main-blog", "corporate-site"]
    },
    {
      "id": "client-2",
      "key": "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
      "name": "Development Client",
      "permissions": ["read"],
      "sites": ["main-blog"]
    }
  ]
}
```

## Environment Variables

Override configuration using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development, production, test) | development |
| `PORT` | Server port | 3000 |
| `HOST` | Server host | localhost |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | info |
| `API_KEY_SOURCE` | API key source (file, env, aws) | file |
| `API_KEYS` | JSON string of API keys (when source=env) | - |
| `AWS_REGION` | AWS region for secrets | us-east-1 |
| `AWS_SECRET_NAME` | AWS Secrets Manager secret name | - |

## Security Configuration

### API Key Sources

1. **File-based** (`source: "file"`):
   - Store keys in `api-keys.json`
   - Best for development and simple deployments

2. **Environment-based** (`source: "env"`):
   - Store keys in `API_KEYS` environment variable
   - Good for container deployments

3. **AWS Secrets Manager** (`source: "aws"`):
   - Store keys in AWS Secrets Manager
   - Best for production deployments
   - Requires `AWS_REGION` and `AWS_SECRET_NAME`

### WordPress Application Passwords

1. Enable application passwords in WordPress:
   - WordPress 5.6+ has this feature built-in
   - Accessible under Users → Profile → Application Passwords

2. Create a dedicated API user:
   - Limited permissions (Editor or custom role)
   - Separate application password for each environment

### CORS Configuration

Configure allowed origins based on your clients:

```json
{
  "cors": {
    "origin": ["https://app.example.com"],
    "methods": ["GET", "POST", "DELETE"],
    "allowedHeaders": ["Content-Type", "Authorization", "X-API-Key"],
    "credentials": true,
    "maxAge": 86400
  }
}
```

## Multi-Environment Setup

### Development Environment

1. Use local WordPress instances
2. Relaxed security settings
3. Verbose logging
4. All origins allowed in CORS

### Staging Environment

1. Mirror production setup
2. Test data and content
3. Stricter security than development
4. Limited CORS origins

### Production Environment

1. Optimized settings
2. Strict security
3. Error-level logging only
4. Specific CORS origins

## Advanced Configuration

### Rate Limiting

Configure different limits per environment:

```json
{
  "rateLimit": {
    "windowMs": 900000,  // 15 minutes
    "max": 100,         // requests per window
    "message": "Too many requests",
    "standardHeaders": true,
    "legacyHeaders": false,
    "keyGenerator": "x-api-key || ip",
    "skip": ["127.0.0.1", "::1"]
  }
}
```

### Monitoring Configuration

Enable metrics and monitoring:

```json
{
  "monitoring": {
    "prometheus": {
      "enabled": true,
      "port": 9090,
      "path": "/metrics"
    },
    "healthCheck": {
      "path": "/health",
      "detailedPath": "/health/detailed"
    }
  }
}
```

### Cache Configuration

Configure response caching:

```json
{
  "cache": {
    "enabled": true,
    "ttl": 300,
    "maxSize": 1000,
    "strategy": "lru"
  }
}
```

## Docker Configuration

Use environment variables in Docker:

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info
ENV API_KEY_SOURCE=env
ENV API_KEYS='{"keys":[...]}'
```

Docker Compose example:

```yaml
version: '3.8'
services:
  wordpress-mcp:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=3000
      - API_KEY_SOURCE=env
      - API_KEYS_FILE=/run/secrets/api-keys
    secrets:
      - api-keys
    volumes:
      - ./config:/app/config:ro
    ports:
      - "3000:3000"

secrets:
  api-keys:
    file: ./secrets/api-keys.json
```

## Kubernetes Configuration

Use ConfigMaps and Secrets:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: wordpress-mcp-config
data:
  config.json: |
    {
      "environment": "production",
      "server": {
        "port": 3000
      }
    }
---
apiVersion: v1
kind: Secret
metadata:
  name: wordpress-mcp-secrets
type: Opaque
data:
  api-keys.json: BASE64_ENCODED_API_KEYS
  wp-secrets.json: BASE64_ENCODED_WP_SECRETS
```

## Best Practices

1. **Separate Configurations**: Keep development, staging, and production configs separate
2. **Secure Secrets**: Never commit secrets to version control
3. **Environment Variables**: Use for deployment-specific settings
4. **Validate Configuration**: Implement startup validation
5. **Logging**: Configure appropriate levels per environment
6. **API Keys**: Use strong, unique keys per client
7. **CORS**: Be restrictive in production
8. **Rate Limiting**: Adjust based on expected traffic
9. **Monitoring**: Enable in production environments
10. **Backup**: Keep configuration backups

## Troubleshooting

### Common Issues

1. **Missing Configuration Files**:
   - Check file paths are correct
   - Ensure proper permissions

2. **Invalid JSON**:
   - Validate JSON syntax
   - Check for trailing commas

3. **Environment Variables Not Loading**:
   - Verify variable names
   - Check .env file location

4. **Secrets Not Found**:
   - Confirm AWS credentials
   - Check secret names

### Configuration Validation

Run validation before starting:

```bash
npm run validate-config
```

This checks:
- JSON syntax
- Required fields
- Permission settings
- File accessibility
