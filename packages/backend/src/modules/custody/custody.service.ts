import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustodyVault, CustodyTransferRequest } from "./custody.entity";
import { Asset } from "../assets/asset.entity";
import { User } from "../users/user.entity";

@Injectable()
export class CustodyService {
  constructor(
    @InjectRepository(CustodyVault) private vaults: Repository<CustodyVault>,
    @InjectRepository(CustodyTransferRequest) private transfers: Repository<CustodyTransferRequest>,
    @InjectRepository(Asset) private assets: Repository<Asset>
  ) {}

  private isGlobalAdmin(user: any): boolean {
    return user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
  }

  private orgFor(user: any): string {
    if (user?.organizationId) return user.organizationId;
    throw new ForbiddenException("Organization context required");
  }

  private scope(user: any): Record<string, string> {
    if (this.isGlobalAdmin(user)) return {};
    return { organizationId: this.orgFor(user) };
  }

  private async assertScope(user: any, organizationId: string): Promise<void> {
    if (this.isGlobalAdmin(user)) return;
    if (user.organizationId && user.organizationId === organizationId) return;
    throw new ForbiddenException("Access denied: cross-organization access prohibited");
  }

  private async assertVisibleAsset(user: any, asset: Asset): Promise<void> {
    if (this.isGlobalAdmin(user)) return;
    if (asset.ownerId === user.id) return;
    if (asset.currentLocationId && asset.currentLocationId === user.organizationId) return;
    throw new ForbiddenException("Access denied: asset not under your organization");
  }

  // ---- Vaults ----
  async createVault(dto: any, user: any): Promise<CustodyVault> {
    const vault = this.vaults.create({ ...dto, organizationId: this.orgFor(user) } as CustodyVault);
    return this.vaults.save(vault);
  }

  async findAllVaults(user: any): Promise<CustodyVault[]> {
    return this.vaults.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  // ---- Transfers (four-eyes) ----
  async createTransferRequest(dto: any, user: any): Promise<CustodyTransferRequest> {
    const asset = await this.assets.findOne({ where: { id: dto.assetId } });
    if (!asset) throw new NotFoundException("Asset not found");
    await this.assertVisibleAsset(user, asset);

    const fromVault = await this.vaults.findOne({ where: { id: dto.fromVaultId } });
    if (!fromVault) throw new NotFoundException("Source vault not found");
    await this.assertScope(user, fromVault.organizationId);

    const toVault = await this.vaults.findOne({ where: { id: dto.toVaultId } });
    if (!toVault) throw new NotFoundException("Destination vault not found");
    await this.assertScope(user, toVault.organizationId);

    if (dto.fromVaultId === dto.toVaultId) {
      throw new BadRequestException("Source and destination vaults must differ");
    }

    const transfer = this.transfers.create({
      assetId: asset.id,
      organizationId: fromVault.organizationId,
      requesterId: user.id,
      fromVaultId: fromVault.id,
      toVaultId: toVault.id,
      reason: dto.reason,
      requiresDualAuth: dto.requiresDualAuth ?? asset.currentLocationId === user.organizationId,
    });
    return this.transfers.save(transfer);
  }

  async pendingApprovals(user: any): Promise<CustodyTransferRequest[]> {
    return this.transfers.find({
      where: { status: "PENDING", ...this.scope(user) },
      order: { createdAt: "ASC" },
    });
  }

  async approveTransfer(id: string, user: any): Promise<CustodyTransferRequest> {
    const transfer = await this.transfers.findOne({ where: { id } });
    if (!transfer) throw new NotFoundException("Transfer request not found");
    await this.assertScope(user, transfer.organizationId);

    if (transfer.status !== "PENDING") {
      throw new BadRequestException("Only PENDING transfers can be approved");
    }
    if (transfer.requesterId === user.id) {
      throw new ForbiddenException(
        "Four-eyes principle: the requester cannot approve their own transfer"
      );
    }
    if (transfer.requiresDualAuth && !transfer.approverId) {
      transfer.approverId = user.id;
      transfer.approvedAt = new Date();
      return this.transfers.save(transfer);
    }

    // Single approval sufficient (or second approval completes the dual-auth)
    transfer.status = "APPROVED";
    transfer.approverId = user.id;
    transfer.approvedAt = new Date();
    return this.transfers.save(transfer);
  }

  async rejectTransfer(id: string, user: any): Promise<CustodyTransferRequest> {
    const transfer = await this.transfers.findOne({ where: { id } });
    if (!transfer) throw new NotFoundException("Transfer request not found");
    await this.assertScope(user, transfer.organizationId);
    if (transfer.status !== "PENDING") {
      throw new BadRequestException("Only PENDING transfers can be rejected");
    }
    if (transfer.requesterId === user.id) {
      throw new ForbiddenException("The requester cannot reject their own transfer");
    }
    transfer.status = "REJECTED";
    transfer.approverId = user.id;
    transfer.approvedAt = new Date();
    return this.transfers.save(transfer);
  }
}