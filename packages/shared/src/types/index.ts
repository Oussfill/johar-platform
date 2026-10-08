// JOHAR ID Format: JOHAR-{TYPE}-{ORIGIN}-{YEAR}-{SEQUENTIAL}
// Example: JOHAR-GOLD-ALG-2026-00000001

export type AssetType =
  | "GOLD"
  | "SILVER"
  | "PLATINUM"
  | "PALLADIUM"
  | "DIAMOND"
  | "GEMSTONE"
  | "JEWELRY"
  | "BULLION"
  | "USED_GOLD"
  | "RAW_MATERIAL"
  | "MANUFACTURED_PRODUCT";

export type AssetStatus =
  | "REGISTERED"
  | "UNDER_ASSAY"
  | "CERTIFIED"
  | "LISTED"
  | "IN_NEGOTIATION"
  | "SOLD"
  | "IN_CUSTODY"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "DELISTED";

export type KYCStatus =
  | "NOT_STARTED"
  | "PENDING_DOCUMENTS"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type UserRole =
  | "SUPER_ADMIN"
  | "SYSTEM_ADMIN"
  | "SECURITY_ADMIN"
  | "COMPLIANCE_OFFICER"
  | "FINANCE_MANAGER"
  | "LEGAL_OFFICER"
  | "LAB_MANAGER"
  | "LAB_TECHNICIAN"
  | "WAREHOUSE_MANAGER"
  | "LOGISTICS_MANAGER"
  | "SALES_MANAGER"
  | "BUYER"
  | "SELLER"
  | "NOTARY_LEGAL_PARTNER"
  | "AUDITOR"
  | "CUSTOMER";

export type ComplianceStatus = "GREEN" | "YELLOW" | "RED";

export type TransactionStatus =
  | "DRAFT"
  | "OFFERED"
  | "COUNTER_OFFERED"
  | "NEGOTIATING"
  | "AGREED"
  | "COMPLIANCE_CHECK"
  | "CONTRACT_PENDING"
  | "CONTRACT_SIGNED"
  | "PAYMENT_PENDING"
  | "PAYMENT_AUTHORIZED"
  | "SETTLED"
  | "CUSTODY_TRANSFERRED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

export type Priority = "P1_CRITICAL" | "P2_HIGH" | "P3_NORMAL" | "P4_LOW";

// ─── JOHAR ID ───────────────────────────────────────────

export interface JoharId {
  id: string;
  fullId: string; // JOHAR-GOLD-ALG-2026-00000001
  assetType: AssetType;
  origin: string;
  year: number;
  sequence: number;
  qrCode: string;
  nfcTag?: string;
  createdAt: Date;
}

// ─── USER & IDENTITY ────────────────────────────────────

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  kycStatus: KYCStatus;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCDocument {
  id: string;
  userId: string;
  documentType: "NATIONAL_ID" | "PASSPORT" | "BUSINESS_LICENSE" | "TAX_CERTIFICATE" | "UTILITY_BILL" | "BANK_STATEMENT" | "OTHER";
  documentUrl: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  verifiedBy?: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  nameAr?: string;
  registrationNumber: string;
  taxId: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  type: "B2B" | "B2G" | "SUPPLIER" | "BUYER" | "LAB" | "LOGISTICS" | "NOTARY";
  kybStatus: KYCStatus;
  ubo?: UltimateBeneficialOwner;
  createdAt: Date;
  updatedAt: Date;
}

export interface UltimateBeneficialOwner {
  firstName: string;
  lastName: string;
  nationality: string;
  idNumber: string;
  ownershipPercentage: number;
}

// ─── ASSET ──────────────────────────────────────────────

