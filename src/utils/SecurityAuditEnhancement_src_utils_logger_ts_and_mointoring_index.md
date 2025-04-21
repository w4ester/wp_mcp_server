# Security Audit Enhancement Plan

This document outlines a methodical approach to enhancing the security audit capabilities of the WordPress MCP Server by building upon the existing logging and monitoring infrastructure.

## Current Implementation Analysis

### src/utils/logger.ts

The current logger implementation provides:

- Log levels: DEBUG, INFO, WARN, ERROR, NONE
- Environment variable configuration through LOG_LEVEL
- Formatted logs with timestamp, level, and logger name
- Support for metadata objects in JSON format
- Child logger creation for categorized logging
- Level-based filtering of log messages

```typescript
// Key functionality in current logger.ts
class Logger {
  constructor(name, level = DEFAULT_LOG_LEVEL) {
    this.name = name;
    this.level = LOG_LEVELS[level] !== undefined ? level : DEFAULT_LOG_LEVEL;
  }
  
  shouldLog(level) { /* filtering logic */ }
  formatLog(level, message, meta) { /* formatting logic */ }
  
  debug(message, meta) { /* console.log with DEBUG level */ }
  info(message, meta) { /* console.log with INFO level */ }
  warn(message, meta) { /* console.warn with WARN level */ }
  error(message, meta) { /* console.error with ERROR level */ }
  
  child(name) { /* create child logger */ }
  setLevel(level) { /* change log level */ }
}

// Singleton logger instance
const logger = new Logger('WordPress-MCP');
```

### src/utils/monitoring/index.ts

The current monitoring implementation provides:

- Basic metric types: counters, gauges, histograms
- Support for dimensional labels
- In-memory metric storage
- Debug logging for metric updates
- Prometheus-compatible content type

```typescript
// Key functionality in current monitoring/index.ts
class Metrics {
  incrementCounter(name, labels = {}, value = 1) { /* increment counter */ }
  setGauge(name, value, labels = {}) { /* set gauge value */ }
  recordHistogram(name, value, labels = {}) { /* record histogram observation */ }
  
  formatKey(name, labels) { /* format metric key with labels */ }
  
  get contentType() { return 'text/plain; version=0.0.4'; }
}

// Singleton metrics instance
export const metrics = new Metrics();
```

## Proposed Enhancements

### 1. src/utils/logger.ts Enhancements

The following enhancements would add security audit capabilities to the existing logger:

```typescript
// Add to logger.ts

// Define security-specific log levels
export enum SecurityLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

// Security event interface
export interface SecurityEvent {
  timestamp: string;
  level: SecurityLevel;
  eventType: string;
  message: string;
  clientId?: string;
  ip?: string;
  userId?: string;
  resource?: string;
  action?: string;
  result?: 'success' | 'failure';
  details?: Record<string, any>;
}

// Security Audit Logger extension
export class SecurityLogger extends Logger {
  private filePath: string;
  private enabled: boolean;
  private fs: any; // Will use fs/promises in actual implementation
  
  constructor(
    name: string = 'Security',
    level: string = DEFAULT_LOG_LEVEL,
    filePath: string = process.env.SECURITY_LOG_PATH || './logs/security.log',
    enabled: boolean = process.env.SECURITY_LOGGING_ENABLED === 'true'
  ) {
    super(name, level);
    this.filePath = filePath;
    this.enabled = enabled;
    
    // We'll dynamically import fs/promises here
    // and create the log directory if it doesn't exist
  }
  
  // Log a security event to both console and file
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Log to console using parent logger method
    this[event.level.toLowerCase()](event.message, {
      eventType: event.eventType,
      clientId: event.clientId,
      ip: event.ip,
      result: event.result
    });
    
    // Skip file logging if disabled
    if (!this.enabled) {
      return;
    }
    
    try {
      // Format for file logging (JSON line)
      const logEntry = JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString()
      }) + '\n';
      
      // Write to log file (actual implementation will use fs/promises)
      // await this.fs.appendFile(this.filePath, logEntry);
    } catch (error) {
      // Log to console if file logging fails
      super.error('Failed to write security event to log file', { error });
    }
  }
  
  // Helper methods for common security events
  
  // Authentication events
  async logAuth(success: boolean, clientId: string, ip: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      level: success ? SecurityLevel.INFO : SecurityLevel.WARNING,
      eventType: success ? 'auth_success' : 'auth_failure',
      message: success ? 'Authentication succeeded' : 'Authentication failed',
      clientId,
      ip,
      result: success ? 'success' : 'failure',
      details
    });
  }
  
  // API key management events
  async logApiKeyEvent(action: 'created' | 'rotated' | 'expired' | 'revoked', clientId: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      level: SecurityLevel.INFO,
      eventType: `api_key_${action}`,
      message: `API key ${action} for client ${clientId}`,
      clientId,
      details
    });
  }
  
  // Resource access events
  async logResourceAccess(clientId: string, ip: string, resource: string, action: string, success: boolean, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      level: success ? SecurityLevel.INFO : SecurityLevel.WARNING,
      eventType: 'resource_access',
      message: `Resource ${resource} ${action} by ${clientId}: ${success ? 'succeeded' : 'denied'}`,
      clientId,
      ip,
      resource,
      action,
      result: success ? 'success' : 'failure',
      details
    });
  }
  
  // Security policy violation events
  async logSecurityViolation(ip: string, eventType: string, message: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      level: SecurityLevel.CRITICAL,
      eventType,
      message,
      ip,
      result: 'failure',
      details
    });
  }
}

// Create singleton instance
export const securityLogger = new SecurityLogger();
```

