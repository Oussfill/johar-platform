import { LoggerService, Logger } from "@nestjs/common";

interface LogContext {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  organizationId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  errorCode?: string;
  [key: string]: any;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordconfirm",
  "otp",
  "token",
  "refreshtoken",
  "accesstoken",
  "apikey",
  "api_key",
  "secret",
  "mfasecret",
  "authorization",
  "cookie",
  "sessionid",
  "devicefingerprint",
  "database_url",
  "jwt_secret",
  "jwt_refresh_secret",
  "encryption_key",
  "provider_secret",
  "credit_card",
  "ssn",
  "kyc",
  "passport",
  "otpauth",
  "iban",
  "bic",
]);

function redactValue(key: string, value: any): any {
  if (value === null || value === undefined) return value;
  if (SENSITIVE_KEYS.has(key.toLowerCase())) {
    if (typeof value === "string" && value.length > 4) {
      return value.slice(0, 2) + "***" + value.slice(-2);
    }
    return "[REDACTED]";
  }
  if (typeof value === "object" && value !== null) {
    return redactObject(value);
  }
  return value;
}

function redactObject(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = redactValue(key, value);
  }
  return result;
}

function formatJsonLog(level: string, message: string, context?: string, meta?: LogContext): string {
  const entry: Record<string, any> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "johar-backend",
  };

  if (context) entry.context = context;

  if (meta) {
    const redacted = redactObject(meta);
    for (const [key, value] of Object.entries(redacted)) {
      if (value !== undefined) entry[key] = value;
    }
  }

  return JSON.stringify(entry);
}

export class StructuredLogger implements LoggerService {
  private logger: Logger;

  constructor(private context: string) {
    this.logger = new Logger(context);
  }

  log(message: string, meta?: LogContext): void {
    if (process.env.LOG_FORMAT === "json") {
      console.log(formatJsonLog("info", message, this.context, meta));
    } else {
      this.logger.log(message);
    }
  }

  error(message: string, trace?: string, meta?: LogContext): void {
    if (process.env.LOG_FORMAT === "json") {
      const entry: Record<string, any> = {
        timestamp: new Date().toISOString(),
        level: "error",
        message,
        service: "johar-backend",
        context: this.context,
      };
      if (trace) entry.stack = trace;
      if (meta) {
        const redacted = redactObject(meta);
        for (const [key, value] of Object.entries(redacted)) {
          if (value !== undefined) entry[key] = value;
        }
      }
      console.error(JSON.stringify(entry));
    } else {
      this.logger.error(message, trace);
    }
  }

  warn(message: string, meta?: LogContext): void {
    if (process.env.LOG_FORMAT === "json") {
      console.warn(formatJsonLog("warn", message, this.context, meta));
    } else {
      this.logger.warn(message);
    }
  }

  debug(message: string, meta?: LogContext): void {
    if (process.env.LOG_FORMAT === "json") {
      console.debug(formatJsonLog("debug", message, this.context, meta));
    } else {
      this.logger.debug(message);
    }
  }

  verbose(message: string, meta?: LogContext): void {
    if (process.env.LOG_FORMAT === "json") {
      console.log(formatJsonLog("verbose", message, this.context, meta));
    } else {
      this.logger.verbose(message);
    }
  }
}
