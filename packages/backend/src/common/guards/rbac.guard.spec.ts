import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RbacGuard, RequireRoles, RequirePermission } from "./rbac.guard";
import { TenantContext } from "../types/tenant.types";

describe("RbacGuard", () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RbacGuard(reflector);
  });

  function createContext(overrides: { tenant?: TenantContext } = {}) {
    const request = { tenant: overrides.tenant };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  describe("public endpoints", () => {
    it("allows access without tenant when marked public", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "isPublic") return true;
        return undefined;
      });
      const context = createContext({ tenant: undefined });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("authentication", () => {
    it("throws when no tenant and not public", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
      const context = createContext({ tenant: undefined });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe("no decorators", () => {
    it("allows any authenticated non-admin when no metadata present", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", roles: ["SELLER"], permissions: [] },
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("roles", () => {
    it("allows when required role is present", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "roles") return ["ADMIN"];
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", roles: ["ADMIN"], permissions: [] },
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("blocks when required role is missing", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "roles") return ["ADMIN"];
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", roles: ["SELLER"], permissions: [] },
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("allows SUPER_ADMIN regardless of metadata", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "roles") return ["SELLER"];
        return undefined;
      });
      const context = createContext({
        tenant: { userId: "1", email: "a@b.com", roles: ["SUPER_ADMIN"], permissions: [] },
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("permissions", () => {
    it("allows when all required permissions present", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "permissions") return ["finance:read"];
        return undefined;
      });
      const context = createContext({
        tenant: {
          userId: "1",
          email: "a@b.com",
          roles: ["ACCOUNTANT"],
          permissions: ["finance:read", "finance:write"],
        },
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("blocks when any required permission is missing", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === "permissions") return ["finance:read", "finance:delete"];
        return undefined;
      });
      const context = createContext({
        tenant: {
          userId: "1",
          email: "a@b.com",
          roles: ["ACCOUNTANT"],
          permissions: ["finance:read"],
        },
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});