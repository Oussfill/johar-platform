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
import { RbacService } from "./rbac.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";

@ApiTags("RBAC")
@Controller("rbac")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class RbacController {
  constructor(private rbacService: RbacService) {}

  @Get("roles")
  @ApiOperation({ summary: "List all roles" })
  @ApiResponse({ status: 200, description: "List of roles" })
  async findAllRoles(@CurrentUser() user: any) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN") &&
      !user.roles?.includes("ORG_ADMIN") &&
      !user.roles?.includes("ORG_OWNER")
    ) {
      throw new ForbiddenException("Admin access required");
    }
    return this.rbacService.findAllRoles(user);
  }

  @Post("roles")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create role" })
  @ApiResponse({ status: 201, description: "Role created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Super admin access required" })
  async createRole(
    @Body() body: { name: string; description?: string },
    @CurrentUser() user: any
  ) {
    if (!user.roles?.includes("SUPER_ADMIN")) {
      throw new ForbiddenException("Super admin access required");
    }
    return this.rbacService.createRole(body);
  }

  @Post("roles/:id/permissions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Assign permissions to role" })
  @ApiResponse({ status: 200, description: "Permissions assigned" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Super admin access required" })
  async assignPermissions(
    @Param("id") id: string,
    @Body() body: { permissions: string[] },
    @CurrentUser() user: any
  ) {
    if (!user.roles?.includes("SUPER_ADMIN")) {
      throw new ForbiddenException("Super admin access required");
    }
    return this.rbacService.assignPermissionsToRole(id, body.permissions);
  }

  @Get("permissions")
  @ApiOperation({ summary: "List all permissions" })
  @ApiResponse({ status: 200, description: "List of permissions" })
  async findAllPermissions(@CurrentUser() user: any) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN")
    ) {
      throw new ForbiddenException("Admin access required");
    }
    return this.rbacService.getAllPermissions();
  }

  @Post("users/:userId/roles")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Assign role to user" })
  @ApiResponse({ status: 201, description: "Role assigned" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async assignUserRole(
    @Param("userId") userId: string,
    @Body() body: { roleId: string; organizationId?: string },
    @CurrentUser() user: any
  ) {
    if (!user.roles?.includes("SUPER_ADMIN") && !user.roles?.includes("PLATFORM_ADMIN")) {
      throw new ForbiddenException("Admin access required");
    }
    return this.rbacService.assignRoleToUser(userId, body.roleId, user, body.organizationId);
  }

  @Get("users/:userId/roles")
  @ApiOperation({ summary: "Get user roles" })
  @ApiResponse({ status: 200, description: "User roles" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Access denied" })
  async getUserRoles(
    @Param("userId") userId: string,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN") &&
      user.id !== userId
    ) {
      throw new ForbiddenException("Access denied");
    }
    return this.rbacService.getUserRoles(userId);
  }

  @Get("users/:userId/permissions")
  @ApiOperation({ summary: "Get user permissions" })
  @ApiResponse({ status: 200, description: "User permissions" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Access denied" })
  async getUserPermissions(
    @Param("userId") userId: string,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN") &&
      user.id !== userId
    ) {
      throw new ForbiddenException("Access denied");
    }
    return this.rbacService.getUserPermissions(userId);
  }

  @Post("seed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Seed roles and permissions" })
  @ApiResponse({ status: 200, description: "Roles and permissions seeded" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Super admin access required" })
  async seed(@CurrentUser() user: any) {
    if (!user.roles?.includes("SUPER_ADMIN")) {
      throw new ForbiddenException("Super admin access required");
    }
    await this.rbacService.seedRolesAndPermissions();
    return { success: true };
  }
}
