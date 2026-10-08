-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('ASSAY_LAB', 'REFINERY', 'MINE', 'MINT', 'JEWELLERY_MANUFACTURER', 'RETAILER', 'CUSTODIAN', 'BANK', 'CUSTOMS', 'INSURER', 'LOGISTICS_PROVIDER', 'GOVERNMENT_AUTHORITY', 'CERTIFICATION_BODY');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('AR', 'FR', 'EN');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('DZD', 'EUR', 'USD');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('BAR', 'COIN', 'JEWELLERY', 'BULLION', 'GEMSTONE', 'SCRAP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MetalType" AS ENUM ('GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM', 'GEMSTONE');

-- CreateEnum
CREATE TYPE "NdefLockStatus" AS ENUM ('UNLOCKED', 'LOCKED', 'TAMPERED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('RAW_MATERIAL', 'IN_REFINING', 'READY_FOR_ASSAY', 'IN_ASSAY', 'ASSAYED', 'CERTIFIED', 'INVENTORY', 'LISTED', 'IN_CUSTODY', 'IN_TRANSIT', 'DELIVERED', 'SOLD', 'IN_SECONDARY_MARKET', 'RECYCLED', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "OriginSource" AS ENUM ('MINE', 'REFINERY', 'MINT', 'JEWELLERY_WORKSHOP', 'RECYCLING_CENTER', 'CUSTOMS_SEIZURE', 'SECONDARY_MARKET');

-- CreateEnum
CREATE TYPE "AssayMethod" AS ENUM ('XRF', 'FIRE_ASSAY', 'ULTRASONIC', 'EDDY_CURRENT', 'OPTICAL', 'DENSITY', 'ICP_MS', 'GRAVIMETRIC');

-- CreateEnum
CREATE TYPE "AssayResult" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASS', 'CONDITIONAL_PASS', 'FAIL', 'INCONCLUSIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('SECURE_VAULT', 'REFINERY', 'ASSAY_LAB', 'RETAIL_STORE', 'WAREHOUSE', 'CUSTOMS_BOND', 'FREE_ZONE');

-- CreateEnum
CREATE TYPE "SecurityLevel" AS ENUM ('STANDARD', 'ENHANCED', 'HIGH_SECURITY', 'MILITARY_GRADE');

-- CreateEnum
CREATE TYPE "CustodyStatus" AS ENUM ('SECURE', 'PENDING_RELEASE', 'IN_TRANSIT', 'DELIVERED', 'DISPUTED', 'LOST', 'DAMAGED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('RECEIPT', 'TRANSFER', 'RELEASE', 'RETURN', 'DISPOSAL', 'RECLASSIFICATION');

-- CreateEnum
CREATE TYPE "ErpAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE', 'STATUS_CHANGE', 'TRANSFER', 'APPROVAL', 'REJECTION');

-- CreateEnum
CREATE TYPE "AiAnalysisType" AS ENUM ('PURITY_KARAT_ANALYSIS', 'GEMSTONE_APPRAISAL', 'JEWELLERY_VALUE_ESTIMATION', 'FRAUD_DETECTION', 'IMAGE_AUTHENTICITY', 'WEIGHT_VERIFICATION', 'ORIGIN_PREDICTION');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FraudAnomalyType" AS ENUM ('SERIAL_DUPLICATION', 'WEIGHT_ANOMALY', 'GEOGRAPHIC_IMPOSSIBILITY', 'PURITY_INCONSISTENCY', 'CHAIN_OF_CUSTODY_BROKEN', 'NFC_TAMPER_DETECTED', 'CERTIFICATE_FORGERY', 'MULTIPLE_REGISTRATIONS', 'PRICE_MANIPULATION');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'FLAGGED', 'BLOCKED', 'UNDER_INVESTIGATION', 'ESCALATED');

-- CreateEnum
CREATE TYPE "EvidenceEventType" AS ENUM ('ASSET_REGISTRATION', 'ASSAY_COMPLETION', 'CERTIFICATION_ISSUED', 'OWNERSHIP_TRANSFER', 'CUSTODY_CHANGE', 'TRANSPORT_STARTED', 'TRANSPORT_COMPLETED', 'CUSTOMS_CLEARED', 'MARKETPLACE_LISTING', 'SALE_COMPLETED', 'RECYCLING_INITIATED');

-- CreateEnum
CREATE TYPE "AccessControlType" AS ENUM ('KEY', 'COMBINATION', 'BIOMETRIC', 'DUAL_AUTH', 'MULTI_FACTOR');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('INTERNAL', 'EXTERNAL', 'RETURN', 'DISPOSAL', 'CUSTOMS_EXPORT', 'CUSTOMS_IMPORT');

-- CreateEnum
CREATE TYPE "DualAuthStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_FIRST', 'PENDING_SECOND', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransportMethod" AS ENUM ('ARMORED_VEHICLE', 'SECURED_PARCEL', 'BANK_TRANSFER', 'PERSONAL_CARRY', 'DIPLOMATIC_POUCH', 'AIR_FREIGHT', 'SEA_FREIGHT');

-- CreateEnum
CREATE TYPE "CustodyEventStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TransferRequestStatus" AS ENUM ('PENDING', 'FIRST_APPROVED', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LogisticsEventType" AS ENUM ('PICKUP', 'LOADED', 'IN_TRANSIT', 'CHECKPOINT', 'CUSTOMS_HOLD', 'CUSTOMS_CLEARED', 'ARRIVED', 'DELIVERED', 'UNLOADED', 'INSPECTION', 'SEAL_VERIFIED');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('FIXED_PRICE', 'AUCTION', 'NEGOTIABLE', 'REQUEST_FOR_QUOTE');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'B2B_ONLY', 'B2G_ONLY', 'PRIVATE', 'WHOLESALE');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'USED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'SOLD', 'EXPIRED', 'CANCELLED', 'REMOVED');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('OPERATION', 'SECURITY', 'AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'SYSTEM', 'COMPLIANCE');

-- CreateTable
CREATE TABLE "external_entities" (
    "id" UUID NOT NULL,
    "entityCode" VARCHAR(50) NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200),
    "nameFr" VARCHAR(200),
    "country" VARCHAR(3) NOT NULL,
    "city" VARCHAR(100),
    "address" JSONB,
    "registrationNumber" VARCHAR(100) NOT NULL,
    "taxId" VARCHAR(50),
    "licenseNumber" VARCHAR(100),
    "licenseExpiry" TIMESTAMPTZ,
    "contactEmail" VARCHAR(255) NOT NULL,
    "contactPhone" VARCHAR(30),
    "publicKeyPem" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDate" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "external_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "entityId" UUID NOT NULL,
    "keyHash" VARCHAR(255) NOT NULL,
    "keyPrefix" VARCHAR(8) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "scopes" JSONB NOT NULL,
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "expiresAt" TIMESTAMPTZ,
    "lastUsedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "roleCode" VARCHAR(50) NOT NULL,
    "nameEn" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "nameFr" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "permissions" JSONB NOT NULL,
    "hierarchy" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30),
    "roleId" UUID NOT NULL,
    "preferredLanguage" "Language" NOT NULL DEFAULT 'EN',
    "preferredCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" VARCHAR(255),
    "mfaVerifiedAt" TIMESTAMPTZ,
    "lastLoginAt" TIMESTAMPTZ,
    "lastLoginIp" VARCHAR(45),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMPTZ,
    "passwordChangedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gold_assets" (
    "id" UUID NOT NULL,
    "goldId" VARCHAR(50) NOT NULL,
    "serialNumber" VARCHAR(100) NOT NULL,
    "manufacturerSerial" VARCHAR(100),
    "productType" "ProductType" NOT NULL,
    "metalType" "MetalType" NOT NULL,
    "karat" INTEGER,
    "weightGross" DECIMAL(12,4) NOT NULL,
    "weightNet" DECIMAL(12,4) NOT NULL,
    "dimensions" JSONB,
    "color" VARCHAR(30),
    "measuredPurity" DECIMAL(5,2),
    "purityKarat" INTEGER,
    "nfcUid" VARCHAR(50),
    "nfcUidHash" VARCHAR(255),
    "ndefLockStatus" "NdefLockStatus" NOT NULL DEFAULT 'UNLOCKED',
    "nfcLockedAt" TIMESTAMPTZ,
    "nfcLockedBy" UUID,
    "manufacturingCost" DECIMAL(12,2),
    "refiningCost" DECIMAL(12,2),
    "assayCost" DECIMAL(12,2),
    "packagingCost" DECIMAL(12,2),
    "status" "AssetStatus" NOT NULL DEFAULT 'RAW_MATERIAL',
    "originSource" "OriginSource" NOT NULL DEFAULT 'REFINERY',
    "originEntityId" UUID,
    "nameTranslations" JSONB NOT NULL DEFAULT '{}',
    "descriptionTranslations" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "producedAt" TIMESTAMPTZ,

    CONSTRAINT "gold_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assay_labs" (
    "id" UUID NOT NULL,
    "entityId" UUID NOT NULL,
    "iso17025CertNumber" VARCHAR(100) NOT NULL,
    "iso17025Expiry" TIMESTAMPTZ NOT NULL,
    "accreditationScope" JSONB NOT NULL,
    "availableMethods" "AssayMethod"[],
    "maxDailyCapacity" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assay_labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assay_records" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "labId" UUID NOT NULL,
    "reportNumber" VARCHAR(100) NOT NULL,
    "density" DECIMAL(8,4),
    "xrfPurity" DECIMAL(5,2),
    "xrfElementBreakdown" JSONB,
    "xrfScanDate" TIMESTAMPTZ,
    "fireAssayPurity" DECIMAL(5,4),
    "fireAssayResult" VARCHAR(50),
    "fireAssayDate" TIMESTAMPTZ,
    "ultrasonicTest" VARCHAR(20),
    "ultrasonicFindings" JSONB,
    "eddyCurrentTest" VARCHAR(20),
    "conductivityReading" DECIMAL(8,4),
    "opticalInspection" VARCHAR(20),
    "opticalFindings" JSONB,
    "visualScore" SMALLINT,
    "overallResult" "AssayResult" NOT NULL DEFAULT 'PENDING',
    "measuredPurity" DECIMAL(5,2) NOT NULL,
    "certifiedKarat" INTEGER NOT NULL,
    "technicianId" UUID NOT NULL,
    "technicianSignature" VARCHAR(500) NOT NULL,
    "labDirectorSignature" VARCHAR(500),
    "certHash" VARCHAR(255) NOT NULL,
    "certificateUrl" VARCHAR(500),
    "certificateExpiry" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assay_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_identities" (
    "id" UUID NOT NULL,
    "goldId" VARCHAR(50) NOT NULL,
    "assetId" UUID NOT NULL,
    "nfcUidHash" VARCHAR(255),
    "qrCodeHash" VARCHAR(255),
    "genesisHash" VARCHAR(255) NOT NULL,
    "currentHash" VARCHAR(255) NOT NULL,
    "hashChainLength" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "digital_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_passports" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "passportNumber" VARCHAR(50) NOT NULL,
    "passportData" JSONB NOT NULL DEFAULT '{}',
    "totalWeight" DECIMAL(12,4) NOT NULL,
    "certifiedPurity" DECIMAL(5,2) NOT NULL,
    "certifiedKarat" INTEGER NOT NULL,
    "assayCount" INTEGER NOT NULL DEFAULT 0,
    "lastAssayDate" TIMESTAMPTZ,
    "primaryImageUrl" VARCHAR(500),
    "galleryUrls" JSONB,
    "passportHash" VARCHAR(255) NOT NULL,
    "digitalSignature" VARCHAR(500),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMPTZ,
    "revokedReason" VARCHAR(500),
    "expiryDate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "digital_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "warehouseCode" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200),
    "nameFr" VARCHAR(200),
    "location" JSONB NOT NULL,
    "facilityType" "FacilityType" NOT NULL DEFAULT 'SECURE_VAULT',
    "securityLevel" "SecurityLevel" NOT NULL DEFAULT 'STANDARD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gold_erp_inventory" (
    "id" UUID NOT NULL,
    "itemId" VARCHAR(50) NOT NULL,
    "assetId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "vaultId" UUID,
    "compartmentRef" VARCHAR(50),
    "custodianId" UUID NOT NULL,
    "custodyStatus" "CustodyStatus" NOT NULL DEFAULT 'SECURE',
    "lastMovementType" "MovementType",
    "lastMovementAt" TIMESTAMPTZ,
    "currentValue" DECIMAL(14,2),
    "valuationCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "valuationDate" TIMESTAMPTZ,
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "gold_erp_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp_audit_trails" (
    "id" UUID NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID NOT NULL,
    "action" "ErpAction" NOT NULL,
    "performedBy" UUID NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" VARCHAR(500),
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "erp_audit_trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analysis_results" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "analysisType" "AiAnalysisType" NOT NULL,
    "modelVersion" VARCHAR(30) NOT NULL,
    "confidenceScore" DECIMAL(5,4) NOT NULL,
    "predictedPurity" DECIMAL(5,2),
    "predictedKarat" INTEGER,
    "predictedMetal" "MetalType",
    "anomalyDetected" BOOLEAN NOT NULL DEFAULT false,
    "anomalyDetails" JSONB,
    "imageAnalysis" JSONB,
    "recommendation" VARCHAR(500),
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "processingTimeMs" INTEGER,
    "modelConfidence" DECIMAL(5,4),
    "disclaimerShown" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_fraud_logs" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "riskScore" "RiskLevel" NOT NULL,
    "riskScoreNumeric" DECIMAL(5,4) NOT NULL,
    "anomalyType" "FraudAnomalyType" NOT NULL,
    "anomalyDetails" JSONB NOT NULL,
    "serialDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateAssetIds" JSONB,
    "weightAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "expectedWeight" DECIMAL(12,4),
    "actualWeight" DECIMAL(12,4),
    "weightDeviation" DECIMAL(8,4),
    "geoAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "geoDetails" JSONB,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ,
    "reviewDecision" "ReviewDecision",
    "reviewNotes" VARCHAR(1000),
    "actionTaken" VARCHAR(200),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_fraud_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_evidence" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "eventType" "EvidenceEventType" NOT NULL,
    "evidenceData" JSONB NOT NULL,
    "previousHash" VARCHAR(255) NOT NULL,
    "currentHash" VARCHAR(255) NOT NULL,
    "merkleRoot" VARCHAR(255),
    "blockNumber" BIGINT,
    "transactionHash" VARCHAR(255),
    "networkId" VARCHAR(50),
    "contractAddress" VARCHAR(50),
    "sourceSystem" VARCHAR(50) NOT NULL,
    "sourceAction" VARCHAR(50) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMPTZ,
    "verificationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custody_vaults" (
    "id" UUID NOT NULL,
    "vaultCode" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "warehouseId" UUID NOT NULL,
    "entityId" UUID,
    "securityGrade" "SecurityLevel" NOT NULL DEFAULT 'HIGH_SECURITY',
    "capacityKg" DECIMAL(10,2) NOT NULL,
    "currentOccupancyKg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "temperatureControl" BOOLEAN NOT NULL DEFAULT true,
    "humidityControl" BOOLEAN NOT NULL DEFAULT true,
    "fireSupression" BOOLEAN NOT NULL DEFAULT true,
    "cctvMonitoring" BOOLEAN NOT NULL DEFAULT true,
    "accessControl" "AccessControlType" NOT NULL DEFAULT 'BIOMETRIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastInspectionAt" TIMESTAMPTZ,
    "insuranceValue" DECIMAL(14,2),
    "insuranceCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "custody_vaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_of_custody" (
    "id" UUID NOT NULL,
    "custodyId" VARCHAR(50) NOT NULL,
    "assetId" UUID NOT NULL,
    "vaultId" UUID,
    "fromEntityId" UUID NOT NULL,
    "toEntityId" UUID NOT NULL,
    "transferType" "TransferType" NOT NULL DEFAULT 'INTERNAL',
    "requiresDualAuth" BOOLEAN NOT NULL DEFAULT false,
    "dualAuthStatus" "DualAuthStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "initiatedBy" UUID NOT NULL,
    "approvedBy" UUID,
    "transportMethod" "TransportMethod",
    "trackingNumber" VARCHAR(100),
    "insuranceValue" DECIMAL(14,2),
    "estimatedArrival" TIMESTAMPTZ,
    "actualArrival" TIMESTAMPTZ,
    "handoverNotes" VARCHAR(2000),
    "photoEvidenceUrl" VARCHAR(500),
    "signatureHash" VARCHAR(255),
    "status" "CustodyEventStatus" NOT NULL DEFAULT 'PENDING',
    "eventTimestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chain_of_custody_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custody_transfer_requests" (
    "id" UUID NOT NULL,
    "requestId" VARCHAR(50) NOT NULL,
    "assetId" UUID NOT NULL,
    "fromEntityId" UUID NOT NULL,
    "toEntityId" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "estimatedValue" DECIMAL(14,2) NOT NULL,
    "valueCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "requiresDualAuth" BOOLEAN NOT NULL DEFAULT false,
    "firstApproverId" UUID,
    "firstApprovalAt" TIMESTAMPTZ,
    "firstApprovalNote" VARCHAR(500),
    "secondApproverId" UUID,
    "secondApprovalAt" TIMESTAMPTZ,
    "secondApprovalNote" VARCHAR(500),
    "status" "TransferRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" VARCHAR(500),
    "custodyId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "custody_transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_events" (
    "id" UUID NOT NULL,
    "custodyId" UUID NOT NULL,
    "eventType" "LogisticsEventType" NOT NULL,
    "location" JSONB NOT NULL,
    "description" VARCHAR(500),
    "photoUrls" JSONB,
    "temperature" DECIMAL(5,2),
    "humidity" DECIMAL(5,2),
    "isSealed" BOOLEAN,
    "sealNumber" VARCHAR(50),
    "performedBy" UUID,
    "eventTimestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logistics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_items" (
    "id" UUID NOT NULL,
    "listingId" VARCHAR(50) NOT NULL,
    "assetId" UUID NOT NULL,
    "sellerEntityId" UUID NOT NULL,
    "listingType" "ListingType" NOT NULL DEFAULT 'FIXED_PRICE',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "basePrice" DECIMAL(14,2) NOT NULL,
    "priceCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "metalValue" DECIMAL(14,2) NOT NULL,
    "manufacturingValue" DECIMAL(14,2) NOT NULL,
    "gemstoneValue" DECIMAL(14,2),
    "certificationValue" DECIMAL(14,2) NOT NULL,
    "insuranceValue" DECIMAL(14,2) NOT NULL,
    "logisticsValue" DECIMAL(14,2) NOT NULL,
    "marketplaceFee" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "finalPrice" DECIMAL(14,2) NOT NULL,
    "referenceGoldPricePerGram" DECIMAL(10,2),
    "referenceMetalType" "MetalType" NOT NULL DEFAULT 'GOLD',
    "priceLockedAt" TIMESTAMPTZ,
    "titleTranslations" JSONB NOT NULL DEFAULT '{}',
    "descriptionTranslations" JSONB NOT NULL DEFAULT '{}',
    "condition" "ItemCondition" NOT NULL DEFAULT 'NEW',
    "authenticityGuaranteed" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "listedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "soldAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "marketplace_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID,
    "description" VARCHAR(1000),
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "sessionId" VARCHAR(100),
    "requestId" VARCHAR(100),
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "category" "AuditCategory" NOT NULL DEFAULT 'OPERATION',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_entities_entityCode_key" ON "external_entities"("entityCode");

-- CreateIndex
CREATE INDEX "external_entities_entityType_isActive_idx" ON "external_entities"("entityType", "isActive");

-- CreateIndex
CREATE INDEX "external_entities_country_idx" ON "external_entities"("country");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_entityId_isActive_idx" ON "api_keys"("entityId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "roles_roleCode_key" ON "roles"("roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_email_isActive_idx" ON "users"("email", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "gold_assets_goldId_key" ON "gold_assets"("goldId");

-- CreateIndex
CREATE INDEX "gold_assets_goldId_idx" ON "gold_assets"("goldId");

-- CreateIndex
CREATE INDEX "gold_assets_metalType_karat_idx" ON "gold_assets"("metalType", "karat");

-- CreateIndex
CREATE INDEX "gold_assets_status_idx" ON "gold_assets"("status");

-- CreateIndex
CREATE INDEX "gold_assets_originEntityId_idx" ON "gold_assets"("originEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "gold_assets_serialNumber_metalType_key" ON "gold_assets"("serialNumber", "metalType");

-- CreateIndex
CREATE UNIQUE INDEX "assay_labs_entityId_key" ON "assay_labs"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "assay_records_reportNumber_key" ON "assay_records"("reportNumber");

-- CreateIndex
CREATE INDEX "assay_records_assetId_overallResult_idx" ON "assay_records"("assetId", "overallResult");

-- CreateIndex
CREATE INDEX "assay_records_labId_idx" ON "assay_records"("labId");

-- CreateIndex
CREATE INDEX "assay_records_reportNumber_idx" ON "assay_records"("reportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "digital_identities_goldId_key" ON "digital_identities"("goldId");

-- CreateIndex
CREATE UNIQUE INDEX "digital_identities_assetId_key" ON "digital_identities"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "digital_passports_assetId_key" ON "digital_passports"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "digital_passports_passportNumber_key" ON "digital_passports"("passportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_warehouseCode_key" ON "warehouses"("warehouseCode");

-- CreateIndex
CREATE UNIQUE INDEX "gold_erp_inventory_itemId_key" ON "gold_erp_inventory"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "gold_erp_inventory_assetId_key" ON "gold_erp_inventory"("assetId");

-- CreateIndex
CREATE INDEX "gold_erp_inventory_warehouseId_custodyStatus_idx" ON "gold_erp_inventory"("warehouseId", "custodyStatus");

-- CreateIndex
CREATE INDEX "gold_erp_inventory_custodianId_idx" ON "gold_erp_inventory"("custodianId");

-- CreateIndex
CREATE INDEX "erp_audit_trails_entityType_entityId_idx" ON "erp_audit_trails"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "erp_audit_trails_performedBy_idx" ON "erp_audit_trails"("performedBy");

-- CreateIndex
CREATE INDEX "ai_analysis_results_assetId_analysisType_idx" ON "ai_analysis_results"("assetId", "analysisType");

-- CreateIndex
CREATE INDEX "ai_fraud_logs_assetId_riskScore_idx" ON "ai_fraud_logs"("assetId", "riskScore");

-- CreateIndex
CREATE INDEX "ai_fraud_logs_requiresHumanReview_isResolved_idx" ON "ai_fraud_logs"("requiresHumanReview", "isResolved");

-- CreateIndex
CREATE INDEX "ai_fraud_logs_riskScore_createdAt_idx" ON "ai_fraud_logs"("riskScore", "createdAt");

-- CreateIndex
CREATE INDEX "blockchain_evidence_assetId_eventType_idx" ON "blockchain_evidence"("assetId", "eventType");

-- CreateIndex
CREATE INDEX "blockchain_evidence_currentHash_idx" ON "blockchain_evidence"("currentHash");

-- CreateIndex
CREATE INDEX "blockchain_evidence_blockNumber_idx" ON "blockchain_evidence"("blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "custody_vaults_vaultCode_key" ON "custody_vaults"("vaultCode");

-- CreateIndex
CREATE UNIQUE INDEX "custody_vaults_entityId_key" ON "custody_vaults"("entityId");

-- CreateIndex
CREATE INDEX "custody_vaults_warehouseId_isActive_idx" ON "custody_vaults"("warehouseId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "chain_of_custody_custodyId_key" ON "chain_of_custody"("custodyId");

-- CreateIndex
CREATE INDEX "chain_of_custody_assetId_eventTimestamp_idx" ON "chain_of_custody"("assetId", "eventTimestamp");

-- CreateIndex
CREATE INDEX "chain_of_custody_fromEntityId_idx" ON "chain_of_custody"("fromEntityId");

-- CreateIndex
CREATE INDEX "chain_of_custody_toEntityId_idx" ON "chain_of_custody"("toEntityId");

-- CreateIndex
CREATE INDEX "chain_of_custody_dualAuthStatus_idx" ON "chain_of_custody"("dualAuthStatus");

-- CreateIndex
CREATE INDEX "chain_of_custody_status_idx" ON "chain_of_custody"("status");

-- CreateIndex
CREATE UNIQUE INDEX "custody_transfer_requests_requestId_key" ON "custody_transfer_requests"("requestId");

-- CreateIndex
CREATE INDEX "custody_transfer_requests_assetId_status_idx" ON "custody_transfer_requests"("assetId", "status");

-- CreateIndex
CREATE INDEX "custody_transfer_requests_requiresDualAuth_status_idx" ON "custody_transfer_requests"("requiresDualAuth", "status");

-- CreateIndex
CREATE INDEX "logistics_events_custodyId_eventTimestamp_idx" ON "logistics_events"("custodyId", "eventTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_items_listingId_key" ON "marketplace_items"("listingId");

-- CreateIndex
CREATE INDEX "marketplace_items_sellerEntityId_status_idx" ON "marketplace_items"("sellerEntityId", "status");

-- CreateIndex
CREATE INDEX "marketplace_items_referenceMetalType_status_idx" ON "marketplace_items"("referenceMetalType", "status");

-- CreateIndex
CREATE INDEX "marketplace_items_finalPrice_idx" ON "marketplace_items"("finalPrice");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_entityType_idx" ON "audit_logs"("action", "entityType");

-- CreateIndex
CREATE INDEX "audit_logs_severity_createdAt_idx" ON "audit_logs"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "external_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_assets" ADD CONSTRAINT "gold_assets_originEntityId_fkey" FOREIGN KEY ("originEntityId") REFERENCES "external_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assay_labs" ADD CONSTRAINT "assay_labs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "external_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assay_records" ADD CONSTRAINT "assay_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "gold_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assay_records" ADD CONSTRAINT "assay_records_labId_fkey" FOREIGN KEY ("labId") REFERENCES "assay_labs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_passports" ADD CONSTRAINT "digital_passports_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "gold_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_erp_inventory" ADD CONSTRAINT "gold_erp_inventory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "gold_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_erp_inventory" ADD CONSTRAINT "gold_erp_inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_erp_inventory" ADD CONSTRAINT "gold_erp_inventory_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "custody_vaults"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis_results" ADD CONSTRAINT "ai_analysis_results_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "gold_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_fraud_logs" ADD CONSTRAINT "ai_fraud_logs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "gold_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_evidence" ADD CONSTRAINT "blockchain_evidence_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "gold_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_vaults" ADD CONSTRAINT "custody_vaults_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_vaults" ADD CONSTRAINT "custody_vaults_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "external_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_of_custody" ADD CONSTRAINT "chain_of_custody_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "gold_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_of_custody" ADD CONSTRAINT "chain_of_custody_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "custody_vaults"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_of_custody" ADD CONSTRAINT "chain_of_custody_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "external_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_of_custody" ADD CONSTRAINT "chain_of_custody_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "external_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_items" ADD CONSTRAINT "marketplace_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "gold_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_items" ADD CONSTRAINT "marketplace_items_sellerEntityId_fkey" FOREIGN KEY ("sellerEntityId") REFERENCES "external_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
