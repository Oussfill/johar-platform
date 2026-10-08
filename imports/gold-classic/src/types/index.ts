// ============================================================================
// GOLD PLATFORM — ENTERPRISE TYPE DEFINITIONS
// ============================================================================

import {
  Language,
  Currency,
  MetalType,
  ProductType,
  AssetStatus,
  AssayResult,
  RiskLevel,
  DualAuthStatus,
  TransferRequestStatus,
  ListingStatus,
  ListingType,
} from '@prisma/client';

// ============================================================================
// REQUEST / RESPONSE TYPES
// ============================================================================

export interface ApiRequest extends Express.Request {
  userId?: string;
  roleId?: string;
  preferredLanguage?: Language;
  preferredCurrency?: Currency;
  apiKeyId?: string;
  requestId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    language: Language;
    currency: Currency;
    timestamp: string;
    requestId?: string;
  };
}

// ============================================================================
// i18n & CURRENCY TYPES
// ============================================================================

export interface LocaleDictionary {
  [key: string]: string;
}

export interface MultiLangText {
  ar: string;
  fr: string;
  en: string;
}

export interface CurrencyAmount {
  amount: number;
  currency: Currency;
  formatted: string;
}

export interface PricingBreakdown {
  metalValue: CurrencyAmount;
  manufacturingCost: CurrencyAmount;
  refiningCost: CurrencyAmount;
  assayCost: CurrencyAmount;
  packagingCost: CurrencyAmount;
  insuranceCost: CurrencyAmount;
  logisticsCost: CurrencyAmount;
  marketplaceFee: CurrencyAmount;
  taxAmount: CurrencyAmount;
  total: CurrencyAmount;
}

// ============================================================================
// ASSET TYPES
// ============================================================================

export interface AssetRegistrationDTO {
  serialNumber: string;
  manufacturerSerial?: string;
  productType: ProductType;
  metalType: MetalType;
  karat?: number;
  weightGross: number;
  weightNet: number;
  dimensions?: {
    length_mm?: number;
    width_mm?: number;
    thickness_mm?: number;
    diameter_mm?: number;
  };
  color?: string;
  originEntityId?: string;
  nfcUid?: string;
  nameTranslations: MultiLangText;
  descriptionTranslations?: MultiLangText;
}

export interface AssetRegistrationResult {
  assetId: string;
  goldId: string;
  nfcLocked: boolean;
  digitalPassportCreated: boolean;
  qrCodeUrl: string;
}

// ============================================================================
// ASSAY TYPES
// ============================================================================

export interface AssaySubmissionDTO {
  assetId: string;
  labId: string;
  density?: number;
  xrfPurity?: number;
  xrfElementBreakdown?: Record<string, number>;
  fireAssayPurity?: number;
  ultrasonicTest?: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  eddyCurrentTest?: 'PASS' | 'FAIL';
  opticalInspection?: 'PASS' | 'FAIL';
  opticalFindings?: Record<string, unknown>;
}

export interface AssayResultDTO {
  assayId: string;
  reportNumber: string;
  overallResult: AssayResult;
  measuredPurity: number;
  certifiedKarat: number;
  certificateUrl?: string;
}

// ============================================================================
// AI TYPES
// ============================================================================

export interface AIJewelleryAnalysisDTO {
  metalType: MetalType;
  weightGross: number;
  karat?: number;
  images?: string[];
  estimatedGemstones?: Array<{
    type: string;
    carat: number;
    quality: string;
  }>;
}

export interface AIJewelleryAnalysisResult {
  metalValue: CurrencyAmount;
  manufacturingValue: CurrencyAmount;
  gemstoneValue: CurrencyAmount;
  estimatedRetailPrice: CurrencyAmount;
  confidenceScore: number;
  requiresHumanReview: boolean;
  disclaimer: string;
  recommendations: string[];
}

export interface FraudCheckResult {
  riskLevel: RiskLevel;
  riskScore: number;
  anomalies: Array<{
    type: string;
    description: string;
    severity: RiskLevel;
  }>;
  requiresHumanReview: boolean;
}

// ============================================================================
// CUSTODY TYPES
// ============================================================================

export interface TransferRequestDTO {
  assetId: string;
  toEntityId: string;
  reason: string;
  estimatedValue: number;
  valueCurrency: Currency;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  transportMethod?: string;
}

export interface TransferApprovalResult {
  requestId: string;
  requiresDualAuth: boolean;
  dualAuthStatus: DualAuthStatus;
  status: TransferRequestStatus;
  message: string;
}

// ============================================================================
// MARKETPLACE TYPES
// ============================================================================

export interface MarketplaceListingDTO {
  assetId: string;
  listingType: ListingType;
  visibility: Visibility;
  basePrice: number;
  priceCurrency: Currency;
  titleTranslations: MultiLangText;
  descriptionTranslations: MultiLangText;
  condition: ItemCondition;
}

export interface MarketplaceItemDTO {
  listingId: string;
  assetId: string;
  goldId: string;
  title: string;
  description: string;
  finalPrice: CurrencyAmount;
  pricingBreakdown: PricingBreakdown;
  condition: ItemCondition;
  status: ListingStatus;
}

// ============================================================================
// ERP TYPES
// ============================================================================

export interface InventoryReconciliationItem {
  assetId: string;
  goldId: string;
  erpStatus: AssetStatus;
  physicalStatus: AssetStatus;
  warehouseCode: string;
  vaultCode?: string;
  lastSyncAt: string;
  discrepancy: boolean;
  discrepancyDetails?: string;
}

// ============================================================================
// TYPES RE-EXPORTS (for clarity)
// ============================================================================

export type Visibility = 'PUBLIC' | 'B2B_ONLY' | 'B2G_ONLY' | 'PRIVATE' | 'WHOLESALE';
export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'USED';
