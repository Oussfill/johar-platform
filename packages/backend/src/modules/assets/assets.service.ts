import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Asset, AssetEvent, DigitalPassport } from "./asset.entity";

const ASSET_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["REGISTERED"],
  REGISTERED: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["WEIGHED"],
  WEIGHED: ["ASSAY_PENDING"],
  ASSAY_PENDING: ["ASSAY_COMPLETED"],
  ASSAY_COMPLETED: ["VERIFIED"],
  VERIFIED: ["LISTED"],
  LISTED: ["RESERVED", "CANCELLED"],
  RESERVED: ["SOLD"],
  SOLD: ["IN_CUSTODY"],
  IN_CUSTODY: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["OWNERSHIP_TRANSFERRED"],
  OWNERSHIP_TRANSFERRED: ["RESOLD"],
};

const TYPE_PREFIX: Record<string, string> = {
  GOLD: "AU",
  SILVER: "AG",
  PLATINUM: "PT",
  PALLADIUM: "PD",
  DIAMOND: "DI",
  GEMSTONE: "GS",
  OTHER: "XX",
};

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset) private assetRepo: Repository<Asset>,
    @InjectRepository(AssetEvent) private eventRepo: Repository<AssetEvent>,
    @InjectRepository(DigitalPassport) private passportRepo: Repository<DigitalPassport>
  ) {}

  async generateJoharId(type: string, origin: string): Promise<string> {
    const prefix = TYPE_PREFIX[type] || "XX";
    const year = new Date().getFullYear();
    const originCode = (origin || "UNK").toUpperCase().slice(0, 3);

    const last = await this.assetRepo
      .createQueryBuilder("asset")
      .where("asset.joharId LIKE :pattern", {
        pattern: `JOHAR-${prefix}-${originCode}-${year}-%`,
      })
      .orderBy("asset.joharId", "DESC")
      .getOne();

    let seq = 1;
    if (last) {
      const parts = last.joharId.split("-");
      seq = parseInt(parts[4], 10) + 1;
    }

    return `JOHAR-${prefix}-${originCode}-${year}-${String(seq).padStart(6, "0")}`;
  }

  async validateId(joharId: string): Promise<boolean> {
    const regex = /^JOHAR-(AU|AG|PT|PD|DI|GS|XX)-[A-Z]{3}-\d{4}-\d{6}$/;
    return regex.test(joharId);
  }

  async parseId(joharId: string) {
    const parts = joharId.split("-");
    return {
      type: parts[1],
      origin: parts[2],
      year: parseInt(parts[3]),
      sequential: parseInt(parts[4]),
    };
  }

  async create(data: Partial<Asset>, actorId: string, organizationId?: string): Promise<Asset> {
    const joharId = await this.generateJoharId(
      data.type || "OTHER",
      data.origin || data.originCountry || "UNK"
    );

    const asset = this.assetRepo.create({
      ...data,
      joharId,
      ownerId: data.ownerId || actorId,
      currentLocationId: data.currentLocationId || organizationId || undefined,
      status: "REGISTERED",
    });

    const saved = await this.assetRepo.save(asset);

    await this.eventRepo.save({
      assetId: saved.id,
      eventType: "ASSET_REGISTERED",
      toState: "REGISTERED",
      actorId,
      metadata: { joharId: saved.joharId },
    });

    return saved;
  }

  async findById(id: string): Promise<Asset> {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException("Asset not found");
    return asset;
  }

  async findByJoharId(joharId: string): Promise<Asset> {
    const asset = await this.assetRepo.findOne({ where: { joharId } });
    if (!asset) throw new NotFoundException("Asset not found");
    return asset;
  }

  async findAll(
    page = 1,
    limit = 20,
    filters?: { type?: string; status?: string; ownerId?: string; organizationId?: string }
  ): Promise<{ data: Asset[]; total: number }> {
    const qb = this.assetRepo.createQueryBuilder("asset");

    if (filters?.type) qb.andWhere("asset.type = :type", { type: filters.type });
    if (filters?.status) qb.andWhere("asset.status = :status", { status: filters.status });
    if (filters?.ownerId) qb.andWhere("asset.ownerId = :ownerId", { ownerId: filters.ownerId });
    if (filters?.organizationId) qb.andWhere("asset.currentLocationId = :organizationId", { organizationId: filters.organizationId });

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("asset.createdAt", "DESC")
      .getMany();

    return { data, total };
  }

  async transitionStatus(
    id: string,
    newStatus: string,
    actorId: string
  ): Promise<Asset> {
    const asset = await this.findById(id);
    const allowed = ASSET_STATUS_TRANSITIONS[asset.status];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${asset.status} to ${newStatus}`
      );
    }

    const fromState = asset.status;
    asset.status = newStatus;
    const saved = await this.assetRepo.save(asset);

    await this.eventRepo.save({
      assetId: id,
      eventType: `STATUS_CHANGED`,
      fromState,
      toState: newStatus,
      actorId,
    });

    return saved;
  }

  async getEventHistory(assetId: string): Promise<AssetEvent[]> {
    return this.eventRepo.find({
      where: { assetId },
      order: { createdAt: "ASC" },
    });
  }

  async createPassport(assetId: string): Promise<DigitalPassport> {
    const asset = await this.findById(assetId);

    const lastPassport = await this.passportRepo.findOne({
      where: { assetId },
      order: { version: "DESC" },
    });

    const version = lastPassport ? lastPassport.version + 1 : 1;
    const verificationToken = crypto.randomUUID();

    const passport = this.passportRepo.create({
      assetId,
      version,
      verificationToken,
      status: "ACTIVE",
    });

    return this.passportRepo.save(passport);
  }

  async verifyPassport(verificationToken: string) {
    const passport = await this.passportRepo.findOne({
      where: { verificationToken },
      relations: ["asset"],
    });

    if (!passport) throw new NotFoundException("Passport not found");

    return {
      valid: passport.status === "ACTIVE",
      joharId: passport.asset.joharId,
      type: passport.asset.type,
      weight: passport.asset.weight,
      purity: passport.asset.purity,
      origin: passport.asset.origin,
      version: passport.version,
      verifiedAt: new Date().toISOString(),
    };
  }
}
