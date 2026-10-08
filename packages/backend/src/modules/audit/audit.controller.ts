import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";

@ApiTags("Audit")
@Controller("audit")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get("logs")
  @ApiOperation({ summary: "Get audit logs" })
  @ApiResponse({ status: 200, description: "Paginated audit logs" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Auditor access required" })
  async getLogs(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "50",
    @Query("resource") resource?: string,
    @Query("action") action?: string,
    @CurrentUser() user?: any
  ) {
    if (
      !user?.roles?.includes("SUPER_ADMIN") &&
      !user?.roles?.includes("PLATFORM_ADMIN") &&
      !user?.roles?.includes("AUDITOR")
    ) {
      throw new ForbiddenException("Auditor access required");
    }
    const isGlobal =
      user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
    return this.auditService.getAuditLogs(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 50,
      { resource, action },
      isGlobal ? undefined : user?.organizationId
    );
  }

  @Get("notifications")
  @ApiOperation({ summary: "Get notifications" })
  @ApiResponse({ status: 200, description: "List of notifications" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async getNotifications(
    @Query("unreadOnly") unreadOnly?: string,
    @CurrentUser("id") userId?: string
  ) {
    if (!userId) return [];
    return this.auditService.getNotifications(
      userId,
      unreadOnly === "true"
    );
  }

  @Post("notifications/:id/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async markRead(
    @Param("id") id: string,
    @CurrentUser("id") userId?: string
  ) {
    await this.auditService.markNotificationRead(id, userId);
    return { success: true };
  }
}
