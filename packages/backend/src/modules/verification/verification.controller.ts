import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AssetsService } from "../assets/assets.service";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Verification")
@Controller("verification")
export class VerificationController {
  constructor(private assetsService: AssetsService) {}

  @Public()
  @Get(":token")
  @ApiOperation({ summary: "Verify asset by token" })
  async verify(@Param("token") token: string) {
    return this.assetsService.verifyPassport(token);
  }
}
