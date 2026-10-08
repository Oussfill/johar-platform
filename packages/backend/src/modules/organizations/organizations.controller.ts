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
import { OrganizationsService } from "./organizations.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";
import { CreateOrganizationDto, AddMemberDto } from "./dto/organization.dto";

@ApiTags("Organizations")
@Controller("organizations")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create organization" })
  @ApiResponse({ status: 201, description: "Organization created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser("id") userId: string
  ) {
    const org = await this.orgsService.create(dto);
    await this.orgsService.addMember(org.id, userId, "OWNER");
    return org;
  }

  @Get()
  @ApiOperation({ summary: "List organizations" })
  @ApiResponse({ status: 200, description: "List of organizations" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async findAll(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @CurrentUser() user: any
  ) {
    if (user.roles?.includes("SUPER_ADMIN") || user.roles?.includes("PLATFORM_ADMIN")) {
      return this.orgsService.findAll(+page, +limit);
    }
    return this.orgsService.findByUser(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get organization" })
  @ApiResponse({ status: 200, description: "Organization found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    const org = await this.orgsService.findById(id);
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN")
    ) {
      const members = await this.orgsService.getMembers(id);
      const isMember = members.some((m) => m.userId === user.id);
      if (!isMember) throw new ForbiddenException("Access denied");
    }
    return org;
  }

  @Post(":id/members")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add member to organization" })
  @ApiResponse({ status: 201, description: "Member added" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Owner access required" })
  async addMember(
    @Param("id") id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN")
    ) {
      const members = await this.orgsService.getMembers(id);
      const ownerMember = members.find(
        (m) => m.userId === user.id && m.role === "OWNER"
      );
      if (!ownerMember) throw new ForbiddenException("Owner access required");
    }
    return this.orgsService.addMember(id, dto.userId, dto.role);
  }

  @Get(":id/members")
  @ApiOperation({ summary: "List organization members" })
  @ApiResponse({ status: 200, description: "List of members" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Access denied" })
  async getMembers(
    @Param("id") id: string,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN")
    ) {
      const members = await this.orgsService.getMembers(id);
      const isMember = members.some((m) => m.userId === user.id);
      if (!isMember) throw new ForbiddenException("Access denied");
    }
    return this.orgsService.getMembers(id);
  }
}
