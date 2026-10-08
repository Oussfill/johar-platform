import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ControlCenterService } from "./control-center.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("Control Center")
@Controller("control-center")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ControlCenterController {
  constructor(private controlCenterService: ControlCenterService) {}

  @Get("summary")
  @ApiOperation({ summary: "North-star aggregate summary" })
  async summary() {
    return this.controlCenterService.summary();
  }

  @Get("live-transactions")
  @ApiOperation({ summary: "Recent live transactions" })
  async liveTransactions(@Query("limit") limit?: string) {
    return this.controlCenterService.liveTransactions(Number(limit) || 20);
  }

  @Get("risk-monitor")
  @ApiOperation({ summary: "Audit severity risk monitor" })
  async riskMonitor() {
    return this.controlCenterService.riskMonitor();
  }

  @Get("trade-overview")
  @ApiOperation({ summary: "Marketplace trade overview" })
  async tradeOverview() {
    return this.controlCenterService.tradeOverview();
  }

  @Get("blockchain-events")
  @ApiOperation({ summary: "Recent blockchain evidence events" })
  async blockchainEvents(@Query("limit") limit?: string) {
    return this.controlCenterService.blockchainEvents(Number(limit) || 20);
  }
}