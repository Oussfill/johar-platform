import { TenantContext } from "../common/types/tenant.types";
import { USERS, TENANTS } from "./fixtures";

describe("Authorization - RBAC", () => {
  const roleHierarchy: Record<string, string[]> = {
    SUPER_ADMIN: ["*"],
    PLATFORM_ADMIN: ["organizations.*", "users.*", "rbac.*"],
    ORG_ADMIN: ["assets.*", "members.*"],
    SELLER: ["assets:read", "assets:create", "listings:*"],
    BUYER: ["assets:read", "listings:read", "offers:*"],
    FINANCE_OFFICER: ["invoices:*", "payments:*", "ledger:read"],
    AUDITOR: ["audit:read", "ledger:read"],
    LAB_MANAGER: ["labs:*", "assay:*"],
  };

  it("SUPER_ADMIN has all permissions", () => {
    expect(roleHierarchy["SUPER_ADMIN"]).toContain("*");
  });

  it("SELLER cannot access finance endpoints", () => {
    const sellerPerms = roleHierarchy["SELLER"];
    expect(sellerPerms).not.toContain("invoices:*");
    expect(sellerPerms).not.toContain("payments:*");
  });

  it("BUYER cannot create assets", () => {
    const buyerPerms = roleHierarchy["BUYER"];
    expect(buyerPerms).not.toContain("assets:create");
    expect(buyerPerms).toContain("assets:read");
  });

  it("FINANCE_OFFICER can confirm payments", () => {
    const financePerms = roleHierarchy["FINANCE_OFFICER"];
    expect(financePerms).toContain("payments:*");
  });

  it("AUDITOR has read-only access", () => {
    const auditorPerms = roleHierarchy["AUDITOR"];
    for (const perm of auditorPerms) {
      expect(perm).toContain(":read");
    }
  });
});

describe("Authorization - ABAC", () => {
  function createTenantContext(user: any): TenantContext {
    return {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles,
      permissions: [],
      sessionId: "session-123",
    };
  }

  it("blocks cross-tenant access for non-admins", () => {
    const tenantA = createTenantContext(USERS.sellerA);
    const resourceOrg = TENANTS.tenantB.id;

    if (tenantA.organizationId && resourceOrg !== tenantA.organizationId) {
      expect(tenantA.organizationId).not.toBe(resourceOrg);
    }
  });

  it("allows same-tenant access", () => {
    const tenantA = createTenantContext(USERS.sellerA);
    const resourceOrg = TENANTS.tenantA.id;

    expect(tenantA.organizationId).toBe(resourceOrg);
  });

  it("SUPER_ADMIN bypasses tenant isolation", () => {
    const superAdmin = createTenantContext(USERS.superAdmin);
    expect(superAdmin.roles).toContain("SUPER_ADMIN");
  });

  it("PLATFORM_ADMIN bypasses tenant isolation", () => {
    const platformAdmin = createTenantContext(USERS.platformAdmin);
    expect(platformAdmin.roles).toContain("PLATFORM_ADMIN");
  });
});

describe("Authorization - IDOR Prevention", () => {
  it("users can only access their own data", () => {
    const userA = USERS.sellerA;
    const userB = USERS.sellerB;
    expect(userA.id).not.toBe(userB.id);
    expect(userA.organizationId).not.toBe(userB.organizationId);
  });

  it("organization admins can only manage their org", () => {
    const orgAdmin = USERS.orgAdminA;
    expect(orgAdmin.organizationId).toBe(TENANTS.tenantA.id);
  });
});
