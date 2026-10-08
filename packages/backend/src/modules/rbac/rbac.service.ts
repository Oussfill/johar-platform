import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";
import { UserRole } from "./user-role.entity";

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>
  ) {}

  async findAllRoles(user: any): Promise<Role[]> {
    const roles = await this.roleRepo.find({ relations: ["permissions"], where: { isActive: true } });
    if (!user?.roles?.includes("SUPER_ADMIN")) {
      return roles.filter((role) => role.name !== "SUPER_ADMIN");
    }
    return roles;
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepo.findOne({
      where: { name },
      relations: ["permissions"],
    });
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  async assignPermissionsToRole(
    roleId: string,
    permissionNames: string[]
  ): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ["permissions"],
    });
    if (!role) throw new NotFoundException("Role not found");

    const permissions = await this.permRepo.find({
      where: { name: In(permissionNames) },
    });

    role.permissions = permissions;
    return this.roleRepo.save(role);
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    user: any,
    organizationId?: string
  ): Promise<UserRole> {
    if (!user?.roles?.includes("SUPER_ADMIN")) {
      const role = await this.roleRepo.findOne({ where: { id: roleId } });
      if (!role) throw new NotFoundException("Role not found");
      if (role.name === "SUPER_ADMIN" || role.name === "PLATFORM_ADMIN") {
        throw new ForbiddenException(
          `Only SUPER_ADMIN can assign the ${role.name} role`
        );
      }
    }

    const userRole = this.userRoleRepo.create({
      userId,
      roleId,
      organizationId,
    });
    return this.userRoleRepo.save(userRole);
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoleRepo.find({
      where: { userId, isActive: true },
      relations: ["role"],
    });
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.getUserRoles(userId);
    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) return [];

    const roles = await this.roleRepo.find({
      where: { id: In(roleIds) },
      relations: ["permissions"],
    });

    const permissionSet = new Set<string>();
    roles.forEach((role) => {
      role.permissions.forEach((perm) => permissionSet.add(perm.name));
    });

    return Array.from(permissionSet);
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permRepo.find({ order: { resource: "ASC", action: "ASC" } });
  }

  async seedRolesAndPermissions(): Promise<void> {
    const permissions = [
      { name: "users:read", resource: "users", action: "read" },
      { name: "users:write", resource: "users", action: "write" },
      { name: "users:delete", resource: "users", action: "delete" },
      { name: "organizations:read", resource: "organizations", action: "read" },
      { name: "organizations:write", resource: "organizations", action: "write" },
      { name: "organizations:delete", resource: "organizations", action: "delete" },
      { name: "assets:read", resource: "assets", action: "read" },
      { name: "assets:write", resource: "assets", action: "write" },
      { name: "assets:delete", resource: "assets", action: "delete" },
      { name: "assets:verify", resource: "assets", action: "verify" },
      { name: "listings:read", resource: "listings", action: "read" },
      { name: "listings:write", resource: "listings", action: "write" },
      { name: "listings:delete", resource: "listings", action: "delete" },
      { name: "offers:read", resource: "offers", action: "read" },
      { name: "offers:write", resource: "offers", action: "write" },
      { name: "transactions:read", resource: "transactions", action: "read" },
      { name: "transactions:write", resource: "transactions", action: "write" },
      { name: "invoices:read", resource: "invoices", action: "read" },
      { name: "invoices:write", resource: "invoices", action: "write" },
      { name: "payments:read", resource: "payments", action: "read" },
      { name: "payments:write", resource: "payments", action: "write" },
      { name: "kyc:read", resource: "kyc", action: "read" },
      { name: "kyc:write", resource: "kyc", action: "write" },
      { name: "kyc:approve", resource: "kyc", action: "approve" },
      { name: "labs:read", resource: "labs", action: "read" },
      { name: "labs:write", resource: "labs", action: "write" },
      { name: "labs:approve", resource: "labs", action: "approve" },
      { name: "compliance:read", resource: "compliance", action: "read" },
      { name: "compliance:write", resource: "compliance", action: "write" },
      { name: "compliance:approve", resource: "compliance", action: "approve" },
      { name: "logistics:read", resource: "logistics", action: "read" },
      { name: "logistics:write", resource: "logistics", action: "write" },
      { name: "blockchain:read", resource: "blockchain", action: "read" },
      { name: "blockchain:write", resource: "blockchain", action: "write" },
      { name: "audit:read", resource: "audit", action: "read" },
      { name: "notifications:read", resource: "notifications", action: "read" },
      { name: "notifications:write", resource: "notifications", action: "write" },
      { name: "settings:read", resource: "settings", action: "read" },
      { name: "settings:write", resource: "settings", action: "write" },
      { name: "reports:read", resource: "reports", action: "read" },
      { name: "reports:write", resource: "reports", action: "write" },
    ];

    for (const perm of permissions) {
      await this.permRepo
        .createQueryBuilder()
        .insert()
        .into(Permission)
        .values(perm)
        .orIgnore()
        .execute();
    }

    const allPerms = await this.permRepo.find();

    const roles = [
      {
        name: "SUPER_ADMIN",
        description: "Platform super administrator",
        isSystem: true,
      },
      {
        name: "PLATFORM_ADMIN",
        description: "Platform administrator",
        isSystem: true,
      },
      {
        name: "ORG_OWNER",
        description: "Organization owner",
        isSystem: false,
      },
      {
        name: "ORG_ADMIN",
        description: "Organization administrator",
        isSystem: false,
      },
      {
        name: "SELLER",
        description: "Seller on marketplace",
        isSystem: false,
      },
      {
        name: "BUYER",
        description: "Buyer on marketplace",
        isSystem: false,
      },
      {
        name: "LAB_MANAGER",
        description: "Laboratory manager",
        isSystem: false,
      },
      {
        name: "LAB_TECHNICIAN",
        description: "Laboratory technician",
        isSystem: false,
      },
      {
        name: "COMPLIANCE_OFFICER",
        description: "Compliance officer",
        isSystem: false,
      },
      {
        name: "FINANCE_MANAGER",
        description: "Finance manager",
        isSystem: false,
      },
      {
        name: "LOGISTICS_MANAGER",
        description: "Logistics manager",
        isSystem: false },
      {
        name: "AUDITOR",
        description: "Audit viewer",
        isSystem: false,
      },
      {
        name: "WAREHOUSE_MANAGER",
        description: "Warehouse manager",
        isSystem: false,
      },
      {
        name: "HR_MANAGER",
        description: "Human resources manager",
        isSystem: false,
      },
      {
        name: "CUSTODY_MANAGER",
        description: "Custody manager (four-eyes transfers)",
        isSystem: false,
      },
      {
        name: "SUPPLIER",
        description: "Supplier manager",
        isSystem: false,
      },
      {
        name: "CRM_OFFICER",
        description: "CRM officer",
        isSystem: false,
      },
      {
        name: "PURCHASER",
        description: "Procurement purchaser",
        isSystem: false,
      },
      {
        name: "SALES_OFFICER",
        description: "Sales officer",
        isSystem: false,
      },
      {
        name: "CONTENT_MANAGER",
        description: "Content and marketing manager",
        isSystem: false,
      },
      {
        name: "TRUST_ADMIN",
        description: "Trust verification reviewer",
        isSystem: false,
      },
    ];

    for (const role of roles) {
      await this.roleRepo
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values(role)
        .orIgnore()
        .execute();
    }

    const superAdminRole = await this.findRoleByName("SUPER_ADMIN");
    if (superAdminRole) {
      superAdminRole.permissions = allPerms;
      await this.roleRepo.save(superAdminRole);
    }

    const platformAdminRole = await this.findRoleByName("PLATFORM_ADMIN");
    if (platformAdminRole) {
      platformAdminRole.permissions = allPerms;
      await this.roleRepo.save(platformAdminRole);
    }

    const orgOwnerPerms = allPerms.filter(
      (p) => !p.name.startsWith("settings:") && !p.name.startsWith("reports:")
    );
    const orgOwnerRole = await this.findRoleByName("ORG_OWNER");
    if (orgOwnerRole) {
      orgOwnerRole.permissions = orgOwnerPerms;
      await this.roleRepo.save(orgOwnerRole);
    }

    const sellerPerms = allPerms.filter(
      (p) =>
        p.name.startsWith("assets:") ||
        p.name.startsWith("listings:") ||
        p.name.startsWith("offers:") ||
        p.name.startsWith("transactions:") ||
        p.name === "users:read" ||
        p.name === "notifications:read" ||
        p.name === "notifications:write"
    );
    const sellerRole = await this.findRoleByName("SELLER");
    if (sellerRole) {
      sellerRole.permissions = sellerPerms;
      await this.roleRepo.save(sellerRole);
    }

    const buyerPerms = allPerms.filter(
      (p) =>
        p.name.startsWith("listings:read") ||
        p.name.startsWith("offers:") ||
        p.name.startsWith("transactions:") ||
        p.name === "users:read" ||
        p.name === "notifications:read" ||
        p.name === "notifications:write"
    );
    const buyerRole = await this.findRoleByName("BUYER");
    if (buyerRole) {
      buyerRole.permissions = buyerPerms;
      await this.roleRepo.save(buyerRole);
    }

    const labManagerPerms = allPerms.filter(
      (p) =>
        p.name.startsWith("labs:") ||
        p.name.startsWith("assets:read") ||
        p.name === "users:read" ||
        p.name === "notifications:read" ||
        p.name === "notifications:write"
    );
    const labManagerRole = await this.findRoleByName("LAB_MANAGER");
    if (labManagerRole) {
      labManagerRole.permissions = labManagerPerms;
      await this.roleRepo.save(labManagerRole);
    }

    const compliancePerms = allPerms.filter(
      (p) =>
        p.name.startsWith("compliance:") ||
        p.name.startsWith("kyc:") ||
        p.name === "users:read" ||
        p.name === "notifications:read" ||
        p.name === "notifications:write"
    );
    const complianceRole = await this.findRoleByName("COMPLIANCE_OFFICER");
    if (complianceRole) {
      complianceRole.permissions = compliancePerms;
      await this.roleRepo.save(complianceRole);
    }

    const financePerms = allPerms.filter(
      (p) =>
        p.name.startsWith("invoices:") ||
        p.name.startsWith("payments:") ||
        p.name.startsWith("transactions:read") ||
        p.name === "users:read" ||
        p.name === "notifications:read" ||
        p.name === "notifications:write"
    );
    const financeRole = await this.findRoleByName("FINANCE_MANAGER");
    if (financeRole) {
      financeRole.permissions = financePerms;
      await this.roleRepo.save(financeRole);
    }

    const logisticsPerms = allPerms.filter(
      (p) =>
        p.name.startsWith("logistics:") ||
        p.name.startsWith("assets:read") ||
        p.name === "users:read" ||
        p.name === "notifications:read" ||
        p.name === "notifications:write"
    );
    const logisticsRole = await this.findRoleByName("LOGISTICS_MANAGER");
    if (logisticsRole) {
      logisticsRole.permissions = logisticsPerms;
      await this.roleRepo.save(logisticsRole);
    }

    const auditorPerms = allPerms.filter(
      (p) =>
        p.name.startsWith("audit:read") ||
        p.name === "users:read" ||
        p.name === "organizations:read" ||
        p.name === "assets:read" ||
        p.name === "transactions:read"
    );
    const auditorRole = await this.findRoleByName("AUDITOR");
    if (auditorRole) {
      auditorRole.permissions = auditorPerms;
      await this.roleRepo.save(auditorRole);
    }
  }
}
