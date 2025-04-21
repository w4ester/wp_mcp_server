# WordPress MCP Server: Security Guide

This document outlines security best practices for deploying and operating the WordPress MCP Server in production environments.

## Security Architecture

The WordPress MCP Server implements a multi-layered security approach:

1. **Authentication Layer**: API key validation with environment variable storage
2. **Transport Layer**: HTTPS enforcement and secure communication
3. **Rate Limiting Layer**: Protection against abuse and DoS attacks
4. **Validation Layer**: Input validation for all requests
5. **Audit Layer**: Security event logging and monitoring

## Production Deployment Checklist

Before deploying to production, ensure you've completed these security steps:

- [ ] **API Keys**: Store in environment variables or AWS Secrets Manager (not files)
- [ ] **HTTPS**: Enable HTTPS enforcement (`HTTPS_REQUIRED=true`)
- [ ] **Rate Limiting**: Configure appropriate limits based on expected traffic
- [ ] **CORS**: Restrict to specific domains, never use `*` in production
- [ ] **Audit Logging**: Enable and configure retention policy
- [ ] **Password Policy**: Use strong password requirements
- [ ] **API Key Rotation**: Implement 90-day (or less) rotation policy
- [ ] **Network Security**: Deploy behind firewall/WAF in restricted network

## Environment Variables

The following environment variables control security features:

### API Key Security

```
API_KEY_SOURCE=env       # Options: env, file, aws
API_KEY_ROTATION_DAYS=90 # Key rotation period in days
```

For AWS Secrets Manager:
```
AWS_REGION=us-east-1
AWS_SECRET_NAME=wordpress-mcp/api-keys
```

### HTTPS Security

```
HTTPS_REQUIRED=true
DEVELOPMENT_EXEMPT=false  # Set to false in production
```

### Rate Limiting

```
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # Adjust based on expected traffic
RATE_LIMIT_IP_BASED=true
RATE_LIMIT_SKIP_IPS=10.0.0.1,10.0.0.2  # Internal IPs if needed
```

### Audit Logging

```
AUDIT_LOG_ENABLED=true
AUDIT_LOG_LEVEL=info       # Options: info, warning, critical
AUDIT_LOG_PATH=/var/log/wordpress-mcp/audit.log
```

### CORS Configuration

```
# Comma-separated list of allowed origins
CORS_ORIGIN=https://app.example.com,https://admin.example.com
CORS_METHODS=GET,POST
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-API-Key,X-MCP-Key
```

## Security Best Practices

### API Key Management

1. **Separate Keys per Environment**: Use different API keys for development, staging, and production
2. **Limited Scope**: Give each key the minimum permissions required
3. **Regular Rotation**: Rotate keys every 90 days or sooner
4. **Secure Storage**: Store keys in environment variables or secrets manager, never in files

Example API key configuration:

```json
{
  "keys": [
    {
      "key": "your-production-api-key",
      "name": "Production API Key",
      "clientId": "production-client",
      "permissions": ["read", "write"],
      "authorizedSites": ["main-site", "blog-site"],
      "active": true,
      "created": "2025-01-01T00:00:00Z",
      "expires": "2025-04-01T00:00:00Z"  // 90-day expiration
    }
  ]
}
```

### WordPress Credentials

1. **Application Passwords**: Always use WordPress application passwords, never master passwords
2. **Limited Permissions**: Create dedicated API users with the minimum required permissions
3. **Separate Credentials**: Use different credentials for each environment

### Network Security

1. **HTTPS Only**: Enable HTTPS enforcement in production
2. **WAF/Firewall**: Deploy behind a WAF to filter malicious traffic
3. **IP Restrictions**: Restrict administrative access to known IPs
4. **VPC/Private Network**: Deploy in a private network when possible

### Logging and Monitoring

1. **Audit Logging**: Enable audit logging for all security events
2. **Log Rotation**: Implement log rotation to avoid disk space issues
3. **Monitoring**: Set up alerts for security events
4. **Regular Review**: Review security logs regularly for suspicious activity

## Security Incident Response

If you discover a security vulnerability:

1. **Isolate**: Temporarily disable the affected service if necessary
2. **Investigate**: Review audit logs to understand the scope
3. **Remediate**: Fix the vulnerability
4. **Rotate**: Change all API keys and credentials
5. **Document**: Document the incident and your response

## Regular Security Tasks

- [ ] **Weekly**: Review audit logs for suspicious activity
- [ ] **Monthly**: Check for expired or soon-to-expire API keys
- [ ] **Quarterly**: Rotate all API keys and credentials
- [ ] **Quarterly**: Review access permissions
- [ ] **Semi-annually**: Conduct a security review of the entire system

By following these guidelines, you help to better ensure the secure operation of your WordPress MCP Server in production environments.