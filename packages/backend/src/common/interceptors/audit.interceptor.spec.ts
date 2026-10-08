import { ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable, of, throwError } from "rxjs";
import { AuditInterceptor } from "./audit.interceptor";
import { Repository } from "typeorm";
import { AuditLog } from "../../modules/audit/audit.entity";

describe("AuditInterceptor", () => {
  let interceptor: AuditInterceptor;
  let auditRepo: jest.Mocked<Repository<AuditLog>>;

  beforeEach(() => {
    auditRepo = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;
    interceptor = new AuditInterceptor(auditRepo);
  });

  function createContext(method: string, url: string, opts: { body?: any; params?: any; ip?: string; headers?: any; tenant?: any } = {}) {
    const request = {
      method,
      url,
      body: opts.body || {},
      params: opts.params || {},
      ip: opts.ip || "127.0.0.1",
      headers: {
        "user-agent": "test-agent",
        "x-request-id": "req-1",
        ...opts.headers,
      },
      tenant: opts.tenant,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  function createCallHandler(responseBody?: any, error?: Error): CallHandler {
    return {
      handle: () => error ? throwError(() => error) : of(responseBody),
    };
  }

  it("skips audit for GET requests", (done) => {
    const context = createContext("GET", "/api/v1/assets");
    const next = createCallHandler({ id: "1" });

    interceptor.intercept(context, next).subscribe({
      next: (value) => {
        expect(value).toEqual({ id: "1" });
        expect(auditRepo.create).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it("logs successful POST mutations", (done) => {
    auditRepo.create.mockReturnValue({ id: "audit-1" } as AuditLog);
    auditRepo.save.mockResolvedValue({ id: "audit-1" } as AuditLog);

    const context = createContext("POST", "/api/v1/assets", {
      body: { name: "Gold Bar", type: "BULLION" },
      tenant: { userId: "user-1", organizationId: "org-1" },
    });
    const next = createCallHandler({ id: "asset-1" });

    interceptor.intercept(context, next).subscribe({
      next: (value) => {
        expect(value).toEqual({ id: "asset-1" });
        expect(auditRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            actorId: "user-1",
            organizationId: "org-1",
            action: "CREATE",
            resource: "assets",
          })
        );
        expect(auditRepo.save).toHaveBeenCalled();
        done();
      },
    });
  });

  it("redacts sensitive fields from body", (done) => {
    auditRepo.create.mockReturnValue({ id: "audit-1" } as AuditLog);
    auditRepo.save.mockResolvedValue({ id: "audit-1" } as AuditLog);

    const context = createContext("POST", "/api/v1/auth/register", {
      body: {
        email: "a@b.com",
        password: "secret123",
        passwordConfirm: "secret123",
        mfaSecret: "ABCDEFGHIJKL",
        otpauth: "otpauth://totp/JOHAR",
        nested: { token: "abcdefghijklmnop", code: "123456", safe: "keep-me" },
      },
    });
    const next = createCallHandler({ id: "user-1" });

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            after: expect.objectContaining({
              email: "a@b.com",
              password: "[REDACTED]",
              passwordConfirm: "[REDACTED]",
              mfaSecret: "[REDACTED]",
              otpauth: "[REDACTED]",
              nested: expect.objectContaining({
                token: "[REDACTED]",
                code: "[REDACTED]",
                safe: "keep-me",
              }),
            }),
          })
        );
        done();
      },
    });
  });

  it("logs failed mutations with error info", (done) => {
    auditRepo.create.mockReturnValue({ id: "audit-1" } as AuditLog);
    auditRepo.save.mockResolvedValue({ id: "audit-1" } as AuditLog);

    const error = new Error("Validation failed");
    (error as any).status = 400;

    const context = createContext("POST", "/api/v1/assets", {
      body: { name: "Test" },
      tenant: { userId: "user-1", organizationId: "org-1" },
    });
    const next = createCallHandler(undefined, error);

    interceptor.intercept(context, next).subscribe({
      error: (err) => {
        expect(err.message).toBe("Validation failed");
        expect(auditRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            action: "CREATE.FAILED",
          })
        );
        done();
      },
    });
  });

  it("extracts resource ID from params", (done) => {
    auditRepo.create.mockReturnValue({ id: "audit-1" } as AuditLog);
    auditRepo.save.mockResolvedValue({ id: "audit-1" } as AuditLog);

    const context = createContext("DELETE", "/api/v1/assets/asset-123", {
      params: { id: "asset-123" },
    });
    const next = createCallHandler({ success: true });

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(auditRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            resourceId: "asset-123",
            action: "DELETE",
          })
        );
        done();
      },
    });
  });

  it("handles audit save failure gracefully", (done) => {
    auditRepo.create.mockReturnValue({ id: "audit-1" } as AuditLog);
    auditRepo.save.mockRejectedValue(new Error("DB down"));

    const context = createContext("POST", "/api/v1/assets", {
      body: { name: "Test" },
    });
    const next = createCallHandler({ id: "1" });

    interceptor.intercept(context, next).subscribe({
      next: (value) => {
        expect(value).toEqual({ id: "1" });
        done();
      },
    });
  });
});
