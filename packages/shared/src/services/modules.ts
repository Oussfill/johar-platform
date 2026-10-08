import {
  Asset,
  AssetType,
  AssetStatus,
  DigitalPassport,
  JoharId,
  OwnershipEvent,
  ApiResponse,
  AssayRequest,
  AssayResult,
  Lab,
  Offer,
  Negotiation,
  Transaction,
  TransactionStatus,
} from "../types";
import { JoharIdGenerator } from "./index";

// ─── ASSET SERVICE ───────────────────────────────────────

export class AssetService {
  private assets: Map<string, Asset> = new Map();
  private passports: Map<string, DigitalPassport> = new Map();

  async register(data: {
    assetType: AssetType;
    name: string;
    nameAr?: string;
    description?: string;
    weight: number;
    weightUnit: Asset["weightUnit"];
    purity?: number;
    karat?: number;
    dimensions?: string;
    origin: string;
    manufacturer?: string;
    supplierId?: string;
    productionDate?: Date;
    images: string[];
    ownerId: string;
  }): Promise<ApiResponse<Asset>> {
    const joharIdStr = JoharIdGenerator.generate(data.assetType, data.origin);

    const joharId: JoharId = {
      id: crypto.randomUUID(),
      fullId: joharIdStr,
      assetType: data.assetType,
      origin: data.origin,
      year: new Date().getFullYear(),
      sequence: parseInt(joharIdStr.split("-").pop()!),
      qrCode: `https://johar.app/verify/${joharIdStr}`,
      createdAt: new Date(),
    };

    const asset: Asset = {
      id: crypto.randomUUID(),
      joharId,
      ...data,
      status: "REGISTERED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assets.set(asset.id, asset);

    return { success: true, data: asset };
  }

  async createPassport(assetId: string): Promise<ApiResponse<DigitalPassport>> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      return {
        success: false,
        error: { code: "ASSET_NOT_FOUND", message: "Asset not found" },
      };
    }

    const passport: DigitalPassport = {
      id: crypto.randomUUID(),
      assetId: asset.id,
      joharId: asset.joharId.fullId,
      serialNumber: asset.joharId.fullId.split("-").pop()!,
      qrCode: asset.joharId.qrCode,
      nfcTag: asset.joharId.nfcTag,
      assetType: asset.assetType,
      weight: asset.weight,
      weightUnit: asset.weightUnit,
      purity: asset.purity,
      karat: asset.karat,
      dimensions: asset.dimensions,
      origin: asset.origin,
      manufacturer: asset.manufacturer,
      supplierId: asset.supplierId,
      productionDate: asset.productionDate,
      images: asset.images,
      ownershipHistory: [],
      custodyHistory: [],
      transferHistory: [],
      blockchainHashes: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.passports.set(passport.id, passport);
    return { success: true, data: passport };
  }

  async updateStatus(
    assetId: string,
    status: AssetStatus
  ): Promise<ApiResponse<Asset>> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      return {
        success: false,
        error: { code: "ASSET_NOT_FOUND", message: "Asset not found" },
      };
    }

    asset.status = status;
    asset.updatedAt = new Date();
    return { success: true, data: asset };
  }

  async getById(id: string): Promise<ApiResponse<Asset>> {
    const asset = this.assets.get(id);
    if (!asset) {
      return {
        success: false,
        error: { code: "ASSET_NOT_FOUND", message: "Asset not found" },
      };
    }
    return { success: true, data: asset };
  }

  async getByJoharId(joharId: string): Promise<ApiResponse<Asset>> {
    const asset = Array.from(this.assets.values()).find(
      (a) => a.joharId.fullId === joharId
    );
    if (!asset) {
      return {
        success: false,
        error: { code: "ASSET_NOT_FOUND", message: "Asset not found" },
      };
    }
    return { success: true, data: asset };
  }

  async getPassport(assetId: string): Promise<ApiResponse<DigitalPassport>> {
    const passport = Array.from(this.passports.values()).find(
      (p) => p.assetId === assetId
    );
    if (!passport) {
      return {
        success: false,
        error: { code: "PASSPORT_NOT_FOUND", message: "Passport not found" },
      };
    }
    return { success: true, data: passport };
  }

  async list(filters?: {
    assetType?: AssetType;
    status?: AssetStatus;
    ownerId?: string;
    origin?: string;
  }): Promise<ApiResponse<Asset[]>> {
    let assets = Array.from(this.assets.values());

    if (filters?.assetType)
      assets = assets.filter((a) => a.assetType === filters.assetType);
    if (filters?.status)
      assets = assets.filter((a) => a.status === filters.status);
    if (filters?.ownerId)
      assets = assets.filter((a) => a.ownerId === filters.ownerId);
    if (filters?.origin)
      assets = assets.filter((a) => a.origin === filters.origin);

    return { success: true, data: assets };
  }

  async transferOwnership(
    assetId: string,
    fromUserId: string,
    toUserId: string,
    transactionId?: string
  ): Promise<ApiResponse<Asset>> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      return {
        success: false,
        error: { code: "ASSET_NOT_FOUND", message: "Asset not found" },
      };
    }

    asset.ownerId = toUserId;
    asset.status = "DELIVERED";
    asset.updatedAt = new Date();

    // Update passport ownership
    const passport = Array.from(this.passports.values()).find(
      (p) => p.assetId === assetId
    );
    if (passport) {
      const event: OwnershipEvent = {
        id: crypto.randomUUID(),
        assetId,
        fromUserId,
        toUserId,
        eventType: "TRANSFERRED",
        transactionId,
        timestamp: new Date(),
      };
      passport.ownershipHistory.push(event);
      passport.updatedAt = new Date();
    }

    return { success: true, data: asset };
  }
}

