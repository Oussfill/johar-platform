import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PasswordService } from "./password.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  GenerateOtpDto,
  VerifyOtpDto,
  RegisterMfaDto,
  VerifyMfaDto,
  RemoveMfaDto,
} from "./dto/password.dto";

@ApiTags("Password & MFA")
@Controller("auth")
export class PasswordController {
  constructor(private passwordService: PasswordService) {}

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordService.requestPasswordReset(dto.email);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto.token, dto.password);
  }

  @Post("verify-email")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request email verification" })
  async requestEmailVerification(@CurrentUser("id") userId: string) {
    return this.passwordService.requestEmailVerification(userId);
  }

  @Public()
  @Get("verify-email/:token")
  @ApiOperation({ summary: "Verify email with token" })
  async verifyEmail(@Param("token") token: string) {
    return this.passwordService.verifyEmail(token);
  }

  @Post("otp/generate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate OTP" })
  async generateOtp(
    @CurrentUser("id") userId: string,
    @Body() dto: GenerateOtpDto
  ) {
    return this.passwordService.generateOtp(userId, dto.purpose);
  }

  @Post("otp/verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify OTP" })
  async verifyOtp(
    @CurrentUser("id") userId: string,
    @Body() dto: VerifyOtpDto
  ) {
    const valid = await this.passwordService.verifyOtp(
      userId,
      dto.code,
      dto.purpose
    );
    return { verified: valid };
  }

  @Post("mfa/generate-secret")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate MFA secret for TOTP" })
  async generateMfaSecret(
    @CurrentUser("id") userId: string,
    @Body() dto: { name: string }
  ) {
    return this.passwordService.generateMfaSecret(userId, dto.name);
  }

  @Post("mfa/register")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register MFA device" })
  async registerMfa(
    @CurrentUser("id") userId: string,
    @Body() dto: RegisterMfaDto
  ) {
    return this.passwordService.registerMfaDevice(
      userId,
      dto.type,
      dto.name,
      dto.secret
    );
  }

  @Post("mfa/verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify MFA device" })
  async verifyMfa(@CurrentUser("id") userId: string, @Body() dto: VerifyMfaDto) {
    const valid = await this.passwordService.verifyMfaDevice(
      userId,
      dto.deviceId,
      dto.code
    );
    return { verified: valid };
  }

  @Get("mfa/devices")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List MFA devices" })
  async getMfaDevices(@CurrentUser("id") userId: string) {
    return this.passwordService.getMfaDevices(userId);
  }

  @Post("mfa/remove")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove MFA device" })
  async removeMfa(
    @CurrentUser("id") userId: string,
    @Body() dto: RemoveMfaDto
  ) {
    await this.passwordService.removeMfaDevice(userId, dto.deviceId);
    return { success: true };
  }
}