export interface Asset {
  id: string;
  joharId: JoharId;
  assetType: AssetType;
  name: string;
  nameAr?: string;
  description?: string;
  weight: number;
  weightUnit: "GRAM" | "OUNCE" | "KG" | "CARAT";
  purity?: number; // e.g. 999.9, 999, 995
  karat?: number; // e.g. 24, 22, 18, 14
  dimensions?: string;
  origin: string;
  manufacturer?: string;
  supplierId?: string;
  productionDate?: Date;
  status: AssetStatus;
  images: string[];
  videos?: string[];
  certificateId?: string;
  ownerId: string;
  currentLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DigitalPassport {
  id: string;
  assetId: string;
  joharId: string;
  serialNumber: string;
  qrCode: string;
  nfcTag?: string;
  assetType: AssetType;
  weight: number;
  weightUnit: string;
  purity?: number;
  karat?: number;
  dimensions?: string;
  origin: string;
  manufacturer?: string;
  supplierId?: string;
  productionDate?: Date;
  assayLabId?: string;
  assayDate?: Date;
  assayResult?: AssayResult;
  certificateUrl?: string;
  images: string[];
  videos?: string[];
  ownershipHistory: OwnershipEvent[];
  custodyHistory: CustodyEvent[];
  transferHistory: TransferEvent[];
  blockchainHashes: BlockchainEvidence[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── LABORATORY ─────────────────────────────────────────

export interface Lab {
  id: string;
  name: string;
  nameAr?: string;
  accreditationNumber: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  equipment: LabEquipment[];
  technicians: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface LabEquipment {
  id: string;
  name: string;
  type: "XRF" | "FIRE_ASSAY" | "ICP_OES" | "SPECTROMETER" | "MICROSCOPE" | "WEIGHING_SCALE" | "OTHER";
  serialNumber: string;
  calibrationDate: Date;
  calibrationDueDate: Date;
  isActive: boolean;
}

export interface AssayRequest {
  id: string;
  assetId: string;
  labId: string;
  requestedBy: string;
  status: "SUBMITTED" | "RECEIVED" | "WEIGHING" | "VISUAL_INSPECTION" | "XRF" | "FIRE_ASSAY" | "GEMOLOGY" | "TECHNICAL_REVIEW" | "RESULT_ISSUED" | "COMPLETED";
  weightRecorded?: number;
  visualInspectionNotes?: string;
  xrfResult?: XRFResult;
  fireAssayResult?: FireAssayResult;
  gemologyResult?: GemologyResult;
  finalResult?: AssayResult;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface XRFResult {
  equipmentId: string;
  gold?: number;
  silver?: number;
  platinum?: number;
  palladium?: number;
  copper?: number;
  zinc?: number;
  otherElements?: Record<string, number>;
  timestamp: Date;
}

export interface FireAssayResult {
  equipmentId: string;
  purity: number;
  weightBefore: number;
  weightAfter: number;
  timestamp: Date;
}

export interface GemologyResult {
  equipmentId: string;
  gemType: string;
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  treatment?: string;
  origin?: string;
  timestamp: Date;
}

export interface AssayResult {
  overallPurity?: number;
  karat?: number;
  gemResult?: GemologyResult;
  isPassed: boolean;
  notes: string;
  signedBy: string;
  signedAt: Date;
}

// ─── MARKETPLACE ────────────────────────────────────────

export interface Offer {
  id: string;
  assetId: string;
  sellerId: string;
  price: number;
  currency: string;
  quantity?: number;
  terms?: string;
  validUntil: Date;
  status: "ACTIVE" | "MATCHED" | "EXPIRED" | "WITHDRAWN" | "SOLD";
  createdAt: Date;
}

export interface Negotiation {
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  messages: NegotiationMessage[];
  finalPrice?: number;
  finalCurrency?: string;
  status: "OPEN" | "COUNTER_OFFERED" | "AGREED" | "FAILED" | "EXPIRED";
  createdAt: Date;
  updatedAt: Date;
}

export interface NegotiationMessage {
  id: string;
  senderId: string;
  type: "OFFER" | "COUNTER_OFFER" | "MESSAGE" | "ACCEPTANCE" | "REJECTION";
  price?: number;
  currency?: string;
  message?: string;
  timestamp: Date;
}

export interface Transaction {
  id: string;
  offerId: string;
  negotiationId?: string;
  buyerId: string;
  sellerId: string;
  assetId: string;
  price: number;
  currency: string;
  status: TransactionStatus;
  complianceStatus: ComplianceStatus;
  contractId?: string;
  paymentId?: string;
  logisticsId?: string;
  custodyChainId?: string;
  blockchainHash?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ─── ERP ────────────────────────────────────────────────

export interface Invoice {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  issuerId: string;
  recipientId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  issuedAt: Date;
  dueAt: Date;
  paidAt?: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  transactionId: string;
  invoiceId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  currency: string;
  method: "BANK_TRANSFER" | "CARD" | "LOCAL_PAYMENT" | "ESCROW" | "CASH" | "CORPORATE" | "INTERNATIONAL_SETTLEMENT";
  status: "PENDING" | "AUTHORIZED" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
  gatewayRef?: string;
  escrowId?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ─── COMPLIANCE ─────────────────────────────────────────

export interface ComplianceCheck {
  id: string;
  entityType: "USER" | "COMPANY" | "TRANSACTION" | "ASSET";
  entityId: string;
  checkType: "KYC" | "KYB" | "AML" | "SANCTIONS" | "UBO" | "SOURCE_OF_FUNDS" | "SOURCE_OF_GOLD";
  result: ComplianceStatus;
  details?: string;
  checkedBy: string;
  checkedAt: Date;
  expiresAt?: Date;
}

export interface SanctionsMatch {
  id: string;
  entityId: string;
  entityType: string;
  matchType: "EXACT" | "PARTIAL" | "FUZZY";
  matchScore: number;
  sanctionsSource: string;
  sanctionsEntry: string;
  status: "PENDING_REVIEW" | "FALSE_POSITIVE" | "CONFIRMED_MATCH";
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

// ─── BLOCKCHAIN EVIDENCE ────────────────────────────────

export interface BlockchainEvidence {
  id: string;
  entityType: "ASSET" | "TRANSACTION" | "ASSAY" | "CUSTODY" | "TRANSFER" | "CONTRACT";
  entityId: string;
  eventType: string;
  dataHash: string;
  blockNumber?: number;
  transactionHash?: string;
  timestamp: Date;
  network: string;
}

// ─── LOGISTICS ──────────────────────────────────────────

export interface Shipment {
  id: string;
  transactionId: string;
  assetId: string;
  senderId: string;
  receiverId: string;
  carrierId: string;
  origin: string;
  destination: string;
  status: "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "AT_CUSTOMS" | "DELIVERED" | "RETURNED";
  insuranceValue: number;
  insuranceCurrency: string;
  trackingNumber: string;
  custodyEvents: CustodyEvent[];
  createdAt: Date;
  deliveredAt?: Date;
}

export interface CustodyEvent {
  id: string;
  shipmentId: string;
  action: "PICKED_UP" | "TRANSFERRED" | "STORED" | "INSPECTED" | "DELIVERED";
  fromParty: string;
  toParty: string;
  location: string;
  timestamp: Date;
  notes?: string;
  blockchainHash?: string;
}

export interface OwnershipEvent {
  id: string;
  assetId: string;
  fromUserId?: string;
  toUserId: string;
  eventType: "CREATED" | "TRANSFERRED" | "SOLD" | "INHERITED" | "RETURNED";
  transactionId?: string;
  timestamp: Date;
  blockchainHash?: string;
}

export interface TransferEvent {
  id: string;
  assetId: string;
  fromLocation: string;
  toLocation: string;
  carrierId?: string;
  transactionId?: string;
  timestamp: Date;
  blockchainHash?: string;
}

// ─── SUPPORT ────────────────────────────────────────────

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  priority: Priority;
  category: "BUG" | "FEATURE_REQUEST" | "INCIDENT" | "QUESTION" | "ACCOUNT" | "PAYMENT" | "LOGISTICS" | "OTHER";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CUSTOMER" | "RESOLVED" | "CLOSED";
  assignedTo?: string;
  messages: SupportMessage[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  message: string;
  attachments?: string[];
  timestamp: Date;
}

// ─── NOTIFICATIONS ──────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: "KYC_UPDATE" | "ASSAY_COMPLETE" | "OFFER_RECEIVED" | "NEGOTIATION_MESSAGE" | "PAYMENT_STATUS" | "SHIPMENT_UPDATE" | "COMPLIANCE_ALERT" | "SYSTEM" | "SECURITY";
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// ─── AI ─────────────────────────────────────────────────

export interface AIPricingRecommendation {
  assetType: AssetType;
  weight: number;
  purity: number;
  marketPrice: number;
  recommendedPrice: number;
  currency: string;
  confidence: number;
  factors: string[];
  timestamp: Date;
}

export interface AIFraudAlert {
  id: string;
  entityType: "USER" | "TRANSACTION" | "ASSET";
  entityId: string;
  alertType: "UNUSUAL_PRICE" | "SUSPICIOUS_ACCOUNT" | "REPEATED_TRANSACTION" | "DATA_INCONSISTENCY" | "GEOGRAPHIC_ANOMALY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  details: string;
  status: "NEW" | "INVESTIGATING" | "RESOLVED" | "FALSE_POSITIVE";
  createdAt: Date;
}

export interface AIRiskScore {
  entityId: string;
  entityType: string;
  overallScore: number;
  factors: RiskFactor[];
  calculatedAt: Date;
}

export interface RiskFactor {
  category: string;
  score: number;
  weight: number;
  description: string;
}

// ─── API RESPONSES ──────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    messageAr?: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
