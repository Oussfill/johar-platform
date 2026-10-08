import { TenantMiddleware } from "./tenant.middleware";
import { JwtService } from "@nestjs/jwt";

describe("TenantMiddleware", () => {
  let middleware: TenantMiddleware;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({ secret: "test-secret-key-that-is-long-enough-for-hs256" });
    middleware = new TenantMiddleware(jwtService);
  });

  function createRequest(authHeader?: string) {
    return {
      headers: {
        authorization: authHeader,
      },
    } as any;
  }

  function createResponse() {
    return {} as any;
  }

  it("calls next() when no auth header", () => {
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).tenant).toBeUndefined();
  });

  it("calls next() when auth header is not Bearer", () => {
    const req = createRequest("Basic abc123");
    const res = createResponse();
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).tenant).toBeUndefined();
  });

  it("parses valid JWT and sets tenant context", () => {
    const payload = {
      sub: "user-1",
      email: "test@example.com",
      organizationId: "org-1",
      roles: ["SELLER"],
      permissions: ["assets:create"],
      sessionId: "session-1",
    };
    const token = jwtService.sign(payload);

    const req = createRequest(`Bearer ${token}`);
    const res = createResponse();
    const next = jest.fn();
    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).tenant).toEqual({
      userId: "user-1",
      email: "test@example.com",
      organizationId: "org-1",
      roles: ["SELLER"],
      permissions: ["assets:create"],
      sessionId: "session-1",
    });
  });

  it("sets tenant with empty roles/permissions when not in token", () => {
    const payload = {
      sub: "user-1",
      email: "test@example.com",
      sessionId: "session-1",
    };
    const token = jwtService.sign(payload);

    const req = createRequest(`Bearer ${token}`);
    const res = createResponse();
    const next = jest.fn();
    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).tenant).toEqual({
      userId: "user-1",
      email: "test@example.com",
      organizationId: undefined,
      roles: [],
      permissions: [],
      sessionId: "session-1",
    });
  });

  it("calls next() with undefined tenant on invalid token", () => {
    const req = createRequest("Bearer invalid.token.here");
    const res = createResponse();
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).tenant).toBeUndefined();
  });

  it("calls next() with undefined tenant on expired token", () => {
    const payload = {
      sub: "user-1",
      email: "test@example.com",
      sessionId: "session-1",
    };
    const token = jwtService.sign(payload, { expiresIn: "0s" });

    const req = createRequest(`Bearer ${token}`);
    const res = createResponse();
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).tenant).toBeUndefined();
  });
});
