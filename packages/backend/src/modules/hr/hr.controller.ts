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
import { HrService } from "./hr.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  CreateWorkerTypeDto,
  CreateWorkerDto,
  RecordAttendanceDto,
  RunPayrollDto,
} from "./dto/hr.dto";

@ApiTags("HR / Workforce")
@Controller("hr")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HrController {
  constructor(private hrService: HrService) {}

  private require(user: any): void {
    if (
      !user?.roles?.some((r: string) =>
        ["HR_MANAGER", "ORG_ADMIN", "ORG_OWNER", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(r)
      )
    ) {
      throw new ForbiddenException("HR manager access required");
    }
  }

  @Post("worker-types")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create worker type (org-scoped)" })
  async createWorkerType(@Body() dto: CreateWorkerTypeDto, @CurrentUser() user: any) {
    this.require(user);
    return this.hrService.createWorkerType(dto, user);
  }

  @Get("worker-types")
  @ApiOperation({ summary: "List worker types" })
  async listWorkerTypes(@CurrentUser() user: any) {
    return this.hrService.findAllWorkerTypes(user);
  }

  @Patch("worker-types/:id")
  @ApiOperation({ summary: "Update worker type" })
  async updateWorkerType(@Param("id") id: string, @Body() dto: Partial<CreateWorkerTypeDto>, @CurrentUser() user: any) {
    this.require(user);
    return this.hrService.updateWorkerType(id, dto, user);
  }

  @Post("workers")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create worker (org-scoped)" })
  async createWorker(@Body() dto: CreateWorkerDto, @CurrentUser() user: any) {
    this.require(user);
    return this.hrService.createWorker(dto, user);
  }

  @Get("workers")
  @ApiOperation({ summary: "List workers" })
  async listWorkers(@CurrentUser() user: any) {
    return this.hrService.findAllWorkers(user);
  }

  @Patch("workers/:id")
  @ApiOperation({ summary: "Update worker" })
  async updateWorker(@Param("id") id: string, @Body() dto: Partial<CreateWorkerDto>, @CurrentUser() user: any) {
    this.require(user);
    return this.hrService.updateWorker(id, dto, user);
  }

  @Post("attendance")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Record attendance (org-scoped)" })
  async recordAttendance(@Body() dto: RecordAttendanceDto, @CurrentUser() user: any) {
    this.require(user);
    return this.hrService.recordAttendance(dto, user);
  }

  @Get("attendance")
  @ApiOperation({ summary: "List attendance records" })
  async listAttendance(@CurrentUser() user: any) {
    return this.hrService.findAllAttendance(user);
  }

  @Post("payroll/run")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Run payroll for period" })
  async runPayroll(@Body() dto: RunPayrollDto, @CurrentUser() user: any) {
    this.require(user);
    return this.hrService.runPayroll(dto.periodLabel, user);
  }

  @Get("payroll")
  @ApiOperation({ summary: "List salary payments" })
  async listPayroll(@CurrentUser() user: any) {
    return this.hrService.findAllPayments(user);
  }

  @Get("payroll/overview")
  @ApiOperation({ summary: "Payroll overview" })
  async payrollOverview(@CurrentUser() user: any) {
    return this.hrService.payrollOverview(user);
  }

  @Post("payroll/:id/pay")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Pay salary payment" })
  async payPayment(@Param("id") id: string, @CurrentUser() user: any) {
    this.require(user);
    return this.hrService.payPayment(id, user);
  }
}