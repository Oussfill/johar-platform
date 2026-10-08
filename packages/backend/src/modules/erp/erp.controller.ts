import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ErpService } from "./erp.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  CreateErpSupplierDto,
  UpdateErpSupplierDto,
  CreateCrmCustomerDto,
  CreateCrmInteractionDto,
  CreateCrmOpportunityDto,
  CreatePurchaseRequestDto,
  CreateRfqDto,
  SubmitRfqOfferDto,
  CreatePurchaseOrderDto,
  CreateGoodsReceiptDto,
  CreateSalesOrderDto,
  CreateSalesInvoiceDto,
} from "./dto/erp.dto";

@ApiTags("ERP (Phase 2)")
@Controller("erp")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ErpController {
  constructor(private erpService: ErpService) {}

  private require(user: any, roles: string[]): void {
    const allowed = [...roles, "ORG_ADMIN", "ORG_OWNER", "SUPER_ADMIN", "PLATFORM_ADMIN"];
    if (!allowed.some((r) => user?.roles?.includes(r))) {
      throw new ForbiddenException(`Access denied: requires one of [${allowed.join(", ")}]`);
    }
  }

  // ---------- Suppliers ----------
  @Post("suppliers")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register supplier (org-scoped)" })
  async createSupplier(@Body() dto: CreateErpSupplierDto, @CurrentUser() user: any) {
    this.require(user, ["SUPPLIER"]);
    return this.erpService.createSupplier(dto, user);
  }

  @Get("suppliers")
  @ApiOperation({ summary: "List suppliers" })
  async listSuppliers(@CurrentUser() user: any) {
    return this.erpService.findAllSuppliers(user);
  }

  @Get("suppliers/:id")
  @ApiOperation({ summary: "Get supplier" })
  async getSupplier(@Param("id") id: string, @CurrentUser() user: any) {
    return this.erpService.findSupplier(id, user);
  }

  @Patch("suppliers/:id")
  @ApiOperation({ summary: "Update supplier" })
  async updateSupplier(@Param("id") id: string, @Body() dto: UpdateErpSupplierDto, @CurrentUser() user: any) {
    this.require(user, ["SUPPLIER"]);
    return this.erpService.updateSupplier(id, dto, user);
  }

  @Post("suppliers/:id/evaluate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Evaluate supplier" })
  async evaluateSupplier(@Param("id") id: string, @Body() body: { rating: number }, @CurrentUser() user: any) {
    this.require(user, ["SUPPLIER"]);
    return this.erpService.evaluateSupplier(id, Number(body.rating), user);
  }

  // ---------- CRM ----------
  @Post("crm/customers")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create CRM customer (org-scoped)" })
  async createCustomer(@Body() dto: CreateCrmCustomerDto, @CurrentUser() user: any) {
    this.require(user, ["CRM_OFFICER"]);
    return this.erpService.createCustomer(dto, user);
  }

  @Get("crm/customers")
  @ApiOperation({ summary: "List CRM customers" })
  async listCustomers(@CurrentUser() user: any) {
    return this.erpService.findAllCustomers(user);
  }

  @Post("crm/interactions")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Record customer interaction" })
  async createInteraction(@Body() dto: CreateCrmInteractionDto, @CurrentUser() user: any) {
    this.require(user, ["CRM_OFFICER"]);
    return this.erpService.createInteraction(dto, user);
  }

  @Get("crm/customers/:id/interactions")
  @ApiOperation({ summary: "Customer interaction history" })
  async customerInteractions(@Param("id") id: string, @CurrentUser() user: any) {
    return this.erpService.findInteractionsByCustomer(id, user);
  }

  @Post("crm/opportunities")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create CRM opportunity" })
  async createOpportunity(@Body() dto: CreateCrmOpportunityDto, @CurrentUser() user: any) {
    this.require(user, ["CRM_OFFICER"]);
    return this.erpService.createOpportunity(dto, user);
  }

  @Get("crm/opportunities")
  @ApiOperation({ summary: "List CRM opportunities" })
  async listOpportunities(@CurrentUser() user: any) {
    return this.erpService.findAllOpportunities(user);
  }

  @Patch("crm/opportunities/:id")
  @ApiOperation({ summary: "Update CRM opportunity stage" })
  async updateOpportunity(@Param("id") id: string, @Body() body: { stage?: string; probability?: number }, @CurrentUser() user: any) {
    this.require(user, ["CRM_OFFICER"]);
    return this.erpService.updateOpportunity(id, body, user);
  }

  // ---------- Procurement ----------
  @Post("procurement/purchase-requests")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create purchase request (org-scoped)" })
  async createPurchaseRequest(@Body() dto: CreatePurchaseRequestDto, @CurrentUser() user: any) {
    this.require(user, ["PURCHASER"]);
    return this.erpService.createPurchaseRequest(dto, user);
  }

  @Get("procurement/purchase-requests")
  @ApiOperation({ summary: "List purchase requests" })
  async listPurchaseRequests(@CurrentUser() user: any) {
    return this.erpService.findAllPurchaseRequests(user);
  }

  @Post("procurement/purchase-requests/:id/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit purchase request" })
  async submitPurchaseRequest(@Param("id") id: string, @CurrentUser() user: any) {
    this.require(user, ["PURCHASER"]);
    return this.erpService.updatePurchaseRequest(id, "SUBMITTED", user);
  }

  @Post("procurement/purchase-requests/:id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve purchase request" })
  async approvePurchaseRequest(@Param("id") id: string, @CurrentUser() user: any) {
    this.require(user, ["PURCHASER"]);
    return this.erpService.updatePurchaseRequest(id, "APPROVED", user);
  }

  @Post("procurement/rfqs")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create RFQ (org-scoped)" })
  async createRfq(@Body() dto: CreateRfqDto, @CurrentUser() user: any) {
    this.require(user, ["PURCHASER"]);
    return this.erpService.createRfq(dto, user);
  }

  @Get("procurement/rfqs")
  @ApiOperation({ summary: "List RFQs" })
  async listRfqs(@CurrentUser() user: any) {
    return this.erpService.findAllRfqs(user);
  }

  @Post("procurement/rfqs/:id/send")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send RFQ" })
  async sendRfq(@Param("id") id: string, @CurrentUser() user: any) {
    this.require(user, ["PURCHASER"]);
    return this.erpService.updateRfq(id, "SENT", user);
  }

  @Post("procurement/rfqs/:id/offers")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Submit RFQ offer" })
  async submitRfqOffer(@Param("id") id: string, @Body() dto: SubmitRfqOfferDto, @CurrentUser() user: any) {
    this.require(user, ["SUPPLIER"]);
    return this.erpService.submitRfqOffer(id, dto, user);
  }

  @Post("procurement/rfqs/:id/choose/:offerId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Choose winning RFQ offer" })
  async chooseRfqOffer(@Param("id") id: string, @Param("offerId") offerId: string, @CurrentUser() user: any) {
    this.require(user, ["PURCHASER"]);
    return this.erpService.chooseRfqOffer(id, offerId, user);
  }

  @Post("procurement/purchase-orders")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create purchase order (org-scoped)" })
  async createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: any) {
    this.require(user, ["PURCHASER"]);
    return this.erpService.createPurchaseOrder(dto, user);
  }

  @Get("procurement/purchase-orders")
  @ApiOperation({ summary: "List purchase orders" })
  async listPurchaseOrders(@CurrentUser() user: any) {
    return this.erpService.findAllPurchaseOrders(user);
  }

  @Post("procurement/goods-receipts")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Record goods receipt (org-scoped)" })
  async createGoodsReceipt(@Body() dto: CreateGoodsReceiptDto, @CurrentUser() user: any) {
    this.require(user, ["PURCHASER"]);
    return this.erpService.createGoodsReceipt(dto, user);
  }

  @Get("procurement/goods-receipts")
  @ApiOperation({ summary: "List goods receipts" })
  async listGoodsReceipts(@CurrentUser() user: any) {
    return this.erpService.findAllGoodsReceipts(user);
  }

  @Post("procurement/goods-receipts/:id/inspect")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Inspect goods receipt" })
  async inspectGoodsReceipt(@Param("id") id: string, @CurrentUser() user: any) {
    this.require(user, ["PURCHASER"]);
    return this.erpService.inspectGoodsReceipt(id, user);
  }

  // ---------- Sales ----------
  @Post("sales/orders")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create sales order (org-scoped)" })
  async createSalesOrder(@Body() dto: CreateSalesOrderDto, @CurrentUser() user: any) {
    this.require(user, ["SALES_OFFICER"]);
    return this.erpService.createSalesOrder(dto, user);
  }

  @Get("sales/orders")
  @ApiOperation({ summary: "List sales orders" })
  async listSalesOrders(@CurrentUser() user: any) {
    return this.erpService.findAllSalesOrders(user);
  }

  @Post("sales/orders/:id/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify sales order" })
  async verifySalesOrder(@Param("id") id: string, @CurrentUser() user: any) {
    this.require(user, ["SALES_OFFICER"]);
    return this.erpService.updateSalesOrder(id, "VERIFIED", user);
  }

  @Post("sales/orders/:id/fulfill")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Fulfill sales order" })
  async fulfillSalesOrder(@Param("id") id: string, @CurrentUser() user: any) {
    this.require(user, ["SALES_OFFICER"]);
    return this.erpService.updateSalesOrder(id, "FULFILLED", user);
  }

  @Post("sales/invoices")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create sales invoice (org-scoped)" })
  async createSalesInvoice(@Body() dto: CreateSalesInvoiceDto, @CurrentUser() user: any) {
    this.require(user, ["SALES_OFFICER"]);
    return this.erpService.createSalesInvoice(dto, user);
  }

  @Get("sales/invoices")
  @ApiOperation({ summary: "List sales invoices" })
  async listSalesInvoices(@CurrentUser() user: any) {
    return this.erpService.findAllSalesInvoices(user);
  }

  @Post("sales/invoices/:id/pay")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Pay sales invoice" })
  async paySalesInvoice(@Param("id") id: string, @CurrentUser() user: any) {
    this.require(user, ["SALES_OFFICER"]);
    return this.erpService.paySalesInvoice(id, user);
  }
}