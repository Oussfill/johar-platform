import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./local-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
} from "./dto/auth.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 400, description: "Validation error or password too short" })
  @ApiResponse({ status: 409, description: "Email already registered" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: "Login successful, returns tokens" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Request() req: any) {
    return this.authService.login(
      req.user,
      req.ip,
      req.headers["user-agent"]
    );
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed" })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout current session" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async logout(@CurrentUser("sessionId") sessionId: string) {
    if (sessionId) {
      await this.authService.logout(sessionId);
    }
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout-all")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout all sessions" })
  @ApiResponse({ status: 200, description: "All sessions terminated" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async logoutAll(@CurrentUser("id") userId: string) {
    await this.authService.logoutAll(userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user" })
  @ApiResponse({ status: 200, description: "Current user profile" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async me(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles,
      permissions: user.permissions,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("sessions")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List active sessions" })
  @ApiResponse({ status: 200, description: "List of active sessions" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async sessions(@CurrentUser("id") userId: string) {
    return this.authService.getUserSessions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("sessions/:sessionId/revoke")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoke a session" })
  @ApiResponse({ status: 200, description: "Session revoked" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 404, description: "Session not found" })
  async revokeSession(
    @CurrentUser("id") userId: string,
    @Request() req: any
  ) {
    await this.authService.revokeSession(userId, req.params.sessionId);
    return { success: true };
  }
}
