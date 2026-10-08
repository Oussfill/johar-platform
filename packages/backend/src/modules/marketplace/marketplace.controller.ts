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
import { MarketplaceService } from "./marketplace.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";
import {
  CreateListingDto,
  MakeOfferDto,
  NegotiateDto,
  UpdateTransactionStatusDto,
} from "./dto/marketplace.dto";

@ApiTags("Marketplace")
@Controller("marketplace")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class MarketplaceController {
  constructor(private marketService: MarketplaceService) {}

  @Post("listings")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create listing" })
  @ApiResponse({ status: 201, description: "Listing created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async createListing(@Body() dto: CreateListingDto, @CurrentUser() user: any) {
    await this.marketService.assertCanListAsset(dto.assetId, user);
    return this.marketService.createListing(dto, user.id);
  }

  @Get("listings")
  @ApiOperation({ summary: "List active listings" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiResponse({ status: 200, description: "Paginated listing results" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async listActive(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @CurrentUser() user?: any
  ) {
    return this.marketService.listActive(+page, +limit, user?.organizationId);
  }

  @Get("listings/:id")
  @ApiOperation({ summary: "Get listing" })
  @ApiResponse({ status: 200, description: "Listing found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Listing not found" })
  async getListing(@Param("id") id: string) {
    return this.marketService.getListing(id);
  }

  @Post("listings/:id/offers")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Make offer" })
  @ApiResponse({ status: 201, description: "Offer created" })
  @ApiResponse({ status: 400, description: "Duplicate/self offer or listing not active" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Listing not found" })
  async makeOffer(
    @Param("id") id: string,
    @Body() dto: MakeOfferDto,
    @CurrentUser("id") userId: string
  ) {
    return this.marketService.makeOffer(id, userId, dto.amount, dto.message);
  }

  @Post("offers/:id/accept")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Accept offer" })
  @ApiResponse({ status: 200, description: "Offer accepted, transaction created" })
  @ApiResponse({ status: 400, description: "Offer not pending or listing not active" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Only seller can accept" })
  @ApiResponse({ status: 404, description: "Offer not found" })
  async acceptOffer(@Param("id") id: string, @CurrentUser() user: any) {
    const offer = await this.marketService.getOfferById(id);
    if (!offer) throw new ForbiddenException("Offer not found");

    const listing = await this.marketService.getListing(offer.listingId);
    if (listing.sellerId !== user.id && !user.roles?.includes("SUPER_ADMIN")) {
      throw new ForbiddenException("Only the seller can accept offers");
    }

    return this.marketService.acceptOffer(id);
  }

  @Post("offers/:id/negotiate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Start negotiation" })
  @ApiResponse({ status: 201, description: "Negotiation round created" })
  @ApiResponse({ status: 400, description: "Price must be positive" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async negotiate(
    @Param("id") id: string,
    @Body() dto: NegotiateDto,
    @CurrentUser() user: any
  ) {
    const offer = await this.marketService.getOfferById(id);
    await this.marketService.assertCanAccessOffer(offer, user);
    return this.marketService.startNegotiation(id, user.id, dto.price, dto.message);
  }

  @Get("offers/:id/negotiations")
  @ApiOperation({ summary: "Get negotiations" })
  @ApiResponse({ status: 200, description: "List of negotiation rounds" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async getNegotiations(@Param("id") id: string, @CurrentUser() user: any) {
    const offer = await this.marketService.getOfferById(id);
    await this.marketService.assertCanAccessOffer(offer, user);
    return this.marketService.getNegotiations(id);
  }

  @Get("transactions/:id")
  @ApiOperation({ summary: "Get transaction" })
  @ApiResponse({ status: 200, description: "Transaction found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  async getTransaction(@Param("id") id: string, @CurrentUser() user: any) {
    const tx = await this.marketService.getTransaction(id);
    await this.marketService.assertCanAccessTransaction(tx, user);
    return tx;
  }

  @Post("transactions/:id/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update transaction status" })
  @ApiResponse({ status: 200, description: "Transaction status updated" })
  @ApiResponse({ status: 400, description: "Invalid status transition" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  async updateTxStatus(
    @Param("id") id: string,
    @Body() dto: UpdateTransactionStatusDto,
    @CurrentUser() user: any
  ) {
    const tx = await this.marketService.getTransaction(id);
    if (
      tx.buyerId !== user.id &&
      tx.sellerId !== user.id &&
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("FINANCE_OFFICER")
    ) {
      throw new ForbiddenException("Access denied");
    }

    return this.marketService.updateTransactionStatus(id, dto.status);
  }
}
