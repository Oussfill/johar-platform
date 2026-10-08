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
import { FinanceService } from "./finance.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";
import { CreateInvoiceDto, RecordPaymentDto } from "./dto/finance.dto";

@ApiTags("Finance")
@Controller("finance")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Post("invoices")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create invoice" })
  @ApiResponse({ status: 201, description: "Invoice created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async createInvoice(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: any
  ) {
    return this.financeService.createInvoice({
      ...dto,
      issuerId: user.id,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    } as any, user);
  }

  @Get("invoices")
  @ApiOperation({ summary: "List invoices" })
  @ApiResponse({ status: 200, description: "Paginated invoice list" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async listInvoices(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @CurrentUser() user: any
  ) {
    if (user.roles?.includes("SUPER_ADMIN") || user.roles?.includes("FINANCE_OFFICER")) {
      return this.financeService.listInvoices(+page, +limit, user.organizationId);
    }
    return this.financeService.listByUser(user.id, +page, +limit);
  }

  @Get("invoices/:id")
  @ApiOperation({ summary: "Get invoice" })
  @ApiResponse({ status: 200, description: "Invoice found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async getInvoice(@Param("id") id: string, @CurrentUser() user: any) {
    const invoice = await this.financeService.getInvoice(id);
    await this.financeService.assertCanAccessInvoice(invoice, user);
    return invoice;
  }

  @Post("invoices/:id/payments")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Record payment" })
  @ApiResponse({ status: 201, description: "Payment recorded" })
  @ApiResponse({ status: 400, description: "Amount must be positive" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async recordPayment(
    @Param("id") id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: any
  ) {
    return this.financeService.recordPayment(id, { ...dto, payerId: user.id }, user);
  }

  @Post("payments/:id/confirm")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm payment" })
  @ApiResponse({ status: 200, description: "Payment confirmed, invoice status updated" })
  @ApiResponse({ status: 400, description: "Payment already confirmed or cancelled" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Finance officer access required" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  async confirmPayment(
    @Param("id") id: string,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN") &&
      !user.roles?.includes("FINANCE_OFFICER")
    ) {
      throw new ForbiddenException("Finance officer access required");
    }
    return this.financeService.confirmPayment(id, user);
  }

  @Get("invoices/:id/payments")
  @ApiOperation({ summary: "Get payments by invoice" })
  @ApiResponse({ status: 200, description: "List of payments" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async getPayments(@Param("id") id: string, @CurrentUser() user: any) {
    return this.financeService.getPaymentsByInvoice(id, user);
  }

  @Get("ledger/:accountId")
  @ApiOperation({ summary: "Get ledger entries" })
  @ApiResponse({ status: 200, description: "List of ledger entries" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Finance access required" })
  async getLedger(
    @Param("accountId") accountId: string,
    @CurrentUser() user: any
  ) {
    if (
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN") &&
      !user.roles?.includes("FINANCE_OFFICER") &&
      !user.roles?.includes("AUDITOR")
    ) {
      throw new ForbiddenException("Finance access required");
    }
    return this.financeService.getLedgerEntries(accountId, user);
  }
}
