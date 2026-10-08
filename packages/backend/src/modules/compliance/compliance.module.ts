import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KycProfile, KycDocument, ComplianceCheck } from "../kyc/kyc.entity";
import { OrganizationMember } from "../organizations/organization-member.entity";
import { Asset } from "../assets/asset.entity";
import { ComplianceService } from "./compliance.service";
import { ComplianceController } from "./compliance.controller";

@Module({
  imports: [TypeOrmModule.forFeature([KycProfile, KycDocument, ComplianceCheck, OrganizationMember, Asset])],
  providers: [ComplianceService],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}
