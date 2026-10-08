import { Controller, Get, Header, ForbiddenException, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiProduces, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { MetricsService } from "./metrics.service";
import { JwtAuthGuard } from "../../modules/auth/jwt-auth.guard";
import { CurrentUser } from "../decorators/current-user.decorator";

@ApiTags("Metrics")
@ApiBearerAuth()
@Controller("metrics")
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Prometheus metrics (admin only)" })
  @ApiProduces("text/plain")
  @Header("Content-Type", "text/plain")
  @ApiResponse({ status: 200, description: "Prometheus metrics" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async getMetrics(@CurrentUser() user: any) {
    if (
      !user?.roles?.includes("SUPER_ADMIN") &&
      !user?.roles?.includes("PLATFORM_ADMIN")
    ) {
      throw new ForbiddenException("Admin access required");
    }
    return this.metricsService.getMetrics();
  }
}
