import { Controller, Get, Post, Param, Body, UseGuards, ForbiddenException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { TrustService } from "./trust.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ApplyTrustDto } from "./dto/trust.dto";

@ApiTags("Trust")
@Controller("trust")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrustController {
  constructor(private trustService: TrustService) {}

  @Get("status")
  @ApiOperation({ summary: "Trust status for caller's organization" })
  async status(@CurrentUser() user: any) {
    if (!user?.organizationId) {
      return { organizationId: null, trustLevel: 0, factors: [], verifications: [] };
    }
    return this.trustService.status(user.organizationId, user);
  }

  @Post("apply")
  @ApiOperation({ summary: "Submit trust factor verification for caller's organization" })
  async apply(@Body() dto: ApplyTrustDto, @CurrentUser() user: any) {
    if (!user?.organizationId) throw new ForbiddenException("Organization context required");
    return this.trustService.apply(user.organizationId, dto.factor, dto.evidence, user);
  }

  @Post(":orgId/factors/:factor/approve")
  @ApiOperation({ summary: "Approve trust factor (trust admin)" })
  async approve(@Param("orgId") orgId: string, @Param("factor") factor: string, @CurrentUser() user: any) {
    return this.trustService.review(orgId, factor, "APPROVED", user);
  }

  @Post(":orgId/factors/:factor/reject")
  @ApiOperation({ summary: "Reject trust factor (trust admin)" })
  async reject(@Param("orgId") orgId: string, @Param("factor") factor: string, @CurrentUser() user: any) {
    return this.trustService.review(orgId, factor, "REJECTED", user);
  }
}