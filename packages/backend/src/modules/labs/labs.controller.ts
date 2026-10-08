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
import { LabsService } from "./labs.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";
import {
  CreateLabDto,
  SubmitAssayRequestDto,
  IssueAssayResultDto,
} from "./dto/lab.dto";

@ApiTags("Labs")
@Controller("labs")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class LabsController {
  constructor(private labsService: LabsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register laboratory" })
  @ApiResponse({ status: 201, description: "Lab registered" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async createLab(
    @Body() dto: CreateLabDto,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN")
    ) {
      throw new ForbiddenException("Admin access required");
    }
    return this.labsService.createLab(dto);
  }

  @Get()
  @ApiOperation({ summary: "List laboratories" })
  @ApiResponse({ status: 200, description: "List of labs" })
  async findAll() {
    return this.labsService.findAllLabs();
  }

  @Post("assay-requests")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Submit assay request" })
  @ApiResponse({ status: 201, description: "Assay request submitted" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async submitRequest(
    @Body() dto: SubmitAssayRequestDto,
    @CurrentUser() user: any
  ) {
    return this.labsService.submitAssayRequest(dto, user.id, user);
  }

  @Get("assay-requests/:id")
  @ApiOperation({ summary: "Get assay request" })
  @ApiResponse({ status: 200, description: "Assay request found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Request not found" })
  async getRequest(@Param("id") id: string, @CurrentUser() user: any) {
    const request = await this.labsService.getAssayRequest(id);
    await this.labsService.assertCanAccessRequest(request, user);
    return request;
  }

  @Post("assay-requests/:id/results")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Issue assay result" })
  @ApiResponse({ status: 201, description: "Result issued" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Lab access required" })
  async issueResult(
    @Param("id") id: string,
    @Body() dto: IssueAssayResultDto,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("LAB_MANAGER") &&
      !user.roles?.includes("LAB_TECHNICIAN")
    ) {
      throw new ForbiddenException("Lab access required");
    }
    return this.labsService.issueResult(id, dto, user);
  }

  @Post("results/:id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve assay result" })
  @ApiResponse({ status: 200, description: "Result approved" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Lab manager access required" })
  @ApiResponse({ status: 404, description: "Result not found" })
  async approveResult(
    @Param("id") id: string,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("LAB_MANAGER")
    ) {
      throw new ForbiddenException("Lab manager access required");
    }
    return this.labsService.approveResult(id, user);
  }

  @Get("assets/:assetId/results")
  @ApiOperation({ summary: "Get results by asset" })
  @ApiResponse({ status: 200, description: "List of results" })
  async getResultsByAsset(@Param("assetId") assetId: string, @CurrentUser() user: any) {
    await this.labsService.assertCanAccessAsset(assetId, user);
    return this.labsService.getResultsByAsset(assetId);
  }
}
