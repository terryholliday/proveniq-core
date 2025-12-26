/**
 * @file services/gateway/middleware.ts
 * @description PROVENIQ Core API Gateway Middleware
 * 
 * Features:
 * - Firebase Auth verification
 * - Rate limiting
 * - Request logging
 * - Circuit breaking
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

// ============================================
// TYPES
// ============================================

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyGenerator?: (req: FastifyRequest) => string;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;  // Failures before opening
  resetTimeout: number;      // Ms before trying again
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

// ============================================
// RATE LIMITER
// ============================================

export class RateLimiter {
  private readonly _limits: Map<string, RateLimitEntry>;
  private readonly config: RateLimitConfig;
  
  constructor(config: RateLimitConfig) {
    this.config = config;
    this._limits = new Map();
  }
  
  public check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let entry = this._limits.get(key);
    
    // Clean up or create entry
    if (!entry || now >= entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + this.config.windowMs,
      };
    }
    
    entry.count++;
    this._limits.set(key, entry);
    
    const allowed = entry.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    
    return { allowed, remaining, resetAt: entry.resetAt };
  }
  
  public getMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const key = this.config.keyGenerator 
        ? this.config.keyGenerator(request) 
        : request.ip;
      
      const { allowed, remaining, resetAt } = this.check(key);
      
      reply.header('X-RateLimit-Remaining', remaining.toString());
      reply.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
      
      if (!allowed) {
        reply.status(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
        });
        return;
      }
    };
  }
}

// ============================================
// CIRCUIT BREAKER
// ============================================

export class CircuitBreaker {
  private readonly _circuits: Map<string, CircuitState>;
  private readonly config: CircuitBreakerConfig;
  
  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this._circuits = new Map();
  }
  
  public canExecute(serviceId: string): boolean {
    const state = this._circuits.get(serviceId);
    
    if (!state) return true;
    
    if (state.state === 'CLOSED') return true;
    
    if (state.state === 'OPEN') {
      // Check if we should try again
      if (Date.now() - state.lastFailure >= this.config.resetTimeout) {
        state.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    
    // HALF_OPEN - allow one request
    return true;
  }
  
  public recordSuccess(serviceId: string): void {
    const state = this._circuits.get(serviceId);
    
    if (state) {
      state.failures = 0;
      state.state = 'CLOSED';
    }
  }
  
  public recordFailure(serviceId: string): void {
    let state = this._circuits.get(serviceId);
    
    if (!state) {
      state = { failures: 0, lastFailure: 0, state: 'CLOSED' };
      this._circuits.set(serviceId, state);
    }
    
    state.failures++;
    state.lastFailure = Date.now();
    
    if (state.failures >= this.config.failureThreshold) {
      state.state = 'OPEN';
      console.warn(`[CIRCUIT] Circuit OPEN for ${serviceId} after ${state.failures} failures`);
    }
  }
  
  public getState(serviceId: string): CircuitState['state'] {
    return this._circuits.get(serviceId)?.state || 'CLOSED';
  }
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

export interface AuthContext {
  uid: string;
  email?: string;
  role?: string;
}

export async function verifyFirebaseToken(request: FastifyRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  // In production: Verify with Firebase Admin SDK
  // For now, decode JWT without verification (development only)
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    
    return {
      uid: payload.sub || payload.user_id,
      email: payload.email,
      role: payload.role || 'user',
    };
  } catch {
    console.warn('[AUTH] Failed to decode token');
    return null;
  }
}

export function requireAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = await verifyFirebaseToken(request);
    
    if (!auth) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
      });
      return;
    }
    
    // Attach to request
    (request as FastifyRequest & { auth: AuthContext }).auth = auth;
  };
}

export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = (request as FastifyRequest & { auth?: AuthContext }).auth;
    
    if (!auth) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    
    if (!roles.includes(auth.role || 'user')) {
      reply.status(403).send({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`,
      });
      return;
    }
  };
}

// ============================================
// REQUEST LOGGING
// ============================================

export function requestLogger() {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const start = Date.now();
    const { method, url } = request;
    const correlationId = request.headers['x-correlation-id'] || request.id;
    
    console.log(`[REQUEST] ${method} ${url} | correlation=${correlationId}`);
    
    // Log response time after completion
    request.raw.on('close', () => {
      const duration = Date.now() - start;
      console.log(`[RESPONSE] ${method} ${url} | ${duration}ms | correlation=${correlationId}`);
    });
  };
}

// ============================================
// HEALTH CHECK
// ============================================

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  lastCheck: string;
  error?: string;
}

export async function checkServiceHealth(
  name: string,
  url: string,
  timeout = 5000
): Promise<ServiceHealth> {
  const start = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const latencyMs = Date.now() - start;
    
    return {
      name,
      status: response.ok ? 'healthy' : 'degraded',
      latencyMs,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// REGISTER MIDDLEWARE
// ============================================

export function registerGatewayMiddleware(server: FastifyInstance): void {
  // Rate limiter: 100 requests per minute per IP
  const rateLimiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
  });
  
  // Global hooks
  server.addHook('onRequest', requestLogger());
  server.addHook('onRequest', rateLimiter.getMiddleware());
  
  console.log('[GATEWAY] Middleware registered');
}

// Default instances
export const defaultRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
});

export const defaultCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30 * 1000,
});
