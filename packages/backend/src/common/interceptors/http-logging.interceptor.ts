import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { StructuredLogger } from "../logger/structured.logger";
import { MetricsService } from "../metrics/metrics.service";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private logger = new StructuredLogger("HTTP");

  constructor(private metrics?: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const tenant = (request as any).tenant;
    const requestId = headers["x-request-id"];
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const path = (request.route?.path as string | undefined) || "unmatched";

        this.logger.log(`${method} ${url} ${statusCode}`, {
          requestId,
          userId: tenant?.userId,
          organizationId: tenant?.organizationId,
          method,
          path,
          statusCode,
          duration,
          ip,
          userAgent: headers["user-agent"],
        });

        this.metrics?.recordHttpRequest(method, path, statusCode, duration);
      })
    );
  }
}
