import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Listing, Offer, Negotiation, Transaction } from "./marketplace.entity";
import { Asset } from "../assets/asset.entity";

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectRepository(Listing) private listingRepo: Repository<Listing>,
    @InjectRepository(Offer) private offerRepo: Repository<Offer>,
    @InjectRepository(Negotiation) private negoRepo: Repository<Negotiation>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>
  ) {}

  async assertCanListAsset(assetId: string, user: any): Promise<void> {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException("Asset not found");
    if (user.roles?.includes("SUPER_ADMIN") || user.roles?.includes("PLATFORM_ADMIN")) return;
    if (asset.ownerId === user.id) return;
    if (asset.currentLocationId && asset.currentLocationId === user.organizationId) return;
    throw new ForbiddenException("You can only list assets you own");
  }

  async createListing(data: Partial<Listing>, sellerId: string): Promise<Listing> {
    const listing = this.listingRepo.create({ ...data, sellerId, status: "ACTIVE" });
    return this.listingRepo.save(listing);
  }

  async getListing(id: string): Promise<Listing> {
    const listing = await this.listingRepo.findOne({ where: { id }, relations: ["asset", "seller"] });
    if (!listing) throw new NotFoundException("Listing not found");
    return listing;
  }

  async getOfferById(id: string): Promise<Offer> {
    const offer = await this.offerRepo.findOne({ where: { id } });
    if (!offer) throw new NotFoundException("Offer not found");
    return offer;
  }

  async listActive(page = 1, limit = 20, organizationId?: string): Promise<{ data: Listing[]; total: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const where: any = { status: "ACTIVE" };
    if (organizationId) {
      where.asset = { currentLocationId: organizationId };
    }

    const [data, total] = await this.listingRepo.findAndCount({
      where,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      order: { createdAt: "DESC" },
      relations: ["asset"],
    });
    return { data, total };
  }

  async makeOffer(listingId: string, buyerId: string, amount: number, message?: string): Promise<Offer> {
    const listing = await this.getListing(listingId);
    if (listing.status !== "ACTIVE") throw new BadRequestException("Listing not active");
    if (listing.sellerId === buyerId) throw new BadRequestException("Cannot make offer on your own listing");

    if (amount <= 0) throw new BadRequestException("Offer amount must be positive");

    const existingOffer = await this.offerRepo.findOne({
      where: { listingId, buyerId, status: "PENDING" },
    });
    if (existingOffer) {
      throw new BadRequestException("You already have a pending offer on this listing");
    }

    const offer = this.offerRepo.create({
      listingId,
      buyerId,
      amount,
      currency: listing.currency,
      message,
      status: "PENDING",
    });
    return this.offerRepo.save(offer);
  }

  async acceptOffer(offerId: string): Promise<Transaction> {
    const result = await this.offerRepo.manager.transaction(async (tm) => {
      const offer = await tm.findOne(Offer, {
        where: { id: offerId },
        lock: { mode: "pessimistic_write" },
      });
      if (!offer) throw new NotFoundException("Offer not found");

      if (offer.status !== "PENDING") {
        throw new BadRequestException(`Offer is already ${offer.status}`);
      }

      const listing = await tm.findOne(Listing, {
        where: { id: offer.listingId },
        lock: { mode: "pessimistic_write" },
      });
      if (!listing) throw new NotFoundException("Listing not found");
      if (listing.status !== "ACTIVE") {
        throw new BadRequestException("Listing is no longer active");
      }

      offer.status = "ACCEPTED";
      await tm.save(Offer, offer);

      const otherOffers = await tm.find(Offer, {
        where: { listingId: offer.listingId, status: "PENDING" },
      });
      for (const other of otherOffers) {
        if (other.id !== offerId) {
          other.status = "CANCELLED";
          await tm.save(Offer, other);
        }
      }

      listing.status = "SOLD";
      await tm.save(Listing, listing);

      const tx = tm.create(Transaction, {
        listingId: offer.listingId,
        buyerId: offer.buyerId,
        sellerId: listing.sellerId,
        assetId: listing.assetId,
        amount: offer.amount,
        currency: offer.currency,
        offerId: offer.id,
        status: "INITIATED",
      });
      return tm.save(Transaction, tx);
    });

    this.logger.log(`Offer ${offerId} accepted, transaction ${result.id} created`);
    return result;
  }

  async startNegotiation(offerId: string, actorId: string, price: number, message?: string): Promise<Negotiation> {
    if (price <= 0) throw new BadRequestException("Price must be positive");

    const lastNego = await this.negoRepo.findOne({
      where: { offerId },
      order: { round: "DESC" },
    });

    const round = lastNego ? lastNego.round + 1 : 1;

    const nego = this.negoRepo.create({
      offerId,
      round,
      actorId,
      price,
      message,
      status: "PENDING",
    });
    return this.negoRepo.save(nego);
  }

  async getNegotiations(offerId: string): Promise<Negotiation[]> {
    return this.negoRepo.find({
      where: { offerId },
      order: { round: "ASC" },
      relations: ["actor"],
    });
  }

  async assertCanAccessOffer(offer: Offer, user: any): Promise<void> {
    if (user.roles?.includes("SUPER_ADMIN") || user.roles?.includes("PLATFORM_ADMIN")) return;
    const listing = await this.listingRepo.findOne({ where: { id: offer.listingId } });
    if (listing?.sellerId === user.id || offer.buyerId === user.id) return;
    throw new ForbiddenException("Access denied: you are not a participant in this offer");
  }

  async assertCanAccessTransaction(tx: Transaction, user: any): Promise<void> {
    if (user.roles?.includes("SUPER_ADMIN") || user.roles?.includes("PLATFORM_ADMIN")) return;
    if (tx.buyerId === user.id || tx.sellerId === user.id) return;
    if (user.roles?.includes("FINANCE_OFFICER") || user.roles?.includes("AUDITOR")) {
      const asset = await this.assetRepo.findOne({ where: { id: tx.assetId } });
      if (asset?.currentLocationId && asset.currentLocationId === user.organizationId) return;
    }
    throw new ForbiddenException("Access denied: you are not a participant in this transaction");
  }

  async getTransaction(id: string): Promise<Transaction> {
    const tx = await this.txRepo.findOne({ where: { id }, relations: ["asset", "buyer", "seller"] });
    if (!tx) throw new NotFoundException("Transaction not found");
    return tx;
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction> {
    const validTransitions: Record<string, string[]> = {
      INITIATED: ["PAYMENT_PENDING", "CANCELLED"],
      PAYMENT_PENDING: ["PAYMENT_RECEIVED", "CANCELLED"],
      PAYMENT_RECEIVED: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED", "DISPUTED"],
      DELIVERED: ["COMPLETED", "DISPUTED"],
      COMPLETED: [],
      CANCELLED: [],
      DISPUTED: ["COMPLETED", "CANCELLED"],
    };

    const tx = await this.getTransaction(id);
    const allowed = validTransitions[tx.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${tx.status} to ${status}. Allowed: ${allowed?.join(", ") || "none"}`
      );
    }

    tx.status = status;
    this.logger.log(`Transaction ${id} status: ${tx.status} -> ${status}`);
    return this.txRepo.save(tx);
  }
}
