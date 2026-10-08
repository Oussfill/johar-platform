import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TrustVerification } from "./trust.entity";
import { TRUST_FACTORS } from "./dto/trust.dto";

@Injectable()
export class TrustService {
  constructor(
    @InjectRepository(TrustVerification) private verifications: Repository<TrustVerification>
  ) {}

  private isAdmin(user: any): boolean {
    return (
      user?.roles?.includes("SUPER_ADMIN") ||
      user?.roles?.includes("PLATFORM_ADMIN") ||
      user?.roles?.includes("TRUST_ADMIN")
    );
  }

  async apply(organizationId: string, factor: string, evidence: string | undefined, user: any): Promise<TrustVerification> {
    if (!TRUST_FACTORS.includes(factor as any)) {
      throw new BadRequestException(`factor must be one of ${TRUST_FACTORS.join(", ")}`);
    }
    if (
      !this.isAdmin(user) &&
      (!user.organizationId || user.organizationId !== organizationId)
    ) {
      throw new ForbiddenException("You can only submit trust verifications for your own organization");
    }
    const verification = this.verifications.create({ organizationId, factor, evidence });
    return this.verifications.save(verification);
  }

  async status(organizationId: string, user: any): Promise<any> {
    const list = await this.verifications.find({ where: { organizationId }, order: { createdAt: "DESC" } });
    const approved = new Set(list.filter((v) => v.status === "APPROVED").map((v) => v.factor));
    return {
      organizationId,
      trustLevel: approved.size,
      factors: TRUST_FACTORS.map((factor) => ({
        factor,
        status: approved.has(factor) ? "APPROVED" : list.some((v) => v.factor === factor) ? "PENDING" : "NOT_APPLIED",
      })),
      verifications: list,
    };
  }

  async review(organizationId: string, factor: string, decision: "APPROVED" | "REJECTED", user: any): Promise<TrustVerification> {
    if (!this.isAdmin(user)) throw new ForbiddenException("Trust admin access required");
    const verification = await this.verifications.findOne({
      where: { organizationId, factor, status: "PENDING" },
      order: { createdAt: "ASC" },
    });
    if (!verification) throw new NotFoundException("No pending verification found for this factor");
    verification.status = decision;
    verification.reviewedBy = user.id;
    verification.reviewedAt = new Date();
    return this.verifications.save(verification);
  }
}