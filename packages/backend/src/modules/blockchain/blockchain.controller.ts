import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { BlockchainService } from "./blockchain.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";

@ApiTags("Blockchain")
@Controller("blockchain")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class BlockchainController {
  constructor(private blockchainService: BlockchainService) {}

  @Post("events")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Record blockchain event" })
  @ApiResponse({ status: 201, description: "Event recorded" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async recordEvent(
    @Body() body: {
      eventType: string;
      entityType: string;
      entityId: string;
      assetId?: string;
      metadata?: Record<string, any>;
    },
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN")
    ) {
      throw new ForbiddenException("Admin access required");
    }
    return this.blockchainService.recordEvent(body);
  }

  @Get("events/:id/verify")
  @ApiOperation({ summary: "Verify blockchain evidence" })
  @ApiResponse({ status: 200, description: "Verification result" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async verify(@Param("id") id: string, @CurrentUser() user: any) {
    return this.blockchainService.verifyEvidence(id, user);
  }

  @Get("entity/:type/:id")
  @ApiOperation({ summary: "Get events by entity" })
  @ApiResponse({ status: 200, description: "List of blockchain events" })
  async getByEntity(
    @Param("type") type: string,
    @Param("id") id: string,
    @CurrentUser() user: any
  ) {
    return this.blockchainService.getEventsByEntity(type, id, user);
  }

  @Get("asset/:assetId")
  @ApiOperation({ summary: "Get events by asset" })
  @ApiResponse({ status: 200, description: "List of blockchain events" })
  async getByAsset(@Param("assetId") assetId: string, @CurrentUser() user: any) {
    return this.blockchainService.getEventsByAsset(assetId, user);
  }
}
