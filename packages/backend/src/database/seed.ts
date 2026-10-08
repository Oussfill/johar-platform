import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { Role } from "../modules/rbac/role.entity";
import { Permission } from "../modules/rbac/permission.entity";
import { UserRole } from "../modules/rbac/user-role.entity";

const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL || "postgresql://johar:johar_secret@localhost:5432/johar_db",
  entities: [Role, Permission, UserRole],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log("Seeding database...");

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123!ChangeMe";
  if (process.env.NODE_ENV === "production" && adminPassword === "Admin@123!ChangeMe") {
    console.error("ERROR: Cannot seed with default password in production. Set SEED_ADMIN_PASSWORD.");
    await dataSource.destroy();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await queryRunner.query(
    `INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", "isActive", "isEmailVerified")
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING`,
    ["a0000000-0000-0000-0000-000000000001", "admin@johar.io", passwordHash, "Admin", "User", true, true]
  );

  await queryRunner.query(
    `INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", "isActive", "isEmailVerified")
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING`,
    ["a0000000-0000-0000-0000-000000000002", "compliance@johar.io", passwordHash, "Compliance", "Officer", true, true]
  );

  await queryRunner.query(
    `INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", "isActive", "isEmailVerified")
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING`,
    ["a0000000-0000-0000-0000-000000000003", "lab@johar.io", passwordHash, "Lab", "Manager", true, true]
  );

  await queryRunner.query(
    `INSERT INTO organizations (id, name, "registrationNumber", country, status)
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT ("registrationNumber") DO NOTHING`,
    ["b0000000-0000-0000-0000-000000000001", "JOHAR Platform", "JOHAR-001", "AE", "ACTIVE"]
  );

  await queryRunner.query(
    `INSERT INTO laboratories (id, name, "registrationNumber", country, status, accreditations)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT ("registrationNumber") DO NOTHING`,
    ["c0000000-0000-0000-0000-000000000001", "Dubai Central Lab", "DCL-001", "AE", "ACTIVE", "{ISO17025,LBMA}"]
  );

  await queryRunner.query(
    `INSERT INTO laboratories (id, name, "registrationNumber", country, status, accreditations)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT ("registrationNumber") DO NOTHING`,
    ["c0000000-0000-0000-0000-000000000002", "GIA Dubai", "GIA-DXB", "AE", "ACTIVE", "{GIA}"]
  );

  const permissions = [
    ["users:read", "users", "read"],
    ["users:write", "users", "write"],
    ["users:delete", "users", "delete"],
    ["organizations:read", "organizations", "read"],
    ["organizations:write", "organizations", "write"],
    ["organizations:delete", "organizations", "delete"],
    ["assets:read", "assets", "read"],
    ["assets:write", "assets", "write"],
    ["assets:delete", "assets", "delete"],
    ["assets:verify", "assets", "verify"],
    ["listings:read", "listings", "read"],
    ["listings:write", "listings", "write"],
    ["listings:delete", "listings", "delete"],
    ["offers:read", "offers", "read"],
    ["offers:write", "offers", "write"],
    ["transactions:read", "transactions", "read"],
    ["transactions:write", "transactions", "write"],
    ["invoices:read", "invoices", "read"],
    ["invoices:write", "invoices", "write"],
    ["payments:read", "payments", "read"],
    ["payments:write", "payments", "write"],
    ["kyc:read", "kyc", "read"],
    ["kyc:write", "kyc", "write"],
    ["kyc:approve", "kyc", "approve"],
    ["labs:read", "labs", "read"],
    ["labs:write", "labs", "write"],
    ["labs:approve", "labs", "approve"],
    ["compliance:read", "compliance", "read"],
    ["compliance:write", "compliance", "write"],
    ["compliance:approve", "compliance", "approve"],
    ["logistics:read", "logistics", "read"],
    ["logistics:write", "logistics", "write"],
    ["blockchain:read", "blockchain", "read"],
    ["blockchain:write", "blockchain", "write"],
    ["audit:read", "audit", "read"],
    ["notifications:read", "notifications", "read"],
    ["notifications:write", "notifications", "write"],
    ["settings:read", "settings", "read"],
    ["settings:write", "settings", "write"],
    ["reports:read", "reports", "read"],
    ["reports:write", "reports", "write"],
  ];

  for (const [name, resource, action] of permissions) {
    await queryRunner.query(
      `INSERT INTO permissions (name, resource, action) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
      [name, resource, action]
    );
  }

  const roles = [
    ["SUPER_ADMIN", "Platform super administrator", true],
    ["PLATFORM_ADMIN", "Platform administrator", true],
    ["ORG_OWNER", "Organization owner", false],
    ["ORG_ADMIN", "Organization administrator", false],
    ["SELLER", "Seller on marketplace", false],
    ["BUYER", "Buyer on marketplace", false],
    ["LAB_MANAGER", "Laboratory manager", false],
    ["LAB_TECHNICIAN", "Laboratory technician", false],
    ["COMPLIANCE_OFFICER", "Compliance officer", false],
    ["FINANCE_MANAGER", "Finance manager", false],
    ["LOGISTICS_MANAGER", "Logistics manager", false],
    ["AUDITOR", "Audit viewer", false],
    ["WAREHOUSE_MANAGER", "Warehouse manager", false],
  ];

  for (const [name, description, isSystem] of roles) {
    await queryRunner.query(
      `INSERT INTO roles (name, description, "isSystem") VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
      [name, description, isSystem]
    );
  }

  const superAdminRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'SUPER_ADMIN'`);
  if (superAdminRole[0]) {
    await queryRunner.query(
      `INSERT INTO role_permissions ("roleId", "permissionId")
       SELECT $1::uuid, id FROM permissions
       ON CONFLICT ("roleId", "permissionId") DO NOTHING`,
      [superAdminRole[0].id]
    );

    await queryRunner.query(
      `INSERT INTO user_roles ("userId", "roleId", "organizationId")
       SELECT $1::uuid, $2::uuid, $3::uuid
       WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE "userId" = $1::uuid AND "roleId" = $2::uuid)`,
      ["a0000000-0000-0000-0000-000000000001", superAdminRole[0].id, "b0000000-0000-0000-0000-000000000001"]
    );
  }

  const complianceRoleId = await queryRunner.query(`SELECT id FROM roles WHERE name = 'COMPLIANCE_OFFICER'`);
  if (complianceRoleId[0]) {
    await queryRunner.query(
      `INSERT INTO user_roles ("userId", "roleId", "organizationId")
       SELECT $1::uuid, $2::uuid, $3::uuid
       WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE "userId" = $1::uuid AND "roleId" = $2::uuid)`,
      ["a0000000-0000-0000-0000-000000000002", complianceRoleId[0].id, "b0000000-0000-0000-0000-000000000001"]
    );
  }

  const labManagerRoleId = await queryRunner.query(`SELECT id FROM roles WHERE name = 'LAB_MANAGER'`);
  if (labManagerRoleId[0]) {
    await queryRunner.query(
      `INSERT INTO user_roles ("userId", "roleId", "organizationId")
       SELECT $1::uuid, $2::uuid, $3::uuid
       WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE "userId" = $1::uuid AND "roleId" = $2::uuid)`,
      ["a0000000-0000-0000-0000-000000000003", labManagerRoleId[0].id, "b0000000-0000-0000-0000-000000000001"]
    );
  }

  console.log("Seed complete");
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
