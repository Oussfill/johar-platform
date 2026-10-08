import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Asset } from "../assets/asset.entity";
import { Listing, Transaction } from "../marketplace/marketplace.entity";
import { User } from "../users/user.entity";
import { AuditLog } from "../audit/audit.entity";
import { BlockchainEvent } from "../blockchain/blockchain.entity";

@Injectable()
export class ControlCenterService {
  constructor(
    @InjectRepository(Asset) private assets: Repository<Asset>,
    @InjectRepository(Listing) private listings: Repository<Listing>,
    @InjectRepository(Transaction) private transactions: Repository<Transaction>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(AuditLog) private audit: Repository<AuditLog>,
    @InjectRepository(BlockchainEvent) private blockchain: Repository<BlockchainEvent>
  ) {}

  async summary(): Promise<any> {
    const [assets, listings, transactions, users, auditCount] = await Promise.all([
      this.assets.count(),
      this.listings.count(),
      this.transactions.count(),
      this.users.count(),
      this.audit.count(),
    ]);
    const totalWeight = await this.assets
      .createQueryBuilder("asset")
      .select("COALESCE(SUM(asset.weight), 0)", "total")
      .getRawOne();
    return { assets, listings, transactions, users, auditEvents: auditCount, totalWeightGrams: Number(totalWeight?.total ?? 0) };
  }

  async liveTransactions(limit = 20): Promise<Transaction[]> {
    return this.transactions.find({ order: { createdAt: "DESC" }, take: limit });
  }

  async riskMonitor(): Promise<any> {
    const byAction = await this.audit
      .createQueryBuilder("a")
      .select("a.action", "action")
      .addSelect("COUNT(*)", "count")
      .groupBy("a.action")
      .getRawMany();
    const recentSuspicious = await this.audit
      .createQueryBuilder("a")
      .where("a.action ILIKE :pattern", { pattern: "%FAIL%" })
      .orderBy("a.createdAt", "DESC")
      .take(10)
      .getMany();
    return { byAction, recentSuspicious };
  }

  async tradeOverview(): Promise<any> {
    const listingsByStatus = await this.listings
      .createQueryBuilder("l")
      .select("l.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("l.status")
      .getRawMany();
    const revenue = await this.transactions
      .createQueryBuilder("t")
      .select("COALESCE(SUM(t.amount), 0)", "total")
      .where("t.status = :status", { status: "COMPLETED" })
      .getRawOne();
    return { listingsByStatus, completedRevenue: Number(revenue?.total ?? 0) };
  }

  async blockchainEvents(limit = 20): Promise<BlockchainEvent[]> {
    return this.blockchain.find({ order: { createdAt: "DESC" }, take: limit });
  }
}