// ─── LAB SERVICE ─────────────────────────────────────────

export class LabService {
  private labs: Map<string, Lab> = new Map();
  private requests: Map<string, AssayRequest> = new Map();

  async registerLab(data: Omit<Lab, "id" | "isActive" | "createdAt">): Promise<ApiResponse<Lab>> {
    const lab: Lab = {
      id: crypto.randomUUID(),
      ...data,
      isActive: true,
      createdAt: new Date(),
    };

    this.labs.set(lab.id, lab);
    return { success: true, data: lab };
  }

  async submitAssayRequest(data: {
    assetId: string;
    labId: string;
    requestedBy: string;
  }): Promise<ApiResponse<AssayRequest>> {
    const request: AssayRequest = {
      id: crypto.randomUUID(),
      ...data,
      status: "SUBMITTED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.requests.set(request.id, request);
    return { success: true, data: request };
  }

  async updateAssayStatus(
    requestId: string,
    status: AssayRequest["status"],
    data?: Partial<AssayRequest>
  ): Promise<ApiResponse<AssayRequest>> {
    const request = this.requests.get(requestId);
    if (!request) {
      return {
        success: false,
        error: { code: "REQUEST_NOT_FOUND", message: "Assay request not found" },
      };
    }

    request.status = status;
    if (data) {
      Object.assign(request, data);
    }
    request.updatedAt = new Date();

    return { success: true, data: request };
  }

  async issueResult(
    requestId: string,
    result: AssayResult,
    signedBy: string
  ): Promise<ApiResponse<AssayRequest>> {
    const request = this.requests.get(requestId);
    if (!request) {
      return {
        success: false,
        error: { code: "REQUEST_NOT_FOUND", message: "Assay request not found" },
      };
    }

    request.finalResult = {
      ...result,
      signedBy,
      signedAt: new Date(),
    };
    request.status = "RESULT_ISSUED";
    request.updatedAt = new Date();
    request.completedAt = new Date();

    return { success: true, data: request };
  }

  async getLabById(id: string): Promise<ApiResponse<Lab>> {
    const lab = this.labs.get(id);
    if (!lab) {
      return {
        success: false,
        error: { code: "LAB_NOT_FOUND", message: "Lab not found" },
      };
    }
    return { success: true, data: lab };
  }

  async listLabs(): Promise<ApiResponse<Lab[]>> {
    return {
      success: true,
      data: Array.from(this.labs.values()),
    };
  }

  async getRequestsByLab(labId: string): Promise<ApiResponse<AssayRequest[]>> {
    const requests = Array.from(this.requests.values()).filter(
      (r) => r.labId === labId
    );
    return { success: true, data: requests };
  }
}

// ─── MARKETPLACE SERVICE ────────────────────────────────

export class MarketplaceService {
  private offers: Map<string, Offer> = new Map();
  private negotiations: Map<string, Negotiation> = new Map();
  private transactions: Map<string, Transaction> = new Map();

