import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1694900000000 implements MigrationInterface {
  name = "InitialSchema1694900000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR UNIQUE NOT NULL,
        phone VARCHAR,
        "passwordHash" VARCHAR NOT NULL,
        "firstName" VARCHAR NOT NULL,
        "lastName" VARCHAR NOT NULL,
        language VARCHAR DEFAULT 'en',
        "isActive" BOOLEAN DEFAULT true,
        "isEmailVerified" BOOLEAN DEFAULT false,
        "isPhoneVerified" BOOLEAN DEFAULT false,
        "isMfaEnabled" BOOLEAN DEFAULT false,
        "mfaSecret" VARCHAR,
        "lastLoginAt" TIMESTAMP,
        "failedLoginAttempts" INT DEFAULT 0,
        "lockedUntil" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users("isActive");
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users("createdAt");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        "nameAr" VARCHAR,
        "registrationNumber" VARCHAR UNIQUE NOT NULL,
        "taxId" VARCHAR,
        country VARCHAR,
        city VARCHAR,
        address VARCHAR,
        phone VARCHAR,
        email VARCHAR,
        website VARCHAR,
        status VARCHAR DEFAULT 'ACTIVE',
        type VARCHAR DEFAULT 'COMPANY',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organization_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id),
        "organizationId" UUID REFERENCES organizations(id),
        role VARCHAR NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("userId", "organizationId")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id),
        "organizationId" UUID REFERENCES organizations(id),
        "refreshTokenHash" VARCHAR NOT NULL,
        "userAgent" VARCHAR,
        ip VARCHAR,
        "deviceFingerprint" VARCHAR,
        "isActive" BOOLEAN DEFAULT true,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions("userId", "isActive");
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions("expiresAt");
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions("createdAt");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS kyc_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id),
        "organizationId" UUID REFERENCES organizations(id),
        status VARCHAR DEFAULT 'PENDING',
        level VARCHAR DEFAULT 'L1',
        "reviewedBy" VARCHAR,
        "reviewedAt" TIMESTAMP,
        "rejectionReason" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS kyc_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "kycProfileId" UUID REFERENCES kyc_profiles(id),
        "documentType" VARCHAR NOT NULL,
        "fileUrl" VARCHAR NOT NULL,
        "fileHash" VARCHAR,
        status VARCHAR DEFAULT 'PENDING',
        "rejectionReason" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS compliance_checks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "entityType" VARCHAR NOT NULL,
        "entityId" VARCHAR NOT NULL,
        "checkType" VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'PENDING',
        "riskLevel" VARCHAR DEFAULT 'LOW',
        result VARCHAR,
        "providerResponse" VARCHAR,
        "performedBy" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "joharId" VARCHAR UNIQUE NOT NULL,
        type VARCHAR NOT NULL,
        "subType" VARCHAR,
        weight DECIMAL(20,8) NOT NULL,
        "weightUnit" VARCHAR DEFAULT 'g',
        purity VARCHAR,
        karat VARCHAR,
        "serialNumber" VARCHAR,
        "batchNumber" VARCHAR,
        origin VARCHAR,
        "originCountry" VARCHAR,
        "ownerId" UUID REFERENCES users(id),
        "custodianId" UUID REFERENCES users(id),
        "currentLocationId" UUID REFERENCES organizations(id),
        status VARCHAR DEFAULT 'DRAFT',
        "parentId" UUID REFERENCES assets(id),
        description VARCHAR,
        metadata JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_assets_owner_id ON assets("ownerId");
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
      CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
      CREATE INDEX IF NOT EXISTS idx_assets_location ON assets("currentLocationId");
      CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets("createdAt");

      CREATE TABLE IF NOT EXISTS asset_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "assetId" UUID REFERENCES assets(id),
        "eventType" VARCHAR NOT NULL,
        "fromState" VARCHAR,
        "toState" VARCHAR,
        "actorId" UUID REFERENCES users(id),
        "organizationId" UUID REFERENCES organizations(id),
        metadata JSONB,
        "ipAddress" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_asset_events_asset_id ON asset_events("assetId");
      CREATE INDEX IF NOT EXISTS idx_asset_events_created_at ON asset_events("createdAt");

      CREATE TABLE IF NOT EXISTS digital_passports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "assetId" UUID REFERENCES assets(id),
        version INT NOT NULL,
        "qrCodeUrl" VARCHAR,
        "nfcChipId" VARCHAR,
        "verificationToken" VARCHAR,
        "contentHash" VARCHAR,
        status VARCHAR DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_digital_passports_asset_id ON digital_passports("assetId");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS laboratories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        "nameAr" VARCHAR,
        "registrationNumber" VARCHAR UNIQUE NOT NULL,
        country VARCHAR,
        city VARCHAR,
        accreditations TEXT[],
        status VARCHAR DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assay_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "assetId" UUID REFERENCES assets(id),
        "laboratoryId" UUID REFERENCES laboratories(id),
        "requestedBy" UUID REFERENCES users(id),
        "assayType" VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'PENDING',
        "sampleCondition" VARCHAR,
        notes VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assay_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "assayRequestId" UUID REFERENCES assay_requests(id),
        "performedBy" VARCHAR,
        "reviewedBy" VARCHAR,
        "approvedBy" VARCHAR,
        result JSONB NOT NULL,
        status VARCHAR DEFAULT 'DRAFT',
        "certificateHash" VARCHAR,
        "certificateUrl" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "assetId" UUID REFERENCES assets(id),
        "sellerId" UUID REFERENCES users(id),
        price DECIMAL(20,2) NOT NULL,
        currency VARCHAR DEFAULT 'USD',
        "listingType" VARCHAR DEFAULT 'FIXED',
        status VARCHAR DEFAULT 'ACTIVE',
        description VARCHAR,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "listingId" UUID REFERENCES listings(id),
        "buyerId" UUID REFERENCES users(id),
        amount DECIMAL(20,2) NOT NULL,
        currency VARCHAR DEFAULT 'USD',
        status VARCHAR DEFAULT 'PENDING',
        message VARCHAR,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS negotiations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "offerId" UUID REFERENCES offers(id),
        round INT NOT NULL,
        "actorId" UUID REFERENCES users(id),
        price DECIMAL(20,2) NOT NULL,
        currency VARCHAR DEFAULT 'USD',
        message VARCHAR,
        status VARCHAR DEFAULT 'PENDING',
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "listingId" UUID REFERENCES listings(id),
        "buyerId" UUID REFERENCES users(id),
        "sellerId" UUID REFERENCES users(id),
        "assetId" UUID REFERENCES assets(id),
        amount DECIMAL(20,2) NOT NULL,
        currency VARCHAR DEFAULT 'USD',
        status VARCHAR DEFAULT 'INITIATED',
        "offerId" UUID REFERENCES offers(id),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoiceNumber" VARCHAR UNIQUE NOT NULL,
        "transactionId" UUID REFERENCES transactions(id),
        "issuerId" UUID REFERENCES users(id),
        "recipientId" UUID REFERENCES users(id),
        subtotal DECIMAL(20,2) NOT NULL,
        tax DECIMAL(20,2) DEFAULT 0,
        fees DECIMAL(20,2) DEFAULT 0,
        total DECIMAL(20,2) NOT NULL,
        currency VARCHAR DEFAULT 'USD',
        status VARCHAR DEFAULT 'DRAFT',
        "dueDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "paymentNumber" VARCHAR UNIQUE NOT NULL,
        "invoiceId" UUID REFERENCES invoices(id),
        "payerId" UUID REFERENCES users(id),
        amount DECIMAL(20,2) NOT NULL,
        currency VARCHAR DEFAULT 'USD',
        "paymentMethod" VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'PENDING',
        "externalTransactionId" VARCHAR,
        "providerResponse" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ledger_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "accountId" VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        amount DECIMAL(20,2) NOT NULL,
        currency VARCHAR DEFAULT 'USD',
        "referenceType" VARCHAR,
        "referenceId" VARCHAR,
        description VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        "nameAr" VARCHAR,
        "organizationId" UUID REFERENCES organizations(id),
        country VARCHAR NOT NULL,
        city VARCHAR,
        "securityLevel" VARCHAR DEFAULT 'STANDARD',
        status VARCHAR DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "trackingNumber" VARCHAR UNIQUE NOT NULL,
        "originWarehouseId" UUID REFERENCES warehouses(id),
        "destinationWarehouseId" UUID REFERENCES warehouses(id),
        "carrierId" VARCHAR,
        status VARCHAR DEFAULT 'PREPARING',
        "estimatedArrival" TIMESTAMP,
        "actualArrival" TIMESTAMP,
        "insuranceValue" DECIMAL(20,2),
        notes VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS custody_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "assetId" UUID REFERENCES assets(id),
        "eventType" VARCHAR NOT NULL,
        "fromCustodianId" UUID REFERENCES users(id),
        "toCustodianId" UUID REFERENCES users(id),
        "fromLocationId" UUID REFERENCES organizations(id),
        "toLocationId" UUID REFERENCES organizations(id),
        "authorizedById" UUID REFERENCES users(id),
        reason VARCHAR,
        "signatureHash" VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS blockchain_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventType" VARCHAR NOT NULL,
        "entityType" VARCHAR NOT NULL,
        "entityId" VARCHAR NOT NULL,
        "assetId" UUID REFERENCES assets(id),
        "contentHash" VARCHAR NOT NULL,
        "networkTxId" VARCHAR,
        "blockNumber" INT,
        "confirmationStatus" VARCHAR DEFAULT 'PENDING',
        network VARCHAR,
        metadata JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_blockchain_entity ON blockchain_events("entityType", "entityId");
      CREATE INDEX IF NOT EXISTS idx_blockchain_asset ON blockchain_events("assetId");
      CREATE INDEX IF NOT EXISTS idx_blockchain_status ON blockchain_events("confirmationStatus");
      CREATE INDEX IF NOT EXISTS idx_blockchain_created ON blockchain_events("createdAt");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "actorId" UUID REFERENCES users(id),
        "organizationId" UUID REFERENCES organizations(id),
        action VARCHAR NOT NULL,
        resource VARCHAR NOT NULL,
        "resourceId" VARCHAR,
        before JSONB,
        after JSONB,
        "ipAddress" VARCHAR,
        "userAgent" VARCHAR,
        "requestId" VARCHAR,
        reason VARCHAR,
        metadata JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id),
        type VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        message VARCHAR,
        "isRead" BOOLEAN DEFAULT false,
        "actionUrl" VARCHAR,
        metadata JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR UNIQUE NOT NULL,
        description VARCHAR,
        "isSystem" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR UNIQUE NOT NULL,
        resource VARCHAR NOT NULL,
        action VARCHAR NOT NULL,
        description VARCHAR,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "roleId" UUID REFERENCES roles(id),
        "permissionId" UUID REFERENCES permissions(id),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("roleId", "permissionId")
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id),
        "roleId" UUID REFERENCES roles(id),
        "organizationId" UUID REFERENCES organizations(id),
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("userId", "roleId", "organizationId")
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id),
        "tokenHash" VARCHAR NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "isUsed" BOOLEAN DEFAULT false,
        "usedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS email_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id),
        "tokenHash" VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "isVerified" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS mfa_devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id),
        type VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        secret VARCHAR,
        "publicKey" VARCHAR,
        "isVerified" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "lastUsedAt" TIMESTAMP,
        "failedAttempts" INT DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id),
        "codeHash" VARCHAR NOT NULL,
        purpose VARCHAR NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        attempts INT DEFAULT 0,
        "isUsed" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS otp_codes`);
    await queryRunner.query(`DROP TABLE IF EXISTS mfa_devices`);
    await queryRunner.query(`DROP TABLE IF EXISTS email_verifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS password_resets`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS blockchain_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS custody_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS shipments`);
    await queryRunner.query(`DROP TABLE IF EXISTS warehouses`);
    await queryRunner.query(`DROP TABLE IF EXISTS ledger_entries`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments`);
    await queryRunner.query(`DROP TABLE IF EXISTS invoices`);
    await queryRunner.query(`DROP TABLE IF EXISTS transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS negotiations`);
    await queryRunner.query(`DROP TABLE IF EXISTS offers`);
    await queryRunner.query(`DROP TABLE IF EXISTS listings`);
    await queryRunner.query(`DROP TABLE IF EXISTS assay_results`);
    await queryRunner.query(`DROP TABLE IF EXISTS assay_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS laboratories`);
    await queryRunner.query(`DROP TABLE IF EXISTS digital_passports`);
    await queryRunner.query(`DROP TABLE IF EXISTS asset_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS assets`);
    await queryRunner.query(`DROP TABLE IF EXISTS compliance_checks`);
    await queryRunner.query(`DROP TABLE IF EXISTS kyc_documents`);
    await queryRunner.query(`DROP TABLE IF EXISTS kyc_profiles`);
    await queryRunner.query(`DROP TABLE IF EXISTS sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS organization_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
