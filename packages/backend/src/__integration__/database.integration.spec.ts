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
import { INestApplication, BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { authenticator } from "otplib";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL;

const hasRealDb = !!DATABASE_URL && DATABASE_URL !== "postgresql://johar:johar_secret@localhost:5432/johar_db";

const describeGate = hasRealDb ? describe : describe.skip;

describeGate("Real PostgreSQL integration", () => {
  let app: INestApplication;
  let module: TestingModule;

  let authService: any;
  let organizationsService: any;
  let assetsService: any;
  let assetsController: any;
  let marketplaceService: any;
  let marketplaceController: any;
  let financeController: any;
  let financeService: any;
  let passwordService: any;
  let passwordController: any;
  let complianceService: any;
  let complianceController: any;
  let labsService: any;
  let labsController: any;
  let rbacController: any;
  let rbacService: any;
  let auditController: any;
  let auditService: any;
  let erpController: any;
  let hrController: any;
  let custodyController: any;
  let contentController: any;
  let trustController: any;
  let userRepo: any;
  let roleRepo: any;
  let memberRepo: any;
  let mfaRepo: any;

  const birth = `${Date.now()}`;

  const owners: Record<string, any> = {};
  const actors: Record<string, any> = {};
  let orgA: any;
  let orgB: any;
  let assetA: any;
  let listingA: any;
  let offerA: any;
  let txA: any;
  let invoice: any;
  let paymentA: any;
  let labA: any;

  async function actorFor(alias: string, user: any, organizationId?: string) {
    const login = await authService.login(user, "127.0.0.1", "integration-test");
    actors[alias] = { ...login.user, organizationId };
    return actors[alias];
  }

  const ALL_ROLES = [
    "SUPER_ADMIN",
    "PLATFORM_ADMIN",
    "ORG_OWNER",
    "ORG_ADMIN",
    "BUYER",
    "SELLER",
    "FINANCE_OFFICER",
    "AUDITOR",
    "KYC_OFFICER",
    "KYC_ANALYST",
    "COMPLIANCE_OFFICER",
    "LAB_MANAGER",
    "LAB_TECHNICIAN",
    "HR_MANAGER",
    "CUSTODY_MANAGER",
    "SUPPLIER",
    "CRM_OFFICER",
    "PURCHASER",
    "SALES_OFFICER",
    "CONTENT_MANAGER",
    "TRUST_ADMIN",
  ];

  const ROLE_IDS: Record<string, string> = {};

  async function registerUser(email: string, alias: string) {
    const result = await authService.register({
      email,
      password: "StrongP@ss1",
      firstName: alias,
      lastName: "Test",
    });
    const user = await userRepo.findOneBy({ id: result.id });
    owners[alias] = user;
    return user;
  }

  async function assignOrgRole(userId: string, roleName: string, orgId: string | undefined) {
    await rbacService.assignRoleToUser(
      userId,
      ROLE_IDS[roleName],
      { id: "seed", roles: ["SUPER_ADMIN"] },
      orgId
    );
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

    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();

    authService = await import("../modules/auth/auth.service").then((m) => app.get(m.AuthService));
    organizationsService = await import("../modules/organizations/organizations.service").then((m) => app.get(m.OrganizationsService));
    assetsService = await import("../modules/assets/assets.service").then((m) => app.get(m.AssetsService));
    assetsController = await import("../modules/assets/assets.controller").then((m) => app.get(m.AssetsController));
    marketplaceService = await import("../modules/marketplace/marketplace.service").then((m) => app.get(m.MarketplaceService));
    marketplaceController = await import("../modules/marketplace/marketplace.controller").then((m) => app.get(m.MarketplaceController));
    financeController = await import("../modules/finance/finance.controller").then((m) => app.get(m.FinanceController));
    financeService = await import("../modules/finance/finance.service").then((m) => app.get(m.FinanceService));
    passwordService = await import("../modules/auth/password.service").then((m) => app.get(m.PasswordService));
    passwordController = await import("../modules/auth/password.controller").then((m) => app.get(m.PasswordController));
    complianceService = await import("../modules/compliance/compliance.service").then((m) => app.get(m.ComplianceService));
    complianceController = await import("../modules/compliance/compliance.controller").then((m) => app.get(m.ComplianceController));
    labsService = await import("../modules/labs/labs.service").then((m) => app.get(m.LabsService));
    labsController = await import("../modules/labs/labs.controller").then((m) => app.get(m.LabsController));
    rbacController = await import("../modules/rbac/rbac.controller").then((m) => app.get(m.RbacController));
    rbacService = await import("../modules/rbac/rbac.service").then((m) => app.get(m.RbacService));
    auditController = await import("../modules/audit/audit.controller").then((m) => app.get(m.AuditController));
    auditService = await import("../modules/audit/audit.service").then((m) => app.get(m.AuditService));
    erpController = await import("../modules/erp/erp.controller").then((m) => app.get(m.ErpController));
    hrController = await import("../modules/hr/hr.controller").then((m) => app.get(m.HrController));
    custodyController = await import("../modules/custody/custody.controller").then((m) => app.get(m.CustodyController));
    contentController = await import("../modules/content/content.controller").then((m) => app.get(m.ContentController));
    trustController = await import("../modules/trust/trust.controller").then((m) => app.get(m.TrustController));

    const { User } = await import("../modules/users/user.entity");
    const { Role } = await import("../modules/rbac/role.entity");
    const { OrganizationMember } = await import("../modules/organizations/organization-member.entity");
    const { MfaDevice } = await import("../modules/auth/auth-entities");

    userRepo = app.get(getRepositoryToken(User));
    roleRepo = app.get(getRepositoryToken(Role));
    memberRepo = app.get(getRepositoryToken(OrganizationMember));
    mfaRepo = app.get(getRepositoryToken(MfaDevice));

    for (const name of ALL_ROLES) {
      const role = await roleRepo.save(roleRepo.create({ name, description: name, isSystem: true, isActive: true }));
      ROLE_IDS[name] = role.id;
    }

    orgA = await organizationsService.create({ name: `Org A ${birth}`, registrationNumber: `REG-A-${birth}`, type: "COMPANY" });
    orgB = await organizationsService.create({ name: `Org B ${birth}`, registrationNumber: `REG-B-${birth}`, type: "COMPANY" });

    const uOwner = await registerUser(`owner.${birth}@test.io`, "ownerA");
    const uBuyer = await registerUser(`buyer.${birth}@test.io`, "buyerB");
    const uOutsider = await registerUser(`outsider.${birth}@test.io`, "outsiderC");
    const uFinance = await registerUser(`finance.${birth}@test.io`, "financeOfficer");
    const uKyc = await registerUser(`kyc.${birth}@test.io`, "kycOfficer");
    const uPlat = await registerUser(`plat.${birth}@test.io`, "platAdmin");
    const uSuper = await registerUser(`super.${birth}@test.io`, "superAdmin");
    const uLabA = await registerUser(`lab.a.${birth}@test.io`, "labStaffA");
    const uLabB = await registerUser(`lab.b.${birth}@test.io`, "labStaffB");
    const uOpsA = await registerUser(`ops.a.${birth}@test.io`, "opsA");
    const uCustB = await registerUser(`cust.b.${birth}@test.io`, "custB");
    const uContent = await registerUser(`content.${birth}@test.io`, "contentAdmin");
    const uTrust = await registerUser(`trust.${birth}@test.io`, "trustAdmin");

    await organizationsService.addMember(orgA.id, uOwner.id, "ORG_OWNER");
    await organizationsService.addMember(orgB.id, uBuyer.id, "BUYER");
    await organizationsService.addMember(orgB.id, uOutsider.id, "BUYER");
    await organizationsService.addMember(orgA.id, uFinance.id, "FINANCE_OFFICER");
    await organizationsService.addMember(orgA.id, uKyc.id, "KYC_OFFICER");
    await organizationsService.addMember(orgA.id, uLabA.id, "LAB_MANAGER");
    await organizationsService.addMember(orgB.id, uLabB.id, "LAB_MANAGER");
    await organizationsService.addMember(orgA.id, uOpsA.id, "OPS_MANAGER");
    await organizationsService.addMember(orgB.id, uCustB.id, "CUSTODY_MANAGER");

    await assignOrgRole(uOwner.id, "ORG_OWNER", orgA.id);
    await assignOrgRole(uBuyer.id, "BUYER", orgB.id);
    await assignOrgRole(uOutsider.id, "BUYER", orgB.id);
    await assignOrgRole(uFinance.id, "FINANCE_OFFICER", orgA.id);
    await assignOrgRole(uKyc.id, "KYC_OFFICER", orgA.id);
    await assignOrgRole(uPlat.id, "PLATFORM_ADMIN", undefined);
    await assignOrgRole(uSuper.id, "SUPER_ADMIN", undefined);
    await assignOrgRole(uLabA.id, "LAB_MANAGER", orgA.id);
    await assignOrgRole(uLabB.id, "LAB_MANAGER", orgB.id);
    await assignOrgRole(uOpsA.id, "HR_MANAGER", orgA.id);
    await assignOrgRole(uOpsA.id, "CUSTODY_MANAGER", orgA.id);
    await assignOrgRole(uOpsA.id, "SUPPLIER", orgA.id);
    await assignOrgRole(uOpsA.id, "CRM_OFFICER", orgA.id);
    await assignOrgRole(uOpsA.id, "PURCHASER", orgA.id);
    await assignOrgRole(uOpsA.id, "SALES_OFFICER", orgA.id);
    await assignOrgRole(uCustB.id, "CUSTODY_MANAGER", orgB.id);
    await assignOrgRole(uContent.id, "CONTENT_MANAGER", undefined);
    await assignOrgRole(uTrust.id, "TRUST_ADMIN", undefined);

    await actorFor("ownerA", uOwner, orgA.id);
    await actorFor("buyerB", uBuyer, orgB.id);
    await actorFor("outsiderC", uOutsider, orgB.id);
    await actorFor("financeOfficer", uFinance, orgA.id);
    await actorFor("kycOfficer", uKyc, orgA.id);
    await actorFor("platAdmin", uPlat, undefined);
    await actorFor("superAdmin", uSuper, undefined);
    await actorFor("labStaffA", uLabA, orgA.id);
    await actorFor("labStaffB", uLabB, orgB.id);
    await actorFor("opsA", uOpsA, orgA.id);
    await actorFor("custB", uCustB, orgB.id);
    await actorFor("contentAdmin", uContent, undefined);
    await actorFor("trustAdmin", uTrust, undefined);

    assetA = await assetsService.create(
      { type: "GOLD", subType: "BAR", weight: 100, weightUnit: "g", purity: "999.9", origin: "Jordan" },
      uOwner.id,
      orgA.id
    );

    labA = await labsService.createLab({
      name: `Lab ${birth}`,
      registrationNumber: `LAB-${birth}`,
      country: "AE",
      status: "ACTIVE",
    });
  }, 120000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe("Registration and persistence", () => {
    it("persists a user with a hashed password", async () => {
      const email = `dup.${birth}@test.io`;
      await authService.register({ email, password: "StrongP@ss1", firstName: "Dup", lastName: "Test" });
      const row = await userRepo.findOneBy({ email });
      expect(row).toBeTruthy();
      expect(row.passwordHash).not.toBe("StrongP@ss1");
      expect(row.passwordHash.startsWith("$2")).toBe(true);
    });

    it("rejects duplicate registration", async () => {
      const email = `dup2.${birth}@test.io`;
      await authService.register({ email, password: "StrongP@ss1", firstName: "D", lastName: "T" });
      await expect(
        authService.register({ email, password: "StrongP@ss1", firstName: "D", lastName: "T" })
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("MFA device IDOR", () => {
    let device: any;
    let secret: string;

    it("registers a TOTP device for ownerA", async () => {
      secret = authenticator.generateSecret();
      device = await passwordService.registerMfaDevice(owners.ownerA.id, "TOTP", "mobile", secret);
      expect(device.userId).toBe(owners.ownerA.id);
    });

    it("verifies with the owner's own valid code", async () => {
      const code = authenticator.generate(secret);
      const res = await passwordController.verifyMfa(owners.ownerA.id, { deviceId: device.id, code });
      expect(res.verified).toBe(true);
    });

    it("denies cross-user verification even with a valid code (IDOR blocked)", async () => {
      const code = authenticator.generate(secret);
      const res = await passwordController.verifyMfa(owners.outsiderC.id, { deviceId: device.id, code });
      expect(res.verified).toBe(false);
    });
  });

  describe("Asset org scoping", () => {
    it("owner can read asset by JOHAR ID", async () => {
      const result = await assetsController.findByJoharId(assetA.joharId, actors.ownerA);
      expect(result.id).toBe(assetA.id);
    });

    it("outsider from another organization is forbidden", async () => {
      await expect(assetsController.findByJoharId(assetA.joharId, actors.outsiderC)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(assetsController.findOne(assetA.id, actors.outsiderC)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("only owner can create a digital passport", async () => {
      const passport = await assetsController.createPassport(assetA.id, actors.ownerA);
      expect(passport.assetId).toBe(assetA.id);
      await expect(assetsController.createPassport(assetA.id, actors.outsiderC)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("Marketplace access control", () => {
    it("owner can list the asset", async () => {
      listingA = await marketplaceController.createListing(
        { assetId: assetA.id, price: 50000, currency: "USD", listingType: "FIXED" },
        actors.ownerA
      );
      expect(listingA.sellerId).toBe(owners.ownerA.id);
    });

    it("outsider is forbidden from listing an asset they do not own", async () => {
      await expect(
        marketplaceController.createListing({ assetId: assetA.id, price: 100, currency: "USD" }, actors.outsiderC)
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("buyer can make an offer", async () => {
      offerA = await marketplaceService.makeOffer(listingA.id, owners.buyerB.id, 45000, "best offer");
      expect(offerA.status).toBe("PENDING");
    });

    it("seller cannot offer on own listing", async () => {
      await expect(marketplaceService.makeOffer(listingA.id, owners.ownerA.id, 1)).rejects.toThrow();
    });

    it("(security regression) duplicate pending offer is rejected", async () => {
      await expect(
        marketplaceService.makeOffer(listingA.id, owners.buyerB.id, 47000)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("(security regression) non-seller outsider cannot accept an offer", async () => {
      await expect(marketplaceController.acceptOffer(offerA.id, actors.outsiderC)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it("(security regression) buyer cannot accept an offer either", async () => {
      await expect(marketplaceController.acceptOffer(offerA.id, actors.buyerB)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it("accepting the offer creates a transaction", async () => {
      txA = await marketplaceController.acceptOffer(offerA.id, actors.ownerA);
      expect(txA.buyerId).toBe(owners.buyerB.id);
      expect(txA.assetId).toBe(assetA.id);
    });

    it("(security regression) illegal transaction status transition is rejected", async () => {
      await expect(marketplaceService.updateTransactionStatus(txA.id, "DELIVERED")).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it("participants can read the transaction, outsiders cannot", async () => {
      const ok = await marketplaceController.getTransaction(txA.id, actors.buyerB);
      expect(ok.id).toBe(txA.id);
      await expect(marketplaceController.getTransaction(txA.id, actors.outsiderC)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("Finance access control", () => {
    it("party to the transaction can create an invoice", async () => {
      invoice = await financeController.createInvoice(
        {
          transactionId: txA.id,
          recipientId: owners.buyerB.id,
          subtotal: 45000,
          tax: 0,
          total: 45000,
          currency: "USD",
        } as any,
        actors.ownerA
      );
      expect(invoice.issuerId).toBe(owners.ownerA.id);
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it("non-participant cannot create an invoice on the same transaction", async () => {
      await expect(
        financeController.createInvoice(
          { transactionId: txA.id, recipientId: owners.ownerA.id, subtotal: 45000, total: 45000 } as any,
          actors.outsiderC
        )
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("participant records a payment", async () => {
      paymentA = await financeController.recordPayment(
        invoice.id,
        { amount: 45000, paymentMethod: "BANK_TRANSFER", currency: "USD" } as any,
        actors.ownerA
      );
      expect(paymentA.invoiceId).toBe(invoice.id);
      expect(paymentA.paymentNumber).toMatch(/^PAY-\d{4}-\d{4}$/);
    });

    it("same-org finance officer confirms payment and marks invoice PAID", async () => {
      const confirmed = await financeController.confirmPayment(paymentA.id, actors.financeOfficer);
      expect(confirmed.status).toBe("COMPLETED");
      const after = await financeService.getInvoice(invoice.id);
      expect(after.status).toBe("PAID");
    });

    it("non-finance outsider cannot confirm a cross-tenant payment", async () => {
      const payment = await financeController.recordPayment(
        invoice.id,
        { amount: 100, paymentMethod: "BANK_TRANSFER", currency: "USD" } as any,
        actors.ownerA
      );
      await expect(financeController.confirmPayment(payment.id, actors.outsiderC)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("Labs access control", () => {
    it("owner can submit an assay request", async () => {
      const request = await labsController.submitRequest(
        { assetId: assetA.id, laboratoryId: labA.id, assayType: "XRF", notes: "IT" },
        actors.ownerA
      );
      expect(request.assetId).toBe(assetA.id);
    });

    it("requester can read the request, outsider cannot", async () => {
      const request = await labsService.submitAssayRequest(
        { assetId: assetA.id, laboratoryId: labA.id, assayType: "FIRE" },
        owners.ownerA.id,
        actors.ownerA
      );
      const ok = await labsController.getRequest(request.id, actors.ownerA);
      expect(ok.id).toBe(request.id);
      await expect(labsController.getRequest(request.id, actors.outsiderC)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("results for an asset are scoped", async () => {
      await expect(labsController.getResultsByAsset(assetA.id, actors.outsiderC)).rejects.toBeInstanceOf(ForbiddenException);
      const res = await labsController.getResultsByAsset(assetA.id, actors.ownerA);
      expect(Array.isArray(res)).toBe(true);
    });

    it("(security regression) lab staff from another organization cannot issue results", async () => {
      const request = await labsService.submitAssayRequest(
        { assetId: assetA.id, laboratoryId: labA.id, assayType: "FIRE" },
        owners.ownerA.id,
        actors.ownerA
      );
      await expect(
        labsController.issueResult(request.id, { result: { purity: "999" } } as any, actors.labStaffB)
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("lab staff in the asset's organization can issue and approve results", async () => {
      const request = await labsService.submitAssayRequest(
        { assetId: assetA.id, laboratoryId: labA.id, assayType: "XRF" },
        owners.ownerA.id,
        actors.ownerA
      );
      const result = await labsController.issueResult(
        request.id,
        { result: { purity: "999.9" } } as any,
        actors.labStaffA
      );
      expect(result.performedBy).toBe(owners.labStaffA.id);

      await expect(
        labsController.approveResult(result.id, actors.labStaffB)
      ).rejects.toBeInstanceOf(ForbiddenException);

      const approved = await labsController.approveResult(result.id, actors.labStaffA);
      expect(approved.status).toBe("FINAL");
      expect(approved.approvedBy).toBe(owners.labStaffA.id);
    });
  });

  describe("Compliance access control", () => {
    let profile: any;

    it("user can submit KYC for their organization", async () => {
      profile = await complianceController.submitKYC(
        { organizationId: orgA.id, level: "L1" },
        owners.ownerA.id
      );
      expect(profile.userId).toBe(owners.ownerA.id);
    });

    it("profile owner can read it", async () => {
      const result = await complianceController.getKYC(profile.id, actors.ownerA);
      expect(result.id).toBe(profile.id);
    });

    it("outsider in another org is forbidden", async () => {
      await expect(complianceController.getKYC(profile.id, actors.outsiderC)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("same-org KYC officer can read it", async () => {
      const result = await complianceController.getKYC(profile.id, actors.kycOfficer);
      expect(result.id).toBe(profile.id);
    });

    it("same-org KYC officer can review it", async () => {
      const review = await complianceController.reviewKYC(profile.id, { status: "APPROVED" } as any, actors.kycOfficer);
      expect(review.status).toBe("APPROVED");
    });

    it("outsider cannot submit KYC documents for another organization's profile", async () => {
      await expect(
        complianceController.submitDocument(
          profile.id,
          { documentType: "NATIONAL_ID", fileUrl: "https://storage.example/doc.pdf" } as any,
          actors.outsiderC
        )
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("Audit logs and notifications access control", () => {
    it("(security regression) a non-auditor is denied audit logs", async () => {
      await expect(auditController.getLogs("1", "50", undefined, undefined, actors.ownerA)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it("SUPER_ADMIN can read audit logs", async () => {
      const res = await auditController.getLogs("1", "50", undefined, undefined, actors.superAdmin);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it("(security regression) notifications are scoped to the recipient", async () => {
      const notif = await auditService.createNotification({
        userId: owners.ownerA.id,
        type: "SYSTEM",
        title: "Owner-only notification",
      });
      const mine = await auditController.getNotifications("false", owners.ownerA.id);
      expect(mine.some((n: any) => n.id === notif.id)).toBe(true);

      const theirs = await auditController.getNotifications("false", owners.buyerB.id);
      expect(theirs.some((n: any) => n.id === notif.id)).toBe(false);
    });

    it("(security regression) a user cannot mark another user's notification read", async () => {
      const notif = await auditService.createNotification({
        userId: owners.ownerA.id,
        type: "SYSTEM",
        title: "Do not let others mark this",
      });
      await auditController.markRead(notif.id, owners.buyerB.id);
      const stillUnread = await auditController.getNotifications("true", owners.ownerA.id);
      expect(stillUnread.some((n: any) => n.id === notif.id)).toBe(true);
    });
  });

  describe("RBAC enforcement", () => {
    it("non-super admins cannot see the SUPER_ADMIN role", async () => {
      const roles = await rbacController.findAllRoles(actors.platAdmin);
      expect(roles.some((r: any) => r.name === "SUPER_ADMIN")).toBe(false);
    });

    it("org users without platform rights cannot list permissions", async () => {
      await expect(rbacController.findAllPermissions(actors.ownerA)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("PLATFORM_ADMIN cannot assign PLATFORM_ADMIN or SUPER_ADMIN roles", async () => {
      const target = owners.buyerB.id;
      await expect(
        rbacController.assignUserRole(target, { roleId: ROLE_IDS.PLATFORM_ADMIN }, actors.platAdmin)
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        rbacController.assignUserRole(target, { roleId: ROLE_IDS.SUPER_ADMIN }, actors.platAdmin)
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("SUPER_ADMIN can assign roles", async () => {
      const result = await rbacController.assignUserRole(
        owners.buyerB.id,
        { roleId: ROLE_IDS.PLATFORM_ADMIN },
        actors.superAdmin
      );
      expect(result.userId).toBe(owners.buyerB.id);
    });
  });

  describe("ERP Phase 2 (ported from gold)", () => {
    let supplierId: string;
    let customerId: string;

    it("authenticated member can list empty suppliers", async () => {
      const suppliers = await erpController.listSuppliers(actors.opsA);
      expect(Array.isArray(suppliers)).toBe(true);
    });

    it("create supplier scoped to caller's organization", async () => {
      const supplier = await erpController.createSupplier({ name: "Refiner Co", country: "AE" }, actors.opsA);
      expect(supplier.organizationId).toBe(orgA.id);
      supplierId = supplier.id;
    });

    it("(security regression) cross-org supplier read denied", async () => {
      await expect(erpController.getSupplier(supplierId, actors.custB)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("CRM: customer + interaction + opportunity flow", async () => {
      const customer = await erpController.createCustomer({ name: "Acme Jewelry" }, actors.opsA);
      customerId = customer.id;
      const interaction = await erpController.createInteraction({ customerId, summary: "intro call" }, actors.opsA);
      expect(interaction.customerId).toBe(customerId);
      const opportunity = await erpController.createOpportunity({ customerId, title: "Bulk bars", value: 50000 }, actors.opsA);
      expect(Number(opportunity.value)).toBe(50000);
      expect(opportunity.organizationId).toBe(orgA.id);
    });

    it("procurement: purchase request submit/approve, RFQ send + offer + choose", async () => {
      const pr = await erpController.createPurchaseRequest({ description: "Gold bars" }, actors.opsA);
      expect(pr.status).toBe("DRAFT");
      await erpController.submitPurchaseRequest(pr.id, actors.opsA);
      const approved = await erpController.approvePurchaseRequest(pr.id, actors.opsA);
      expect(approved.status).toBe("APPROVED");

      const rfq = await erpController.createRfq({ title: "RFQ refining" }, actors.opsA);
      await erpController.sendRfq(rfq.id, actors.opsA);
      const offer = await erpController.submitRfqOffer(rfq.id, { supplierId, price: 100 }, actors.opsA);
      expect(offer.rfqId).toBe(rfq.id);
      const chosen = await erpController.chooseRfqOffer(rfq.id, offer.id, actors.opsA);
      expect(chosen.chosen).toBe(true);
    });

    it("(security regression) invalid status transition rejected", async () => {
      const order = await erpController.createSalesOrder({ itemDescription: "Bars", total: 1000 }, actors.opsA);
      await expect(erpController.fulfillSalesOrder(order.id, actors.opsA)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("sales: order verify/fulfill then invoice pay", async () => {
      const order = await erpController.createSalesOrder({ itemDescription: "Jewelry", total: 2500 }, actors.opsA);
      await erpController.verifySalesOrder(order.id, actors.opsA);
      await erpController.fulfillSalesOrder(order.id, actors.opsA);
      const invoice = await erpController.createSalesInvoice({ salesOrderId: order.id, amount: 2500 }, actors.opsA);
      const paid = await erpController.paySalesInvoice(invoice.id, actors.opsA);
      expect(paid.status).toBe("PAID");
      expect(paid.paidAt).toBeTruthy();
    });
  });

  describe("HR workforce (ported from gold)", () => {
    it("create worker type + worker + attendance + payroll overview", async () => {
      const wt = await hrController.createWorkerType({ name: "Assayer", baseRate: 20 }, actors.opsA);
      const worker = await hrController.createWorker({ workerTypeId: wt.id, fullName: "Ali Refiner" }, actors.opsA);
      expect(worker.organizationId).toBe(orgA.id);
      const attendance = await hrController.recordAttendance(
        { workerId: worker.id, date: "2026-09-01", hours: 8 },
        actors.opsA
      );
      expect(attendance.type).toBe("PRESENT");
      const overview = await hrController.payrollOverview(actors.opsA);
      expect(overview).toBeDefined();
    });

    it("(security regression) cross-org payroll overview is isolated", async () => {
      const overview = await hrController.payrollOverview(actors.custB);
      expect(overview.totalNet).toBe(0);
    });
  });

  describe("Custody four-eyes (ported from gold)", () => {
    let vaultA: any;
    let vaultB: any;
    let transfer: any;

    it("create org-scoped custody vaults", async () => {
      vaultA = await custodyController.createVault({ name: "Vault North" }, actors.opsA);
      vaultB = await custodyController.createVault({ name: "Vault South" }, actors.opsA);
      expect(vaultA.organizationId).toBe(orgA.id);
    });

    it("(security regression) vaults are not visible across organizations", async () => {
      const vaultBOrg = await custodyController.createVault({ name: "Vault B" }, actors.custB);
      const listA = await custodyController.listVaults(actors.opsA);
      expect(listA.some((v: any) => v.id === vaultBOrg.id)).toBe(false);
    });

    it("four-eyes: the requester cannot approve their own transfer", async () => {
      transfer = await custodyController.createTransferRequest(
      { assetId: assetA.id, fromVaultId: vaultA.id, toVaultId: vaultB.id, requiresDualAuth: false },
        actors.opsA
      );
      expect(transfer.status).toBe("PENDING");
      await expect(custodyController.approveTransfer(transfer.id, actors.opsA)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("(security regression) cross-org actor cannot approve", async () => {
      await expect(custodyController.approveTransfer(transfer.id, actors.custB)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("a different authorized actor can approve", async () => {
      const approved = await custodyController.approveTransfer(transfer.id, actors.superAdmin);
      expect(approved.status).toBe("APPROVED");
    });
  });

  describe("Content & public site (ported from gold)", () => {
    it("public article lifecycle: list/create/publish/read", async () => {
      const before = await contentController.listArticles();
      const article = await contentController.createArticle(
        { slug: "post-1", title: "Hello", content: "Body", isPublished: true },
        actors.contentAdmin
      );
      expect(article.isPublished).toBe(true);
      const after = await contentController.listArticles();
      expect(after.length).toBe(before.length + 1);
      const bySlug = await contentController.getArticle("post-1");
      expect(bySlug.slug).toBe("post-1");
    });

    it("newsletter subscribe/unsubscribe + contact inquiry", async () => {
      const sub = await contentController.subscribe({ email: "news@example.com" });
      expect(sub.status).toBe("ACTIVE");
      const unsub = await contentController.unsubscribe({ email: "news@example.com" });
      expect(unsub.unsubscribed).toBe(true);
      const msg = await contentController.submitContact({ name: "N", email: "n@example.com", message: "hi" });
      expect(msg.status).toBe("NEW");
    });
  });

  describe("Trust verifications (ported from gold)", () => {
    it("org applies a factor and trust admin approves", async () => {
      const applied = await trustController.apply({ factor: "PHYSICAL_DATA", evidence: "audited" }, actors.opsA);
      expect(applied.organizationId).toBe(orgA.id);
      const approved = await trustController.approve(orgA.id, "PHYSICAL_DATA", actors.trustAdmin);
      expect(approved.status).toBe("APPROVED");
      const status = await trustController.status(actors.opsA);
      expect(status.trustLevel).toBeGreaterThanOrEqual(1);
    });

    it("(security regression) platform role without an org cannot submit for any org", async () => {
      await expect(trustController.apply({ factor: "LAB_RESULT" }, actors.trustAdmin)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });
  });
});
