import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { KycProfile, KycDocument, ComplianceCheck } from "../kyc/kyc.entity";
import { OrganizationMember } from "../organizations/organization-member.entity";
import { Asset } from "../assets/asset.entity";

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(KycProfile) private kycRepo: Repository<KycProfile>,
    @InjectRepository(KycDocument) private docRepo: Repository<KycDocument>,
    @InjectRepository(ComplianceCheck) private checkRepo: Repository<ComplianceCheck>,
    @InjectRepository(OrganizationMember) private memberRepo: Repository<OrganizationMember>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>
  ) {}

  private isGlobalAdmin(user: any): boolean {
    return user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
  }

  private getUserOrganizationId(userId: string): Promise<string | undefined> {
    return this.memberRepo
      .findOne({ where: { userId } })
      .then((member) => member?.organizationId);
  }

  private async assetOrganizationId(assetId: string): Promise<string | undefined> {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    return asset?.currentLocationId;
  }

  private async resolveEntityOrganization(
    entityType: string,
    entityId: string
  ): Promise<string | undefined> {
    if (entityType === "organization") return entityId;
    if (entityType === "user") return this.getUserOrganizationId(entityId);
    if (entityType === "asset") return this.assetOrganizationId(entityId);
    return undefined;
  }

  private async assertEntityInScope(
    entityType: string,
    entityId: string,
    user: any
  ): Promise<void> {
    if (this.isGlobalAdmin(user)) return;
    const orgId = await this.resolveEntityOrganization(entityType, entityId);
    if (orgId && user.organizationId && orgId === user.organizationId) return;
    throw new ForbiddenException(
      "Access denied: compliance entity is outside your organization"
    );
  }

  async submitKYC(userId: string, data: Partial<KycProfile>): Promise<KycProfile> {
    const profile = this.kycRepo.create({
      ...data,
      userId,
      status: "PENDING",
      level: data.level || "L1",
    });
    return this.kycRepo.save(profile);
  }

  async getKYCProfile(id: string): Promise<KycProfile> {
    const profile = await this.kycRepo.findOne({ where: { id }, relations: ["user"] });
    if (!profile) throw new NotFoundException("KYC profile not found");
    return profile;
  }

  async reviewKYC(id: string, status: string, reviewedBy: string, user: any, reason?: string): Promise<KycProfile> {
    const profile = await this.getKYCProfile(id);
    await this.assertEntityInScope("user", profile.userId, user);
    profile.status = status;
    profile.reviewedBy = reviewedBy;
    profile.reviewedAt = new Date();
    if (reason) profile.rejectionReason = reason;
    return this.kycRepo.save(profile);
  }

  async submitDocument(kycProfileId: string, data: Partial<KycDocument>, user: any): Promise<KycDocument> {
    const profile = await this.getKYCProfile(kycProfileId);

    if (!this.isGlobalAdmin(user)) {
      if (profile.userId === user.id) {
        // owners may submit their own documents
      } else if (
        (user?.roles?.includes("KYC_OFFICER") || user?.roles?.includes("KYC_ANALYST")) &&
        user.organizationId
      ) {
        const profileOrg = await this.getUserOrganizationId(profile.userId);
        if (profileOrg !== user.organizationId) {
          throw new ForbiddenException("Access denied: cross-organization document submission");
        }
      } else {
        throw new ForbiddenException("Access denied");
      }
    }

    const doc = this.docRepo.create({ ...data, kycProfileId, status: "PENDING" });
    return this.docRepo.save(doc);
  }

  async runComplianceCheck(
    entityType: string,
    entityId: string,
    checkType: string,
    user: any
  ): Promise<ComplianceCheck> {
    await this.assertEntityInScope(entityType, entityId, user);
    const check = this.checkRepo.create({
      entityType,
      entityId,
      checkType,
      status: "PENDING",
      riskLevel: "LOW",
      performedBy: user.id,
    });
    return this.checkRepo.save(check);
  }

  async resolveCheck(checkId: string, status: string, riskLevel: string, user: any, result?: string): Promise<ComplianceCheck> {
    const check = await this.checkRepo.findOne({ where: { id: checkId } });
    if (!check) throw new NotFoundException("Check not found");
    await this.assertEntityInScope(check.entityType, check.entityId, user);

    check.status = status;
    check.riskLevel = riskLevel;
    if (result) check.result = result;
    return this.checkRepo.save(check);
  }

  async getChecksByEntity(entityType: string, entityId: string): Promise<ComplianceCheck[]> {
    return this.checkRepo.find({ where: { entityType, entityId } });
  }

  async listPendingChecks(user: any): Promise<ComplianceCheck[]> {
    const pending = await this.checkRepo.find({
      where: { status: "PENDING" },
      order: { createdAt: "ASC" },
    });

    if (this.isGlobalAdmin(user)) return pending;

    const scoped = [];
    for (const check of pending) {
      const orgId = await this.resolveEntityOrganization(check.entityType, check.entityId);
      if (orgId && user.organizationId && orgId === user.organizationId) {
        scoped.push(check);
      }
    }
    return scoped;
  }
}