import { Controller, Post, Get, Body, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { StatsService } from "./stats.service";
import { AnalyzeStatsDto } from "./dto/stats.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Statistics")
@Controller("stats")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Post("analyze")
  @ApiOperation({ summary: "Statistical analysis (descriptive / t-test / ANOVA / correlation / regression / Cronbach)" })
  analyze(@Body() dto: AnalyzeStatsDto) {
    switch (dto.type) {
      case "descriptive":
        return this.statsService.descriptive(dto.values ?? []);
      case "ttest":
        return this.statsService.ttest(dto.values ?? [], dto.y ?? []);
      case "anova":
        return this.statsService.anova(dto.groups ?? []);
      case "correlation":
        return this.statsService.correlation(dto.values ?? [], dto.y ?? []);
      case "regression":
        return this.statsService.regression(dto.values ?? [], dto.y ?? []);
      case "cronbach":
        return this.statsService.cronbachAlpha(dto.items ?? []);
      default:
        throw new BadRequestException("Unsupported analysis type");
    }
  }

  @Get("vaa")
  @ApiOperation({ summary: "North-Star aggregates placeholder (see /control-center)" })
  vaa(@CurrentUser() _user: any) {
    return { metric: "vaa", scope: "see /control-center" };
  }
}