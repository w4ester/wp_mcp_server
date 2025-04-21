# Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the WordPress MCP Server.

## Quick Diagnostic Checklist

Before diving into specific issues, run through this checklist:

1. ✓ Is the server running? (`npm start` or check process)
2. ✓ Can you reach the health endpoint? (`curl http://localhost:3000/health`)
3. ✓ Are all configuration files present and valid JSON?
4. ✓ Can the server connect to WordPress sites?
5. ✓ Are API keys configured correctly?
6. ✓ Check logs for error messages

## Common Issues

### 1. Server Won't Start

#### Error: "Cannot find module"
```
Error: Cannot find module './config/default.json'
```

**Solution:**
- Ensure all configuration files exist
- Check file permissions
- Verify paths in configuration

#### Error: "Address already in use"
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
- Check if another process is using the port
- Kill the existing process: `lsof -i :3000` then `kill <PID>`
- Change the port in configuration

#### Error: "Invalid JSON"
```
SyntaxError: Unexpected token } in JSON at position ...
```

**Solution:**
- Validate JSON syntax in all config files
- Check for trailing commas
- Use a JSON validator tool

### 2. Authentication Issues

#### Error: "Invalid API key"
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Invalid API key"
  }
}
```

**Solution:**
- Verify API key is correct
- Check key is present in configuration
- Ensure proper header format: `X-API-Key: your-key`

#### Error: "Unauthorized"
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32002,
    "message": "Not authorized to access this site"
  }
}
```

**Solution:**
- Verify API key has access to the requested site
- Check site permissions in api-keys.json
- Ensure site name matches configuration

### 3. WordPress Connection Issues

#### Error: "WordPress API error"
```json
{
  "error": {
    "code": -32000,
    "message": "WordPress API error: 401 Unauthorized"
  }
}
```

**Solution:**
- Verify WordPress credentials
- Check application password is correct
- Ensure REST API is enabled in WordPress
- Verify site URL is accessible

#### Error: "Site not found"
```json
{
  "error": {
    "code": -32603,
    "message": "Site not found: my-site"
  }
}
```

**Solution:**
- Check site name in wp-sites.json
- Verify site configuration is loaded
- Ensure site name matches exactly

### 4. Performance Issues

#### Slow Response Times

**Diagnosis:**
```bash
# Check response time
time curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "wp.posts.list", "params": {"site": "blog"}, "id": 1}'
```

**Solutions:**
- Enable response caching
- Check WordPress server performance
- Optimize database queries
- Implement connection pooling

#### High Memory Usage

**Diagnosis:**
```bash
# Monitor memory usage
top -p $(pgrep -f "node.*wordpress-mcp")
```

**Solutions:**
- Check for memory leaks
- Limit concurrent connections
- Implement request queuing
- Use clustering for load distribution

### 5. Network Issues

#### Error: "CORS error"
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
- Configure CORS in server config
- Add client origin to allowed origins
- Check preflight request handling

#### Error: "Connection refused"
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
- Verify server is running
- Check firewall settings
- Ensure correct host/port configuration
- Verify network connectivity

### 6. Resource Issues

#### Error: "Resource not found"
```json
{
  "error": {
    "code": -32603,
    "message": "Resource not found: wordpress://site/posts/999"
  }
}
```

**Solution:**
- Verify resource exists in WordPress
- Check resource URI format
- Ensure proper permissions

### 7. Rate Limiting

#### Error: "Rate limit exceeded"
```json
{
  "error": {
    "code": -32604,
    "message": "Rate limit exceeded"
  }
}
```

**Solution:**
- Implement request throttling
- Increase rate limits if appropriate
- Use caching to reduce requests
- Consider API key specific limits

## Debugging Tools

### 1. Enable Debug Logging

```bash
# Set log level to debug
export LOG_LEVEL=debug
npm start
```

### 2. Use Request Tracing

```typescript
// Add to your request
{
  "jsonrpc": "2.0",
  "method": "wp.posts.list",
  "params": {
    "site": "blog",
    "__trace": true
  },
  "id": 1
}
```

### 3. Monitor Performance

```bash
# Use built-in metrics endpoint
curl http://localhost:3000/metrics
```

### 4. Test Connectivity

```bash
# Test WordPress API directly
curl -u username:application_password \
  https://your-wordpress-site.com/wp-json/wp/v2/posts
```

## Log Analysis

### Understanding Log Entries

```json
{
  "timestamp": "2024-01-20T10:30:00.000Z",
  "level": "error",
  "message": "WordPress API error",
  "error": {
    "code": "rest_forbidden",
    "message": "Sorry, you are not allowed to do that."
  },
  "correlationId": "abc-123",
  "site": "main-blog",
  "method": "wp.posts.create"
}
```

Key fields:
- `correlationId`: Track request through system
- `site`: Which WordPress site had the issue
- `method`: Which API method was called
- `error`: Specific error details

### Common Log Patterns

#### Authentication Failures
```
grep "Authentication failed" logs/app.log | tail -n 50
```

#### WordPress API Errors
```
grep "WordPress API error" logs/app.log | grep "403\|401" | tail -n 50
```

#### Performance Issues
```
grep "Request took" logs/app.log | awk '$5 > 1000' | tail -n 50
```

## Health Check Endpoints

### Basic Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Detailed Health Check
```bash
curl http://localhost:3000/health/detailed
```

Response:
```json
{
  "status": "degraded",
  "checks": {
    "wordpress_connectivity": {
      "status": "ok",
      "sites": {
        "main-blog": "connected",
        "secondary-blog": "error: timeout"
      }
    },
    "memory": {
      "status": "ok",
      "heapUsed": 123456789,
      "heapTotal": 234567890
    },
    "api_keys": {
      "status": "ok",
      "count": 5
    }
  }
}
```

## Recovery Procedures

### 1. Service Recovery

```bash
# Restart service
sudo systemctl restart wordpress-mcp

# Check service status
sudo systemctl status wordpress-mcp

# View recent logs
journalctl -u wordpress-mcp -n 100
```

### 2. Database Recovery

```bash
# Backup current state
mongodump --out=/backup/$(date +%Y%m%d)

# Restore from backup
mongorestore --dir=/backup/20240120
```

### 3. Configuration Recovery

```bash
# Restore from backup
cp /backup/config/*.json /app/config/

# Validate configuration
npm run validate-config

# Restart service
sudo systemctl restart wordpress-mcp
```

## Monitoring Best Practices

1. **Set Up Alerts**:
   - High error rates
   - Slow response times
   - Memory/CPU thresholds
   - Failed health checks

2. **Log Aggregation**:
   - Use ELK stack or similar
   - Set up log rotation
   - Archive old logs

3. **Performance Monitoring**:
   - Track response times
   - Monitor resource usage
   - Set up dashboards

## Getting Help

If you can't resolve an issue:

1. Check the GitHub issues for similar problems
2. Review the documentation thoroughly
3. Collect relevant logs and error messages
4. Create a detailed bug report:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Configuration (sanitized)
   - Log excerpts

Remember to sanitize any sensitive information before sharing logs or configuration details!
