import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PasswordService } from "./password.service";
import { PasswordController } from "./password.controller";
import { JwtStrategy } from "./jwt.strategy";
import { LocalStrategy } from "./local.strategy";
import { User } from "../users/user.entity";
import { Session } from "./session.entity";
import { UserRole } from "../rbac/user-role.entity";
import { Role } from "../rbac/role.entity";
import { Permission } from "../rbac/permission.entity";
import { PasswordReset, EmailVerification, MfaDevice, OtpCode } from "./auth-entities";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is required. " +
      "Set it in .env or your environment before starting the application. " +
      "Example: JWT_SECRET=<random-64-char-string>"
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "FATAL: JWT_SECRET must be at least 32 characters for security. " +
      `Current length: ${secret.length}`
    );
  }
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT_REFRESH_SECRET or JWT_SECRET environment variable is required."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "FATAL: JWT_REFRESH_SECRET must be at least 32 characters for security."
    );
  }
  return secret;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Session,
      UserRole,
      Role,
      Permission,
      PasswordReset,
      EmailVerification,
      MfaDevice,
      OtpCode,
    ]),
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: "15m" },
    }),
  ],
  providers: [
    AuthService,
    PasswordService,
    JwtStrategy,
    LocalStrategy,
    { provide: "JWT_REFRESH_SECRET", useFactory: getRefreshSecret },
  ],
  controllers: [AuthController, PasswordController],
  exports: [AuthService, PasswordService, "JWT_REFRESH_SECRET"],
})
export class AuthModule {}
