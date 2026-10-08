import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Laboratory, AssayRequest, AssayResult } from "./lab.entity";
import { Asset } from "../assets/asset.entity";

@Injectable()
export class LabsService {
  constructor(
    @InjectRepository(Laboratory) private labRepo: Repository<Laboratory>,
    @InjectRepository(AssayRequest) private requestRepo: Repository<AssayRequest>,
    @InjectRepository(AssayResult) private resultRepo: Repository<AssayResult>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>
  ) {}

  private isGlobalAdmin(user: any): boolean {
    return user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
  }

  private isLabStaff(user: any): boolean {
    return (
      user?.roles?.includes("LAB_MANAGER") || user?.roles?.includes("LAB_TECHNICIAN")
    );
  }

  async assertCanAccessAsset(assetId: string, user: any): Promise<void> {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException("Asset not found");
    if (this.isGlobalAdmin(user)) return;
    if (asset.ownerId === user.id) return;
    if (asset.currentLocationId && asset.currentLocationId === user.organizationId) return;
    throw new ForbiddenException("Access denied: you do not have access to this asset");
  }

  async assertCanAccessRequest(request: AssayRequest, user: any): Promise<void> {
    if (this.isGlobalAdmin(user)) return;
    if (request.requestedBy === user.id) return;
    if (this.isLabStaff(user)) {
      const asset = await this.assetRepo.findOne({ where: { id: request.assetId } });
      if (asset?.currentLocationId && asset.currentLocationId === user.organizationId) {
        return;
      }
    }
    throw new ForbiddenException("Access denied: you are not the requester of this assay");
  }

  private async assertCanWriteAssay(
    assetId: string,
    requestedBy: string,
    user: any
  ): Promise<void> {
    if (this.isGlobalAdmin(user)) return;
    if (requestedBy === user.id) return;

    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException("Asset not found");

    if (this.isLabStaff(user)) {
      if (asset.currentLocationId && asset.currentLocationId === user.organizationId) {
        return;
      }
      throw new ForbiddenException(
        "Access denied: this assay belongs to another organization"
      );
    }

    if (asset.ownerId === user.id) return;
    if (asset.currentLocationId && asset.currentLocationId === user.organizationId) return;

    throw new ForbiddenException("Access denied: you cannot write to this assay");
  }

  async createLab(data: Partial<Laboratory>): Promise<Laboratory> {
    const lab = this.labRepo.create(data);
    return this.labRepo.save(lab);
  }

  async findAllLabs(): Promise<Laboratory[]> {
    return this.labRepo.find({ where: { status: "ACTIVE" } });
  }

  async submitAssayRequest(data: Partial<AssayRequest>, requestedBy: string, user: any): Promise<AssayRequest> {
    if (data.assetId) {
      await this.assertCanAccessAsset(data.assetId, user);
    }
    const request = this.requestRepo.create({ ...data, requestedBy, status: "PENDING" });
    return this.requestRepo.save(request);
  }

  async getAssayRequest(id: string): Promise<AssayRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ["asset", "laboratory"],
    });
    if (!request) throw new NotFoundException("Assay request not found");
    return request;
  }

  async issueResult(requestId: string, result: Partial<AssayResult>, user: any): Promise<AssayResult> {
    const request = await this.getAssayRequest(requestId);
    await this.assertCanWriteAssay(request.assetId, request.requestedBy, user);

    const assayResult = this.resultRepo.create({
      ...result,
      assayRequestId: requestId,
      performedBy: user.id,
      status: "DRAFT",
    });

    request.status = "COMPLETED";
    await this.requestRepo.save(request);

    return this.resultRepo.save(assayResult);
  }

  async approveResult(resultId: string, user: any): Promise<AssayResult> {
    const result = await this.resultRepo.findOne({ where: { id: resultId } });
    if (!result) throw new NotFoundException("Result not found");

    const request = await this.getAssayRequest(result.assayRequestId);
    await this.assertCanWriteAssay(request.assetId, request.requestedBy, user);

    result.status = "FINAL";
    result.approvedBy = user.id;
    return this.resultRepo.save(result);
  }

  async getResultsByAsset(assetId: string): Promise<AssayResult[]> {
    const requests = await this.requestRepo.find({ where: { assetId } });
    const requestIds = requests.map((r) => r.id);
    if (requestIds.length === 0) return [];
    return this.resultRepo.find({ where: { assayRequestId: In(requestIds) } });
  }
}