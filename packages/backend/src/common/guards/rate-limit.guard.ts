import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { StructuredLogger } from "../logger/structured.logger";

const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMITS = {
  short: { ttl: 1000, limit: 3 },
  medium: { ttl: 10000, limit: 20 },
  long: { ttl: 60000, limit: 100 },
};

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private logger = new StructuredLogger("RateLimit");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const ip = request.ip || request.connection?.remoteAddress || "unknown";
    const now = Date.now();

    const key = `rate:${ip}`;
    const entry = requestCounts.get(key);

    if (requestCounts.size > 10000) {
      for (const [mapKey, mapEntry] of requestCounts) {
        if (mapEntry.resetTime <= now) {
          requestCounts.delete(mapKey);
        }
      }
    }

    let count = 1;
    let resetTime = now + RATE_LIMITS.long.ttl;

    if (entry && entry.resetTime > now) {
      count = entry.count + 1;
      resetTime = entry.resetTime;
    }

    requestCounts.set(key, { count, resetTime });

    const limit = RATE_LIMITS.long.limit;
    const remaining = Math.max(0, limit - count);
    const resetSeconds = Math.ceil((resetTime - now) / 1000);

    response.setHeader("X-RateLimit-Limit", String(limit));
    response.setHeader("X-RateLimit-Remaining", String(remaining));
    response.setHeader("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)));

    if (count > limit) {
      this.logger.warn(`Rate limit exceeded for ${ip}`, {
        ip,
        method: request.method,
        path: request.url,
        limit,
        remaining: 0,
        retryAfter: resetSeconds,
      });
      response.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests",
        },
        retryAfter: resetSeconds,
      });
      return new Observable();
    }

    return next.handle();
  }
}
