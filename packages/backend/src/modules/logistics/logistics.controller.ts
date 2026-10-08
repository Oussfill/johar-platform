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
import { LogisticsService } from "./logistics.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";
import {
  CreateWarehouseDto,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  RecordCustodyEventDto,
} from "./dto/logistics.dto";

@ApiTags("Logistics")
@Controller("logistics")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class LogisticsController {
  constructor(private logisticsService: LogisticsService) {}

  @Post("warehouses")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create warehouse" })
  @ApiResponse({ status: 201, description: "Warehouse created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Logistics manager access required" })
  async createWarehouse(
    @Body() dto: CreateWarehouseDto,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("LOGISTICS_MANAGER") &&
      !user.roles?.includes("PLATFORM_ADMIN")
    ) {
      throw new ForbiddenException("Logistics manager access required");
    }
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN") &&
      (!user.organizationId || dto.organizationId !== user.organizationId)
    ) {
      throw new ForbiddenException("Cannot create a warehouse for another organization");
    }
    return this.logisticsService.createWarehouse(dto);
  }

  @Get("warehouses")
  @ApiOperation({ summary: "List warehouses" })
  @ApiResponse({ status: 200, description: "List of warehouses" })
  async findAllWarehouses(@CurrentUser() user: any) {
    return this.logisticsService.findAllWarehouses(user);
  }

  @Post("shipments")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create shipment" })
  @ApiResponse({ status: 201, description: "Shipment created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Logistics manager access required" })
  async createShipment(
    @Body() dto: CreateShipmentDto,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("LOGISTICS_MANAGER")
    ) {
      throw new ForbiddenException("Logistics manager access required");
    }
    return this.logisticsService.createShipment(dto);
  }

  @Get("shipments/:id")
  @ApiOperation({ summary: "Get shipment" })
  @ApiResponse({ status: 200, description: "Shipment found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Shipment not found" })
  async getShipment(@Param("id") id: string, @CurrentUser() user: any) {
    return this.logisticsService.getShipment(id, user);
  }

  @Post("shipments/:id/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update shipment status" })
  @ApiResponse({ status: 200, description: "Status updated" })
  @ApiResponse({ status: 400, description: "Invalid status transition" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Logistics manager access required" })
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("LOGISTICS_MANAGER")
    ) {
      throw new ForbiddenException("Logistics manager access required");
    }
    return this.logisticsService.updateShipmentStatus(id, dto.status);
  }

  @Post("custody")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Record custody event" })
  @ApiResponse({ status: 201, description: "Custody event recorded" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async recordCustody(
    @Body() dto: RecordCustodyEventDto,
    @CurrentUser() user: any
  ) {
    return this.logisticsService.recordCustodyEvent(
      { ...dto, authorizedById: user.id },
      user
    );
  }

  @Get("custody/asset/:assetId")
  @ApiOperation({ summary: "Get custody history" })
  @ApiResponse({ status: 200, description: "List of custody events" })
  async getCustodyHistory(@Param("assetId") assetId: string, @CurrentUser() user: any) {
    return this.logisticsService.getCustodyHistory(assetId, user);
  }
}
