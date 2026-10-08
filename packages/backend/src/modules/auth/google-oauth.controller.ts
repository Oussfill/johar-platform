import {
  Controller,
  Get,
  Req,
  Res,
  Query,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { PubSupport as Public } from "../../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { User } from "../users/user.entity";

/**
 * OAuth Google — زر «المتابعة بحساب Google» في واجهة JOHAR.
 * يعتمد بالكامل على env (مفعّل تلقائيًا حين تُهيّأ creds):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI   (default: {APP_ORIGIN}/api/v1/auth/google/callback)
 *   FRONTEND_ORIGIN       (default: APP_ORIGIN)
 * طالما لم تُهيّأ، تُرجع المسارات 503 برسالة واضحة بدون كسر البناء.
 */
@ApiTags("Auth")
@Controller("auth")
export class GoogleOAuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User) private readonly userRepo: Repository<User>
  ) {}

  private get clientId(): string {
    const id = process.env.GOOGLE_CLIENT_ID;
    if (!id) {
      throw new ServiceUnavailableException(
        "Google sign-in not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the backend environment, then restart."
      );
    }
    return id;
  }

  private get clientSecret(): string {
    const s = process.env.GOOGLE_CLIENT_SECRET;
    if (!s) {
      throw new ServiceUnavailableException(
        "Google sign-in not configured. Set GOOGLE_CLIENT_SECRET in the backend environment, then restart."
      );
    }
    return s;
  }

  private get appOrigin(): string {
    return process.env.APP_ORIGIN || process.env.FRONTEND_ORIGIN || "";
  }

  private get redirectUri(): string {
    const base = this.appOrigin;
    return `${base}/api/v1/auth/google/callback`;
  }

  @Get("google")
  @Public()
  @ApiOperation({ summary: "Start Google OAuth (redirects to Google)" })
  @ApiResponse({ status: 302, description: "Redirect to Google consent" })
  @ApiResponse({ status: 503, description: "Google OAuth not configured" })
  async start(@Res() res: Response) {
    const id = this.clientId;
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const url =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      "?client_id=" + encodeURIComponent(id) +
      "&redirect_uri=" + encodeURIComponent(this.redirectUri) +
      "&response_type=code" +
      "&scope=" + encodeURIComponent("openid email profile") +
      "&state=" + encodeURIComponent(state) +
      "&prompt=select_account";
    return res.redirect(url);
  }

  @Get("google/callback")
  @Public()
  @ApiOperation({ summary: "Google OAuth callback — exchange code for tokens" })
  @ApiResponse({ status: 302, description: "Redirect back to the app" })
  @ApiResponse({ status: 503, description: "Google OAuth not configured" })
  async callback(
    @Query("code") code: string | undefined,
    @Query("error") oauthError: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    if (oauthError) {
      return res.redirect(
        `${this.appOrigin}/#login?error=${encodeURIComponent(oauthError)}`
      );
    }
    if (!code) {
      return res.redirect(
        `${this.appOrigin}/#login?error=${encodeURIComponent("missing code")}`
      );
    }

    // تبادل الرمز → access_token عبر Google Token Endpoint
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      const tx = await tokenRes.text();
      return res.redirect(
        `${this.appOrigin}/#login?error=${encodeURIComponent("token exchange failed: " + tx.slice(0, 120))}`
      );
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return res.redirect(
        `${this.appOrigin}/#login?error=${encodeURIComponent("no access_token")}`
      );
    }

    // جلب الملف الشخصي من Google UserInfo
    const meRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    if (!meRes.ok) {
      return res.redirect(
        `${this.appOrigin}/#login?error=${encodeURIComponent("userinfo failed")}`
      );
    }
    const profile = (await meRes.json()) as {
      email?: string;
      given_name?: string;
      family_name?: string;
      email_verified?: boolean;
    };
    if (!profile.email || !profile.email_verified) {
      return res.redirect(
        `${this.appOrigin}/#login?error=${encodeURIComponent("unverified email")}`
      );
    }

    // إيجاد المستخدم أو إنشاؤه عند أول دخول بحساب Google
    let user = await this.userRepo.findOne({ where: { email: profile.email } });
    if (!user) {
      user = await this.userRepo.save(
        this.userRepo.create({
          email: profile.email,
          firstName: profile.given_name || "",
          lastName: profile.family_name || "",
          passwordHash: await bcrypt.hash(
            "google-only-" + Math.random().toString(36).slice(2),
            10
          ),
          isActive: true,
        } as Partial<User>)
      );
    }
    if (!user.isActive) {
      return res.redirect(
        `${this.appOrigin}/#login?error=${encodeURIComponent("deactivated")}`
      );
    }

    // إعادة استخدام AuthService.login — جلسة + JWT/Refresh كما في الدخول العادي
    const session = await this.authService.login(
      user,
      (req.ip ?? "") as string,
      (req.headers["user-agent"] ?? "") as string
    );

    const adminOrigin = this.appOrigin || "/";
    return res.redirect(
      `${adminOrigin}/#login?token=${encodeURIComponent(session.accessToken)}&refresh=${encodeURIComponent(session.refreshToken ?? "")}`
    );
  }
}
