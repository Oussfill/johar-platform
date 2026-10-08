import {
  User,
  UserRole,
  KYCStatus,
  KYCDocument,
  Company,
  ApiResponse,
} from "../types";

// ─── JOHAR ID GENERATOR ─────────────────────────────────

export class JoharIdGenerator {
  private static counters: Map<string, number> = new Map();

  static generate(
    assetType: string,
    origin: string,
    year: number = new Date().getFullYear()
  ): string {
    const prefix = assetType.substring(0, 4).toUpperCase();
    const originCode = origin.substring(0, 3).toUpperCase();
    const key = `${prefix}-${originCode}-${year}`;

    const current = this.counters.get(key) || 0;
    const next = current + 1;
    this.counters.set(key, next);

    const sequence = String(next).padStart(8, "0");
    return `JOHAR-${prefix}-${originCode}-${year}-${sequence}`;
  }

  static parse(joharId: string): {
    assetType: string;
    origin: string;
    year: number;
    sequence: number;
  } | null {
    const parts = joharId.split("-");
    if (parts.length !== 5 || parts[0] !== "JOHAR") return null;

    return {
      assetType: parts[1],
      origin: parts[2],
      year: parseInt(parts[3]),
      sequence: parseInt(parts[4]),
    };
  }

  static validate(joharId: string): boolean {
    return /^JOHAR-[A-Z]{4}-[A-Z]{3}-\d{4}-\d{8}$/.test(joharId);
  }
}

// ─── USER SERVICE ────────────────────────────────────────

export class UserService {
  private users: Map<string, User> = new Map();

  async create(data: {
    email: string;
    phone?: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    firstNameAr?: string;
    lastNameAr?: string;
  }): Promise<ApiResponse<User>> {
    if (this.findByEmail(data.email)) {
      return {
        success: false,
        error: { code: "EMAIL_EXISTS", message: "Email already registered" },
      };
    }

    const user: User = {
      id: crypto.randomUUID(),
      ...data,
      kycStatus: "NOT_STARTED",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return { success: true, data: user };
  }

  async findById(id: string): Promise<ApiResponse<User>> {
    const user = this.users.get(id);
    if (!user) {
      return {
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      };
    }
    return { success: true, data: user };
  }

  findByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  async updateKycStatus(
    id: string,
    status: KYCStatus
  ): Promise<ApiResponse<User>> {
    const user = this.users.get(id);
    if (!user) {
      return {
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      };
    }

    user.kycStatus = status;
    user.updatedAt = new Date();
    return { success: true, data: user };
  }

  async list(filters?: {
    role?: UserRole;
    kycStatus?: KYCStatus;
    isActive?: boolean;
  }): Promise<ApiResponse<User[]>> {
    let users = Array.from(this.users.values());

    if (filters?.role) users = users.filter((u) => u.role === filters.role);
    if (filters?.kycStatus)
      users = users.filter((u) => u.kycStatus === filters.kycStatus);
    if (filters?.isActive !== undefined)
      users = users.filter((u) => u.isActive === filters.isActive);

    return { success: true, data: users };
  }
}

// ─── KYC SERVICE ─────────────────────────────────────────

export class KYCService {
  private documents: Map<string, KYCDocument> = new Map();
  private companies: Map<string, Company> = new Map();

  async submitDocument(data: {
    userId: string;
    documentType: KYCDocument["documentType"];
    documentUrl: string;
    expiresAt?: Date;
  }): Promise<ApiResponse<KYCDocument>> {
    const doc: KYCDocument = {
      id: crypto.randomUUID(),
      ...data,
      status: "PENDING",
      createdAt: new Date(),
    };

    this.documents.set(doc.id, doc);
    return { success: true, data: doc };
  }

  async verifyDocument(
    docId: string,
    verifierId: string,
    approved: boolean,
    _notes?: string
  ): Promise<ApiResponse<KYCDocument>> {
    const doc = this.documents.get(docId);
    if (!doc) {
      return {
        success: false,
        error: { code: "DOC_NOT_FOUND", message: "Document not found" },
      };
    }

    doc.status = approved ? "VERIFIED" : "REJECTED";
    doc.verifiedBy = verifierId;
    doc.verifiedAt = new Date();

    return { success: true, data: doc };
  }

  async registerCompany(data: Omit<Company, "id" | "kybStatus" | "createdAt" | "updatedAt">): Promise<ApiResponse<Company>> {
    const company: Company = {
      id: crypto.randomUUID(),
      ...data,
      kybStatus: "NOT_STARTED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.companies.set(company.id, company);
    return { success: true, data: company };
  }

  async getDocumentsByUser(userId: string): Promise<ApiResponse<KYCDocument[]>> {
    const docs = Array.from(this.documents.values()).filter(
      (d) => d.userId === userId
    );
    return { success: true, data: docs };
  }

  async getCompanyById(id: string): Promise<ApiResponse<Company>> {
    const company = this.companies.get(id);
    if (!company) {
      return {
        success: false,
        error: { code: "COMPANY_NOT_FOUND", message: "Company not found" },
      };
    }
    return { success: true, data: company };
  }
}

// ─── ROLE PERMISSIONS ────────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["*"],
  SYSTEM_ADMIN: [
    "users:read",
    "users:write",
    "system:read",
    "system:write",
    "audit:read",
  ],
  SECURITY_ADMIN: [
    "security:read",
    "security:write",
    "users:read",
    "audit:read",
  ],
  COMPLIANCE_OFFICER: [
    "compliance:read",
    "compliance:write",
    "kyc:read",
    "kyc:write",
    "users:read",
  ],
  FINANCE_MANAGER: [
    "finance:read",
    "finance:write",
    "payments:read",
    "payments:write",
    "invoices:read",
    "invoices:write",
  ],
  LEGAL_OFFICER: [
    "legal:read",
    "legal:write",
    "contracts:read",
    "contracts:write",
  ],
  LAB_MANAGER: [
    "lab:read",
    "lab:write",
    "assay:read",
    "assay:write",
    "assets:read",
  ],
  LAB_TECHNICIAN: ["lab:read", "assay:write", "assets:read"],
  WAREHOUSE_MANAGER: [
    "inventory:read",
    "inventory:write",
    "logistics:read",
    "assets:read",
  ],
  LOGISTICS_MANAGER: [
    "logistics:read",
    "logistics:write",
    "shipments:read",
    "shipments:write",
  ],
  SALES_MANAGER: [
    "sales:read",
    "sales:write",
    "marketplace:read",
    "marketplace:write",
    "assets:read",
  ],
  BUYER: [
    "marketplace:read",
    "marketplace:write",
    "transactions:read",
    "assets:read",
  ],
  SELLER: [
    "marketplace:read",
    "marketplace:write",
    "assets:read",
    "assets:write",
    "transactions:read",
  ],
  NOTARY_LEGAL_PARTNER: [
    "legal:read",
    "contracts:read",
    "contracts:write",
    "transactions:read",
  ],
  AUDITOR: ["audit:read", "reports:read"],
  CUSTOMER: ["assets:read", "profile:read", "profile:write"],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}
