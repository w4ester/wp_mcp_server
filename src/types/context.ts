/**
 * Request Context Types
 * 
 * These types define the context for request tracking and handling.
 */

import { randomUUID } from 'crypto';

/**
 * Authentication context containing authorization details
 */
export interface AuthContext {
  clientId: string;
  authorizedSites: string[];
  permissions: string[];
  scopes: string[];
}

/**
 * Request context for tracking request lifecycle
 */
export class RequestContext {
  public readonly correlationId: string;
  public readonly startTime: number;
  public readonly path: string[] = [];
  public authContext?: AuthContext;

  /**
   * Create a new request context
   * @param correlationId Optional correlation ID, will generate a UUID if not provided
   * @param parent Optional parent context for nested requests
   */
  constructor(correlationId?: string, parent?: RequestContext) {
    this.correlationId = correlationId || randomUUID();
    this.startTime = performance.now();

    // Copy auth context from parent if available
    if (parent?.authContext) {
      this.authContext = parent.authContext;
    }

    // Copy and extend path from parent
    if (parent?.path.length) {
      this.path = [...parent.path];
    }
  }

  /**
   * Create a child context that inherits from this context
   * @param pathSegment Optional path segment to add to the path
   * @returns A new child context
   */
  createChild(pathSegment?: string): RequestContext {
    const child = new RequestContext(this.correlationId, this);
    
    if (pathSegment) {
      child.path.push(pathSegment);
    }
    
    return child;
  }

  /**
   * Get logging context for structured logging
   * @returns Object with context fields for logging
   */
  logContext(): Record<string, any> {
    return {
      correlationId: this.correlationId,
      elapsedMs: performance.now() - this.startTime,
      path: this.path.join('.'),
      clientId: this.authContext?.clientId
    };
  }
}
