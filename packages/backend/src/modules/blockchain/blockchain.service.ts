import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BlockchainEvent } from "./blockchain.entity";
import { Asset } from "../assets/asset.entity";
import * as crypto from "crypto";

@Injectable()
export class BlockchainService {
  constructor(
    @InjectRepository(BlockchainEvent) private eventRepo: Repository<BlockchainEvent>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>
  ) {}

  private isGlobalAdmin(user: any): boolean {
    return user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
  }

  private async assertCanAccessAsset(assetId: string, user: any): Promise<void> {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException("Asset not found");
    if (this.isGlobalAdmin(user)) return;
    if (asset.ownerId === user?.id) return;
    if (asset.currentLocationId && asset.currentLocationId === user?.organizationId) return;
    throw new ForbiddenException("Access denied: you do not have access to this asset");
  }

  async recordEvent(data: {
    eventType: string;
    entityType: string;
    entityId: string;
    assetId?: string;
    metadata?: Record<string, any>;
  }): Promise<BlockchainEvent> {
    const contentHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");

    const event = this.eventRepo.create({
      eventType: data.eventType,
      entityType: data.entityType,
      entityId: data.entityId,
      assetId: data.assetId,
      metadata: data.metadata || null,
      contentHash,
      confirmationStatus: "PENDING",
      network: process.env.BLOCKCHAIN_NETWORK || "development",
    });

    return this.eventRepo.save(event);
  }

  async getEventsByEntity(
    entityType: string,
    entityId: string,
    user: any
  ): Promise<BlockchainEvent[]> {
    if (entityType === "asset") {
      await this.assertCanAccessAsset(entityId, user);
    } else if (entityType === "user") {
      if (!this.isGlobalAdmin(user) && user?.id !== entityId) {
        throw new ForbiddenException("Access denied");
      }
    } else if (!this.isGlobalAdmin(user)) {
      throw new ForbiddenException("Access denied");
    }

    return this.eventRepo.find({
      where: { entityType, entityId },
      order: { createdAt: "ASC" },
    });
  }

  async getEventsByAsset(assetId: string, user: any): Promise<BlockchainEvent[]> {
    await this.assertCanAccessAsset(assetId, user);
    return this.eventRepo.find({
      where: { assetId },
      order: { createdAt: "ASC" },
    });
  }

  async verifyEvidence(
    id: string,
    user: any
  ): Promise<{
    valid: boolean;
    event: BlockchainEvent;
    verifiedAt: string;
  }> {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException("Blockchain event not found");

    if (event.assetId) {
      await this.assertCanAccessAsset(event.assetId, user);
    } else if (!this.isGlobalAdmin(user)) {
      throw new ForbiddenException("Access denied");
    }

    return {
      valid: event.confirmationStatus === "CONFIRMED",
      event,
      verifiedAt: new Date().toISOString(),
    };
  }

  async getAuditTrail(entityType: string, entityId: string, user: any): Promise<BlockchainEvent[]> {
    return this.getEventsByEntity(entityType, entityId, user);
  }
}