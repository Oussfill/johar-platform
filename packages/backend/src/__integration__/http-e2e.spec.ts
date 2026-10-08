process.env.NODE_ENV = "integration";
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "integration-test-jwt-secret-at-least-32-chars";
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;
process.env.EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "mock";
process.env.SMS_PROVIDER = process.env.SMS_PROVIDER || "mock";
process.env.STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "mock";
process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "mock";
process.env.KYC_PROVIDER = process.env.KYC_PROVIDER || "mock";
process.env.SANCTIONS_PROVIDER = process.env.SANCTIONS_PROVIDER || "mock";

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Body, Controller, Get, Module, Param, Post, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IsString } from "class-validator";
import { DataSource } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import * as path from "path";

import { JwtAuthGuard } from "../modules/auth/jwt-auth.guard";
import { TenantIsolated } from "../common/guards/abac.guard";
import { RequireRoles } from "../common/guards/rbac.guard";
import { Public } from "../common/decorators/public.decorator";

class EchoDto {
  @IsString()
  message!: string;
}

@Controller("__e2e")
@TenantIsolated()
class E2eController {
  @Public()
  @Get("public")
  publicRoute() {
    return { ok: "public" };
  }

  @UseGuards(JwtAuthGuard)
  @Get("protected")
  protectedRoute() {
    return { ok: "protected" };
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin")
  @RequireRoles("AUDITOR")
  adminRoute() {
    return { ok: "admin" };
  }

  @UseGuards(JwtAuthGuard)
  @Get("org/:organizationId")
  orgRoute(@Param("organizationId") organizationId: string) {
    return { organizationId };
  }

  @UseGuards(JwtAuthGuard)
  @Post("echo")
  echo(@Body() dto: EchoDto) {
    return { received: dto.message };
  }
}

@Module({ controllers: [E2eController] })
class E2eModule {}

const DATABASE_URL = process.env.DATABASE_URL;
const hasRealDb =
  !!DATABASE_URL &&
  DATABASE_URL !== "postgresql://johar:johar_secret@localhost:5432/johar_db";

const describeGate = hasRealDb ? describe : describe.skip;

describeGate("HTTP e2e (guards, tenant isolation, RBAC)", () => {
  let app: INestApplication;
  let testingModule: TestingModule;
  let http: any;

  const birth = `${Date.now()}`;
  let orgA: any;
  let orgB: any;

  const tokens: Record<string, string> = {};
  const users: Record<string, any> = {};

  const ALL_ROLES = [
    "SUPER_ADMIN",
    "PLATFORM_ADMIN",
    "ORG_OWNER",
    "ORG_ADMIN",
    "BUYER",
    "SELLER",
    "AUDITOR",
    "LOGISTICS_MANAGER",
  ];
  const ROLE_IDS: Record<string, string> = {};

  async function registerUser(email: string, alias: string): Promise<any> {
    const authService = await import("../modules/auth/auth.service").then((m) =>
      app.get(m.AuthService)
    );
    const result = await authService.register({
      email,
      password: "StrongP@ss1",
      firstName: alias,
      lastName: "E2E",
    });
    const { User } = await import("../modules/users/user.entity");
    users[alias] = await app.get(getRepositoryToken(User)).findOneBy({ id: result.id });
    return users[alias];
  }

  async function loginAs(alias: string): Promise<string> {
    const authService = await import("../modules/auth/auth.service").then((m) =>
      app.get(m.AuthService)
    );
    const login = await authService.login(users[alias], "127.0.0.1", "e2e");
    tokens[alias] = login.accessToken;
    return login.accessToken;
  }

  function auth(alias: string) {
    return { Authorization: `Bearer ${tokens[alias]}` };
  }

  beforeAll(async () => {
    const resetDs = new DataSource({
      type: "postgres",
      url: DATABASE_URL,
      migrations: [path.join(__dirname, "..", "database", "migrations", "*-*.ts")],
      synchronize: false,
    });
    await resetDs.initialize();
    await resetDs.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    await resetDs.runMigrations();
    await resetDs.destroy();

    const { AppModule } = await import("../app.module");

    testingModule = await Test.createTestingModule({
      imports: [AppModule, E2eModule],
    }).compile();

    app = testingModule.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );
    await app.init();
    http = app.getHttpServer();

    const { Role } = await import("../modules/rbac/role.entity");
    const roleRepo = app.get(getRepositoryToken(Role));
    const organizationsService = await import(
      "../modules/organizations/organizations.service"
    ).then((m) => app.get(m.OrganizationsService));
    const rbacService = await import("../modules/rbac/rbac.service").then((m) =>
      app.get(m.RbacService)
    );

    for (const name of ALL_ROLES) {
      const role = await roleRepo.save(
        roleRepo.create({ name, description: name, isSystem: true, isActive: true })
      );
      ROLE_IDS[name] = role.id;
    }

    orgA = await organizationsService.create({
      name: `E2E Org A ${birth}`,
      registrationNumber: `E2E-A-${birth}`,
      type: "COMPANY",
    });
    orgB = await organizationsService.create({
      name: `E2E Org B ${birth}`,
      registrationNumber: `E2E-B-${birth}`,
      type: "COMPANY",
    });

    const uSuper = await registerUser(`e2e.super.${birth}@test.io`, "super");
    const uBuyer = await registerUser(`e2e.buyer.${birth}@test.io`, "buyer");
    const uAuditor = await registerUser(`e2e.auditor.${birth}@test.io`, "auditor");
    const uOwner = await registerUser(`e2e.owner.${birth}@test.io`, "owner");

    await organizationsService.addMember(orgA.id, uOwner.id, "ORG_OWNER");
    await organizationsService.addMember(orgB.id, uBuyer.id, "BUYER");
    await organizationsService.addMember(orgA.id, uAuditor.id, "AUDITOR");

    await rbacService.assignRoleToUser(uSuper.id, ROLE_IDS.SUPER_ADMIN, {
      id: "seed",
      roles: ["SUPER_ADMIN"],
    });
    await rbacService.assignRoleToUser(uBuyer.id, ROLE_IDS.BUYER, {
      id: "seed",
      roles: ["SUPER_ADMIN"],
    }, orgB.id);
    await rbacService.assignRoleToUser(uAuditor.id, ROLE_IDS.AUDITOR, {
      id: "seed",
      roles: ["SUPER_ADMIN"],
    }, orgA.id);
    await rbacService.assignRoleToUser(uOwner.id, ROLE_IDS.ORG_OWNER, {
      id: "seed",
      roles: ["SUPER_ADMIN"],
    }, orgA.id);

    await loginAs("super");
    await loginAs("buyer");
    await loginAs("auditor");
    await loginAs("owner");
  }, 120000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe("Public routes", () => {
    it("serves the public health liveness probe without a token", async () => {
      const res = await request(http).get("/api/v1/health/live");
      expect(res.status).toBe(200);
      expect(res.body?.data?.status ?? res.body?.status).toBe("alive");
    });

    it("serves a @Public controller route without a token", async () => {
      const res = await request(http).get("/api/v1/__e2e/public");
      expect(res.status).toBe(200);
    });
  });

  describe("Authentication (AbacGuard requires a tenant)", () => {
    it("rejects a protected route with no token (401)", async () => {
      const res = await request(http).get("/api/v1/__e2e/protected");
      expect(res.status).toBe(401);
    });

    it("rejects a protected route with a malformed token (401)", async () => {
      const res = await request(http)
        .get("/api/v1/__e2e/protected")
        .set("Authorization", "Bearer not-a-real-token");
      expect(res.status).toBe(401);
    });

    it("(security regression) rejects an expired token (401)", async () => {
      const jwt = new JwtService({ secret: process.env.JWT_SECRET });
      const expired = jwt.sign(
        {
          sub: users.buyer.id,
          email: users.buyer.email,
          organizationId: orgB.id,
          roles: ["BUYER"],
          permissions: [],
          sessionId: "expired-session",
        },
        { expiresIn: "1ms" }
      );
      await new Promise((r) => setTimeout(r, 25));
      const res = await request(http)
        .get("/api/v1/__e2e/protected")
        .set("Authorization", `Bearer ${expired}`);
      expect(res.status).toBe(401);
    });

    it("(security regression) rejects a token signed with the wrong secret (401)", async () => {
      const jwt = new JwtService({ secret: "a-completely-different-secret-key-32chars" });
      const forged = jwt.sign({
        sub: users.buyer.id,
        email: users.buyer.email,
        organizationId: orgB.id,
        roles: ["SUPER_ADMIN"],
        permissions: [],
        sessionId: "forged",
      });
      const res = await request(http)
        .get("/api/v1/__e2e/admin")
        .set("Authorization", `Bearer ${forged}`);
      expect(res.status).toBe(401);
    });

    it("allows a protected route with a valid token (200)", async () => {
      const res = await request(http)
        .get("/api/v1/__e2e/protected")
        .set(auth("buyer"));
      expect(res.status).toBe(200);
    });
  });

  describe("RBAC (RbacGuard @RequireRoles)", () => {
    it("denies a role-gated route to a user lacking the role (403)", async () => {
      const res = await request(http)
        .get("/api/v1/__e2e/admin")
        .set(auth("buyer"));
      expect(res.status).toBe(403);
    });

    it("allows a role-gated route to a user holding the role (200)", async () => {
      const res = await request(http)
        .get("/api/v1/__e2e/admin")
        .set(auth("auditor"));
      expect(res.status).toBe(200);
    });

    it("lets SUPER_ADMIN bypass role gates (200)", async () => {
      const res = await request(http)
        .get("/api/v1/__e2e/admin")
        .set(auth("super"));
      expect(res.status).toBe(200);
    });
  });

  describe("Tenant isolation (@TenantIsolated)", () => {
    it("allows a tenant to access its own organization resource (200)", async () => {
      const res = await request(http)
        .get(`/api/v1/__e2e/org/${orgA.id}`)
        .set(auth("owner"));
      expect(res.status).toBe(200);
    });

    it("blocks cross-tenant access to another organization (403)", async () => {
      const res = await request(http)
        .get(`/api/v1/__e2e/org/${orgB.id}`)
        .set(auth("owner"));
      expect(res.status).toBe(403);
    });

    it("lets SUPER_ADMIN cross tenants (200)", async () => {
      const res = await request(http)
        .get(`/api/v1/__e2e/org/${orgB.id}`)
        .set(auth("super"));
      expect(res.status).toBe(200);
    });
  });

  describe("Metrics endpoint protection", () => {
    it("(security regression) rejects /metrics without a token (401)", async () => {
      const res = await request(http).get("/api/v1/metrics");
      expect(res.status).toBe(401);
    });

    it("(security regression) denies /metrics to a non-admin (403)", async () => {
      const res = await request(http).get("/api/v1/metrics").set(auth("owner"));
      expect(res.status).toBe(403);
    });

    it("allows /metrics to SUPER_ADMIN (200)", async () => {
      const res = await request(http).get("/api/v1/metrics").set(auth("super"));
      expect(res.status).toBe(200);
    });
  });

  describe("Real controller wiring", () => {
    it("rejects GET /users without a token (401)", async () => {
      const res = await request(http).get("/api/v1/users");
      expect(res.status).toBe(401);
    });

    it("denies GET /users to a non-admin (403)", async () => {
      const res = await request(http).get("/api/v1/users").set(auth("buyer"));
      expect(res.status).toBe(403);
    });

    it("allows GET /users to SUPER_ADMIN (200)", async () => {
      const res = await request(http).get("/api/v1/users").set(auth("super"));
      expect(res.status).toBe(200);
    });

    it("allows an authenticated tenant user to list assets (200)", async () => {
      const res = await request(http).get("/api/v1/assets").set(auth("owner"));
      expect(res.status).toBe(200);
    });
  });

  describe("Input hardening (ValidationPipe)", () => {
    it("(security regression) rejects unknown body properties (mass assignment)", async () => {
      const res = await request(http)
        .post("/api/v1/__e2e/echo")
        .set(auth("owner"))
        .send({ message: "hi", isAdmin: true, roles: ["SUPER_ADMIN"] });
      expect(res.status).toBe(400);
    });

    it("accepts a well-formed body (201)", async () => {
      const res = await request(http)
        .post("/api/v1/__e2e/echo")
        .set(auth("owner"))
        .send({ message: "hi" });
      expect(res.status).toBe(201);
      expect(res.body.received).toBe("hi");
    });

    it("(security regression) blocks tenant spoofing via request body", async () => {
      const res = await request(http)
        .post("/api/v1/__e2e/echo")
        .set(auth("owner"))
        .send({ message: "hi", organizationId: orgB.id });
      expect(res.status).toBe(403);
    });
  });
});
