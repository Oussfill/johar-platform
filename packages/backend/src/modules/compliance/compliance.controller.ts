import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { ComplianceService } from "./compliance.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";
import {
  SubmitKycDto,
  ReviewKycDto,
  SubmitKycDocumentDto,
  RunComplianceCheckDto,
  ResolveCheckDto,
} from "./dto/compliance.dto";

@ApiTags("Compliance")
@Controller("compliance")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  private isGlobalAdmin(user: any): boolean {
    return user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
  }

  @Post("kyc")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Submit KYC" })
  @ApiResponse({ status: 201, description: "KYC profile created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async submitKYC(
    @Body() dto: SubmitKycDto,
    @CurrentUser("id") userId: string
  ) {
    return this.complianceService.submitKYC(userId, dto);
  }

  @Get("kyc/:id")
  @ApiOperation({ summary: "Get KYC profile" })
  @ApiResponse({ status: 200, description: "KYC profile found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "KYC profile not found" })
  async getKYC(
    @Param("id") id: string,
    @CurrentUser() user: any
  ) {
    const profile = await this.complianceService.getKYCProfile(id);
    if (!this.isGlobalAdmin(user) && profile.userId !== user.id) {
      if (
        user.roles?.includes("KYC_OFFICER") ||
        user.roles?.includes("KYC_ANALYST")
      ) {
        if (!profile.organizationId || user.organizationId !== profile.organizationId) {
          throw new ForbiddenException("Access denied");
        }
      } else {
        throw new ForbiddenException("Access denied");
      }
    }
    return profile;
  }

  @Post("kyc/:id/review")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Review KYC" })
  @ApiResponse({ status: 200, description: "KYC reviewed" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Compliance officer access required" })
  @ApiResponse({ status: 404, description: "KYC profile not found" })
  async reviewKYC(
    @Param("id") id: string,
    @Body() dto: ReviewKycDto,
    @CurrentUser() user: any
  ) {
    if (this.isGlobalAdmin(user)) {
      // allowed
    } else if (
      user.roles?.includes("KYC_OFFICER") ||
      user.roles?.includes("COMPLIANCE_OFFICER")
    ) {
      // org scoping is enforced inside the service
    } else {
      throw new ForbiddenException("Compliance officer access required");
    }
    return this.complianceService.reviewKYC(id, dto.status, user.id, user, dto.reason);
  }

  @Post("kyc/:id/documents")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Submit KYC document" })
  @ApiResponse({ status: 201, description: "Document submitted" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async submitDocument(
    @Param("id") id: string,
    @Body() dto: SubmitKycDocumentDto,
    @CurrentUser() user: any
  ) {
    return this.complianceService.submitDocument(id, dto, user);
  }

  @Post("checks")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Run compliance check" })
  @ApiResponse({ status: 201, description: "Check completed" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Compliance officer access required" })
  async runCheck(
    @Body() dto: RunComplianceCheckDto,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN") &&
      !user.roles?.includes("COMPLIANCE_OFFICER") &&
      !user.roles?.includes("KYC_OFFICER")
    ) {
      throw new ForbiddenException("Compliance officer access required");
    }
    return this.complianceService.runComplianceCheck(
      dto.entityType,
      dto.entityId,
      dto.checkType,
      user
    );
  }

  @Post("checks/:id/resolve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resolve compliance check" })
  @ApiResponse({ status: 200, description: "Check resolved" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Compliance officer access required" })
  @ApiResponse({ status: 404, description: "Check not found" })
  async resolveCheck(
    @Param("id") id: string,
    @Body() dto: ResolveCheckDto,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN") &&
      !user.roles?.includes("COMPLIANCE_OFFICER")
    ) {
      throw new ForbiddenException("Compliance officer access required");
    }
    return this.complianceService.resolveCheck(
      id,
      dto.status,
      dto.riskLevel,
      user,
      dto.result
    );
  }

  @Get("checks/pending")
  @ApiOperation({ summary: "List pending checks" })
  @ApiResponse({ status: 200, description: "List of pending checks" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Compliance officer access required" })
  async listPending(@CurrentUser() user: any) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN") &&
      !user.roles?.includes("COMPLIANCE_OFFICER") &&
      !user.roles?.includes("KYC_OFFICER")
    ) {
      throw new ForbiddenException("Compliance officer access required");
    }
    return this.complianceService.listPendingChecks(user);
  }
}
