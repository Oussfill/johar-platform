import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("Health")
@Controller("health")
@Public()
export class HealthController {
  constructor(
    @InjectDataSource() private dataSource: DataSource
  ) {}

  @Get()
  @ApiOperation({ summary: "Full health check (liveness + readiness)" })
  @ApiResponse({ status: 200, description: "Health status returned" })
  async check() {
    const checks: Record<string, string> = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
      uptime: process.uptime().toString(),
    };

    try {
      const start = Date.now();
      await this.dataSource.query("SELECT 1");
      checks.database = "ok";
      checks.dbLatency = `${Date.now() - start}ms`;
    } catch {
      checks.database = "error";
      checks.status = "degraded";
    }

    return checks;
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness probe — can the app accept traffic?" })
  @ApiResponse({ status: 200, description: "App is ready" })
  @ApiResponse({ status: 503, description: "App is not ready" })
  async ready() {
    const dbReady = await this.checkDatabase();
    if (!dbReady) {
      throw new ServiceUnavailableException({
        status: "not ready",
        timestamp: new Date().toISOString(),
        database: "unavailable",
      });
    }
    return {
      status: "ready",
      timestamp: new Date().toISOString(),
      database: "ok",
    };
  }

  @Get("live")
  @ApiOperation({ summary: "Liveness probe — is the process alive?" })
  @ApiResponse({ status: 200, description: "Process is alive" })
  live() {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }
}
