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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { AssetsService } from "./assets.service";
import { Asset } from "./asset.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CreateAssetDto, TransitionAssetDto, AssetQueryDto } from "./dto/asset.dto";

@ApiTags("Assets")
@Controller("assets")
@TenantIsolated()
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  private assertAssetAccess(asset: Asset, user: any) {
    if (user.roles?.includes("SUPER_ADMIN") || user.roles?.includes("PLATFORM_ADMIN")) return;
    if (asset.ownerId === user.id) return;
    if (asset.currentLocationId && asset.currentLocationId === user.organizationId) return;
    throw new ForbiddenException("Access denied: you do not have access to this asset");
  }

  @Public()
  @Get("verify/:token")
  @ApiOperation({ summary: "Verify digital passport (public)" })
  @ApiResponse({ status: 200, description: "Passport verification result" })
  @ApiResponse({ status: 404, description: "Passport not found" })
  async verifyPassport(@Param("token") token: string) {
    return this.assetsService.verifyPassport(token);
  }

  @Get("johar/:joharId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get asset by JOHAR ID" })
  @ApiResponse({ status: 200, description: "Asset found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Asset not found" })
  async findByJoharId(@Param("joharId") joharId: string, @CurrentUser() user: any) {
    const asset = await this.assetsService.findByJoharId(joharId);
    this.assertAssetAccess(asset, user);
    return asset;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new asset" })
  @ApiResponse({ status: 201, description: "Asset created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async create(@Body() dto: CreateAssetDto, @CurrentUser() user: any) {
    return this.assetsService.create(dto, user.id, user.organizationId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List assets" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiResponse({ status: 200, description: "Paginated asset list" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async findAll(@Query() query: AssetQueryDto, @CurrentUser() user: any) {
    return this.assetsService.findAll(
      Number(query.page) || 1,
      Number(query.limit) || 20,
      {
        type: query.type,
        status: query.status,
        ownerId: user.roles?.includes("SUPER_ADMIN") ? query.ownerId : user.id,
        organizationId: user.organizationId,
      }
    );
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get asset by ID" })
  @ApiResponse({ status: 200, description: "Asset found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Asset not found" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    const asset = await this.assetsService.findById(id);
    this.assertAssetAccess(asset, user);
    return asset;
  }

  @Post(":id/transition")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Transition asset status" })
  @ApiResponse({ status: 200, description: "Asset status updated" })
  @ApiResponse({ status: 400, description: "Invalid status transition" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Asset not found" })
  async transition(
    @Param("id") id: string,
    @Body() dto: TransitionAssetDto,
    @CurrentUser() user: any
  ) {
    const asset = await this.assetsService.findById(id);
    this.assertAssetAccess(asset, user);
    return this.assetsService.transitionStatus(id, dto.status, user.id);
  }

  @Get(":id/events")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get asset event history" })
  @ApiResponse({ status: 200, description: "List of asset events" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async getEvents(@Param("id") id: string, @CurrentUser() user: any) {
    const asset = await this.assetsService.findById(id);
    this.assertAssetAccess(asset, user);
    return this.assetsService.getEventHistory(id);
  }

  @Post(":id/passport")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create digital passport" })
  @ApiResponse({ status: 201, description: "Passport created" })
  @ApiResponse({ status: 400, description: "Asset not in valid state" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Asset not found" })
  async createPassport(@Param("id") id: string, @CurrentUser() user: any) {
    const asset = await this.assetsService.findById(id);
    this.assertAssetAccess(asset, user);
    return this.assetsService.createPassport(id);
  }
}
