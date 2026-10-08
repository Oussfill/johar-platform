import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "../../modules/audit/audit.entity";
import { TenantContext } from "../types/tenant.types";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const SENSITIVE_BODY_KEYS = new Set([
  "password",
  "passwordconfirm",
  "secret",
  "token",
  "refreshtoken",
  "accesstoken",
  "mfasecret",
  "otpauth",
  "code",
  "otp",
  "authorization",
  "cookie",
  "sessionid",
  "devicefingerprint",
  "iban",
  "bic",
  "ssn",
  "credit_card",
  "accountnumber",
  "documentnumber",
  "kyc",
  "passport",
]);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip, headers } = request;
    const tenant: TenantContext | undefined = (request as any).tenant;
    const requestId = headers["x-request-id"];

    if (!MUTATION_METHODS.has(method)) {
      return next.handle();
    }

    const resource = this.extractResource(url);
    const action = this.mapMethodToAction(method);

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logMutation({
          actorId: tenant?.userId,
          organizationId: tenant?.organizationId,
          action,
          resource,
          resourceId: this.extractResourceId(request),
          after: this.sanitizeBody(body),
          ipAddress: ip,
          userAgent: headers["user-agent"],
          requestId,
          metadata: { duration, statusCode: 200 },
        }).catch((err) =>
          this.logger.error(`Audit log failed: ${err.message}`)
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logMutation({
          actorId: tenant?.userId,
          organizationId: tenant?.organizationId,
          action: `${action}.FAILED`,
          resource,
          resourceId: this.extractResourceId(request),
          after: { error: error.message, statusCode: error.status || 500 },
          ipAddress: ip,
          userAgent: headers["user-agent"],
          requestId,
          metadata: { duration, statusCode: error.status || 500 },
        }).catch((err) =>
          this.logger.error(`Audit log failed: ${err.message}`)
        );
        throw error;
      })
    );
  }

  private async logMutation(data: Partial<AuditLog>): Promise<void> {
    const entry = this.auditRepo.create(data);
    await this.auditRepo.save(entry);
  }

  private extractResource(url: string): string {
    const segments = url.split("/").filter(Boolean);
    const apiIndex = segments.indexOf("api");
    if (apiIndex >= 0 && segments[apiIndex + 2]) {
      return segments[apiIndex + 2];
    }
    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
    return "unknown";
  }

  private extractResourceId(request: any): string | undefined {
    return request.params?.id || request.params?.sessionId;
  }

  private mapMethodToAction(method: string): string {
    switch (method) {
      case "POST": return "CREATE";
      case "PUT":
      case "PATCH": return "UPDATE";
      case "DELETE": return "DELETE";
      default: return method;
    }
  }

  private sanitizeBody(body: any): any {
    if (body === null || body === undefined) return undefined;
    return this.redact(body);
  }

  private redact(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) => this.redact(item));
    }
    if (value !== null && typeof value === "object") {
      const result: Record<string, any> = {};
      for (const [key, nested] of Object.entries(value)) {
        result[key] = SENSITIVE_BODY_KEYS.has(key.toLowerCase())
          ? "[REDACTED]"
          : this.redact(nested);
      }
      return result;
    }
    return value;
  }
}