### 2. src/utils/monitoring/index.ts Enhancements

The following enhancements would add security metrics to the existing monitoring system:

```typescript
// Add to monitoring/index.ts

// Register security-specific metrics
export function registerSecurityMetrics(metrics: Metrics): void {
  // Authentication metrics
  metrics.registerCounter('security_auth_attempts_total', {}, 'Total authentication attempts');
  metrics.registerCounter('security_auth_success_total', {}, 'Successful authentication attempts');
  metrics.registerCounter('security_auth_failure_total', {}, 'Failed authentication attempts');

  // API key metrics
  metrics.registerCounter('security_api_key_operations_total', {}, 'API key management operations');
  metrics.registerCounter('security_api_key_active_total', {}, 'Currently active API keys');
  metrics.registerGauge('security_api_key_expiry_days', {}, 'Days until API key expiration');

  // Rate limiting metrics
  metrics.registerCounter('security_rate_limit_exceeded_total', {}, 'Rate limit exceeded events');
  
  // Resource access metrics
  metrics.registerCounter('security_resource_access_total', {}, 'Resource access attempts');
  metrics.registerCounter('security_resource_access_denied_total', {}, 'Denied resource access attempts');
  
  // Security policy violations
  metrics.registerCounter('security_violations_total', {}, 'Security policy violations');
}

// Example usage in application initialization
registerSecurityMetrics(metrics);

// Add new helper methods to Metrics class
class Metrics {
  // ... existing methods ...
  
  // Record authentication attempt
  recordAuthAttempt(success: boolean, clientId: string): void {
    this.incrementCounter('security_auth_attempts_total', {
      client_id: clientId
    });
    
    if (success) {
      this.incrementCounter('security_auth_success_total', {
        client_id: clientId
      });
    } else {
      this.incrementCounter('security_auth_failure_total', {
        client_id: clientId
      });
    }
  }
  
  // Record rate limit exceeded
  recordRateLimitExceeded(clientId: string, endpoint: string): void {
    this.incrementCounter('security_rate_limit_exceeded_total', {
      client_id: clientId,
      endpoint
    });
  }
  
  // Record resource access
  recordResourceAccess(clientId: string, resource: string, action: string, success: boolean): void {
    this.incrementCounter('security_resource_access_total', {
      client_id: clientId,
      resource,
      action
    });
    
    if (!success) {
      this.incrementCounter('security_resource_access_denied_total', {
        client_id: clientId,
        resource,
        action
      });
    }
  }
  
  // Record security violation
  recordSecurityViolation(type: string, ip?: string): void {
    this.incrementCounter('security_violations_total', {
      type,
      ip: ip || 'unknown'
    });
  }
}
```

## Integration Points

Once implemented, these enhancements would be integrated at key security checkpoints:

1. **Authentication Middleware** (src/middleware/auth.ts)
   ```typescript
   // When validating API keys
   if (!isValidApiKey) {
     securityLogger.logAuth(false, apiKeyValue.substring(0, 8), req.ip, {
       reason: 'invalid_key'
     });
     
     metrics.recordAuthAttempt(false, 'unknown');
     
     // Return error response
   }
   ```

2. **Rate Limiting Middleware**
   ```typescript
   // In rate limit handler
   if (isRateLimited) {
     securityLogger.logSecurityViolation(req.ip, 'rate_limit_exceeded', 
       `Rate limit exceeded for ${req.ip} on ${req.path}`,
       { path: req.path, method: req.method }
     );
     
     metrics.recordRateLimitExceeded(clientId, req.path);
     
     // Return rate limit error
   }
   ```

3. **Resource Access** (WordPress operations)
   ```typescript
   // Before processing WordPress resource operation
   securityLogger.logResourceAccess(
     context.clientId,
     context.ip,
     `wp_${resourceType}`,
     operation,
     true, // Will set to false if access denied
     { resourceId }
   );
   
   metrics.recordResourceAccess(context.clientId, `wp_${resourceType}`, operation, true);
   ```

## Implementation Plan

1. **Phase 1: Core Security Logging**
   - Add SecurityLogger class to logger.ts
   - Implement basic security event logging
   - Add file output support

2. **Phase 2: Security Metrics**
   - Add security metrics to monitoring/index.ts
   - Implement helper methods for recording security events

3. **Phase 3: Integration**
   - Integrate with authentication middleware
   - Integrate with rate limiting
   - Integrate with WordPress resource operations

4. **Phase 4: Configuration & Tuning**
   - Add environment variable configuration
   - Implement log rotation
   - Optimize performance

## Configuration

The security logging enhancements will be configurable through environment variables:

```
# Security Logging Configuration
SECURITY_LOGGING_ENABLED=true
SECURITY_LOG_PATH=./logs/security.log
SECURITY_LOG_LEVEL=INFO  # INFO, WARNING, CRITICAL
SECURITY_LOG_ROTATION_SIZE=10m  # Size threshold for rotation
SECURITY_LOG_RETENTION_DAYS=90  # How long to keep logs
```

## Benefits

This implementation:
1. Builds on existing infrastructure rather than replacing it
2. Separates security events from general application logs
3. Provides structured logging for easier analysis
4. Supports both console and file logging
5. Adds security-specific metrics for monitoring
6. Uses consistent patterns with the existing codebase
7. Is configurable through environment variables

By enhancing the existing infrastructure, we maintain backward compatibility while adding robust security audit capabilities.