  async createOffer(data: {
    assetId: string;
    sellerId: string;
    price: number;
    currency: string;
    quantity?: number;
    terms?: string;
    validUntil: Date;
  }): Promise<ApiResponse<Offer>> {
    const offer: Offer = {
      id: crypto.randomUUID(),
      ...data,
      status: "ACTIVE",
      createdAt: new Date(),
    };

    this.offers.set(offer.id, offer);
    return { success: true, data: offer };
  }

  async startNegotiation(
    offerId: string,
    buyerId: string,
    initialMessage?: string
  ): Promise<ApiResponse<Negotiation>> {
    const offer = this.offers.get(offerId);
    if (!offer) {
      return {
        success: false,
        error: { code: "OFFER_NOT_FOUND", message: "Offer not found" },
      };
    }

    const negotiation: Negotiation = {
      id: crypto.randomUUID(),
      offerId,
      buyerId,
      sellerId: offer.sellerId,
      messages: initialMessage
        ? [
            {
              id: crypto.randomUUID(),
              senderId: buyerId,
              type: "MESSAGE",
              message: initialMessage,
              timestamp: new Date(),
            },
          ]
        : [],
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.negotiations.set(negotiation.id, negotiation);
    offer.status = "MATCHED";

    return { success: true, data: negotiation };
  }

  async addNegotiationMessage(
    negotiationId: string,
    senderId: string,
    type: NegotiationMessage["type"],
    data: { price?: number; currency?: string; message?: string }
  ): Promise<ApiResponse<Negotiation>> {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) {
      return {
        success: false,
        error: { code: "NEGOTIATION_NOT_FOUND", message: "Negotiation not found" },
      };
    }

    const message: NegotiationMessage = {
      id: crypto.randomUUID(),
      senderId,
      type,
      ...data,
      timestamp: new Date(),
    };

    negotiation.messages.push(message);
    negotiation.updatedAt = new Date();

    if (type === "ACCEPTANCE") {
      negotiation.status = "AGREED";
      negotiation.finalPrice = data.price;
      negotiation.finalCurrency = data.currency;
    }

    return { success: true, data: negotiation };
  }

  async createTransaction(data: {
    offerId: string;
    negotiationId?: string;
    buyerId: string;
    sellerId: string;
    assetId: string;
    price: number;
    currency: string;
  }): Promise<ApiResponse<Transaction>> {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      ...data,
      status: "DRAFT",
      complianceStatus: "YELLOW",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);
    return { success: true, data: transaction };
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus
  ): Promise<ApiResponse<Transaction>> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return {
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Transaction not found",
        },
      };
    }

    transaction.status = status;
    transaction.updatedAt = new Date();

    if (status === "COMPLETED") {
      transaction.completedAt = new Date();
    }

    return { success: true, data: transaction };
  }

  async getActiveOffers(filters?: {
    assetType?: AssetType;
    minPrice?: number;
    maxPrice?: number;
    currency?: string;
  }): Promise<ApiResponse<Offer[]>> {
    let offers = Array.from(this.offers.values()).filter(
      (o) => o.status === "ACTIVE" && new Date(o.validUntil) > new Date()
    );

    if (filters?.minPrice)
      offers = offers.filter((o) => o.price >= filters.minPrice!);
    if (filters?.maxPrice)
      offers = offers.filter((o) => o.price <= filters.maxPrice!);
    if (filters?.currency)
      offers = offers.filter((o) => o.currency === filters.currency);

    return { success: true, data: offers };
  }

  async getTransactionsByUser(
    userId: string,
    role: "buyer" | "seller"
  ): Promise<ApiResponse<Transaction[]>> {
    const transactions = Array.from(this.transactions.values()).filter((t) =>
      role === "buyer" ? t.buyerId === userId : t.sellerId === userId
    );
    return { success: true, data: transactions };
  }
}

// ─── NEGOTIATION MESSAGE TYPE ────────────────────────────

interface NegotiationMessage {
  id: string;
  senderId: string;
  type: "OFFER" | "COUNTER_OFFER" | "MESSAGE" | "ACCEPTANCE" | "REJECTION";
  price?: number;
  currency?: string;
  message?: string;
  timestamp: Date;
}
