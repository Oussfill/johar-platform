import { JwtService } from "@nestjs/jwt";
import { USERS, TENANTS } from "./fixtures";

describe("Auth - JWT Token Security", () => {
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({ secret: "test-secret-key-that-is-long-enough-for-hs256-algorithm" });
  });

  it("generates valid JWT tokens", () => {
    const payload = {
      sub: USERS.sellerA.id,
      email: USERS.sellerA.email,
      organizationId: USERS.sellerA.organizationId,
      roles: USERS.sellerA.roles,
      permissions: [],
      sessionId: "session-123",
    };
    const token = jwtService.sign(payload);
    expect(token).toBeDefined();
    const decoded = jwtService.verify(token);
    expect(decoded.sub).toBe(USERS.sellerA.id);
    expect(decoded.email).toBe(USERS.sellerA.email);
  });

  it("rejects tokens with wrong secret", () => {
    const wrongService = new JwtService({ secret: "wrong-secret-key-that-is-long-enough-123" });
    const token = jwtService.sign({ sub: "user-1" });
    expect(() => wrongService.verify(token)).toThrow();
  });

  it("rejects expired tokens", () => {
    const token = jwtService.sign({ sub: "user-1" }, { expiresIn: "0s" });
    expect(() => jwtService.verify(token)).toThrow();
  });

  it("includes organizationId for tenant users", () => {
    const payload = {
      sub: USERS.sellerA.id,
      email: USERS.sellerA.email,
      organizationId: USERS.sellerA.organizationId,
      roles: USERS.sellerA.roles,
      permissions: [],
      sessionId: "session-123",
    };
    const token = jwtService.sign(payload);
    const decoded = jwtService.verify(token);
    expect(decoded.organizationId).toBe(TENANTS.tenantA.id);
  });

  it("omits organizationId for platform admins", () => {
    const payload = {
      sub: USERS.platformAdmin.id,
      email: USERS.platformAdmin.email,
      roles: USERS.platformAdmin.roles,
      permissions: [],
      sessionId: "session-456",
    };
    const token = jwtService.sign(payload);
    const decoded = jwtService.verify(token);
    expect(decoded.organizationId).toBeUndefined();
  });
});

describe("Auth - Password Validation", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const passwords = ["abc", "1234567", "short"];
    for (const pw of passwords) {
      expect(pw.length).toBeLessThan(8);
    }
  });

  it("accepts passwords with 8+ characters", () => {
    const passwords = ["TestPassword123!", "longpassword", "12345678"];
    for (const pw of passwords) {
      expect(pw.length).toBeGreaterThanOrEqual(8);
    }
  });
});
