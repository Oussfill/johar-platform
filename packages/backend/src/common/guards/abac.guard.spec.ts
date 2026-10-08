import { ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AbacGuard, TenantIsolated, ResourceOwner, RequireAbacPermission } from "./abac.guard";
import { TenantContext } from "../types/tenant.types";

describe("AbacGuard", () => {
  let guard: AbacGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AbacGuard(reflector);
  });

  function createContext(overrides: { tenant?: TenantContext; params?: any; body?: any; query?: any } = {}) {
    const request = {
      tenant: overrides.tenant,
      params: overrides.params || {},
      body: overrides.body || {},
      query: overrides.query || {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  describe("no decorators", () => {
    it("allows access when no ABAC decorators are present", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", roles: ["SELLER"], permissions: [] },
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("authentication", () => {
    it("throws UnauthorizedException when no tenant context", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "isPublic") return undefined;
        return true;
      });
      const context = createContext({ tenant: undefined });
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });

  describe("public endpoints", () => {
    it("allows access without tenant when marked public", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
      const context = createContext({ tenant: undefined });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("allows public access even when ABAC metadata is present", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "isPublic") return true;
        return { source: "params", field: "organizationId" };
      });
      const context = createContext({
        tenant: undefined,
        params: { organizationId: "org-1" },
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("admin bypass", () => {
    it("allows SUPER_ADMIN full access", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", roles: ["SUPER_ADMIN"], permissions: [] },
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("allows PLATFORM_ADMIN full access", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", roles: ["PLATFORM_ADMIN"], permissions: [] },
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("tenant isolation", () => {
    it("allows access when resource has no org ID", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "tenantIsolated") return true;
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", organizationId: "org-1", roles: ["SELLER"], permissions: [] },
        params: {},
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("allows access when resource org matches tenant org", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "tenantIsolated") return true;
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", organizationId: "org-1", roles: ["SELLER"], permissions: [] },
        params: { organizationId: "org-1" },
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("blocks cross-tenant access", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "tenantIsolated") return true;
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", organizationId: "org-1", roles: ["SELLER"], permissions: [] },
        params: { organizationId: "org-2" },
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("allows SUPER_ADMIN cross-tenant access", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "tenantIsolated") return true;
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", organizationId: "org-1", roles: ["SUPER_ADMIN"], permissions: [] },
        params: { organizationId: "org-2" },
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("resource ownership", () => {
    it("allows access when tenant owns the resource", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "resourceOwner") return { source: "params", field: "organizationId" };
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", organizationId: "org-1", roles: ["SELLER"], permissions: [] },
        params: { organizationId: "org-1" },
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("blocks access when tenant does not own the resource", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "resourceOwner") return { source: "body", field: "organizationId" };
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", organizationId: "org-1", roles: ["SELLER"], permissions: [] },
        body: { organizationId: "org-2" },
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("allows when resource has no org ID (ownership check skipped)", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "resourceOwner") return { source: "params", field: "organizationId" };
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", organizationId: "org-1", roles: ["SELLER"], permissions: [] },
        params: {},
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("permissions", () => {
    it("allows access when all required permissions are present", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "abacPermission") return ["assets:create", "assets:read"];
        return undefined;
      });
      const context = createContext({
        tenant: {
          userId: "1",
          email: "a@b.com",
          roles: ["SELLER"],
          permissions: ["assets:create", "assets:read", "assets:write"],
        },
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("blocks access when permissions are missing", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "abacPermission") return ["assets:delete"];
        return undefined;
      });
      const context = createContext({
        tenant: {
          userId: "1",
          email: "a@b.com",
          roles: ["SELLER"],
          permissions: ["assets:create", "assets:read"],
        },
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe("validateTenantAccess (legacy method)", () => {
    it("allows SUPER_ADMIN cross-tenant", () => {
      const tenant: TenantContext = {
        userId: "1",
        email: "a@b.com",
        roles: ["SUPER_ADMIN"],
        permissions: [],
      };
      expect(() => guard.validateTenantAccess(tenant, "other-org")).not.toThrow();
    });

    it("blocks cross-tenant for non-admin", () => {
      const tenant: TenantContext = {
        userId: "1",
        email: "a@b.com",
        organizationId: "org-1",
        roles: ["SELLER"],
        permissions: [],
      };
      expect(() => guard.validateTenantAccess(tenant, "org-2")).toThrow(ForbiddenException);
    });

    it("allows same-tenant access", () => {
      const tenant: TenantContext = {
        userId: "1",
        email: "a@b.com",
        organizationId: "org-1",
        roles: ["SELLER"],
        permissions: [],
      };
      expect(() => guard.validateTenantAccess(tenant, "org-1")).not.toThrow();
    });
  });
});
