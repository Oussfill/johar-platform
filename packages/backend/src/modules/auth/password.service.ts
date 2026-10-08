import {
  Injectable,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { authenticator } from "otplib";
import { User } from "../users/user.entity";
import { PasswordReset, EmailVerification, MfaDevice, OtpCode } from "./auth-entities";

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PasswordReset) private resetRepo: Repository<PasswordReset>,
    @InjectRepository(EmailVerification) private verifyRepo: Repository<EmailVerification>,
    @InjectRepository(MfaDevice) private mfaRepo: Repository<MfaDevice>,
    @InjectRepository(OtpCode) private otpRepo: Repository<OtpCode>
  ) {}

  async requestPasswordReset(email: string): Promise<{ message: string; token?: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      return { message: "If the email exists, a reset link has been sent." };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);

    await this.resetRepo.save({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    this.logger.log(`Password reset requested for user ${user.id}`);

    return {
      message: "If the email exists, a reset link has been sent.",
      token: process.env.ALLOW_TOKEN_LOGGING === "true" ? rawToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const resets = await this.resetRepo.find({
      where: { isUsed: false },
      order: { createdAt: "DESC" },
      take: 10,
    });

    let validReset: PasswordReset | null = null;
    for (const reset of resets) {
      if (reset.expiresAt < new Date()) continue;
      const valid = await bcrypt.compare(token, reset.tokenHash);
      if (valid) {
        validReset = reset;
        break;
      }
    }

    if (!validReset) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    if (newPassword.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(newPassword)) {
      throw new BadRequestException(
        "Password must contain uppercase, lowercase, number and special character"
      );
    }

    const user = await this.userRepo.findOne({ where: { id: validReset.userId } });
    if (!user) throw new BadRequestException("User not found");

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.userRepo.save(user);

    validReset.isUsed = true;
    validReset.usedAt = new Date();
    await this.resetRepo.save(validReset);

    this.logger.log(`Password reset completed for user ${user.id}`);

    return { message: "Password reset successfully" };
  }

  async requestEmailVerification(userId: string): Promise<{ message: string; token?: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");
    if (user.isEmailVerified) return { message: "Email already verified" };

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);

    await this.verifyRepo.save({
      userId: user.id,
      tokenHash,
      email: user.email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    this.logger.log(`Email verification requested for user ${userId}`);

    return {
      message: "Verification email sent",
      token: process.env.NODE_ENV !== "production" ? rawToken : undefined,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verifications = await this.verifyRepo.find({
      where: { isVerified: false },
      order: { createdAt: "DESC" },
      take: 10,
    });

    let validVerification: EmailVerification | null = null;
    for (const v of verifications) {
      if (v.expiresAt < new Date()) continue;
      const valid = await bcrypt.compare(token, v.tokenHash);
      if (valid) {
        validVerification = v;
        break;
      }
    }

    if (!validVerification) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    const user = await this.userRepo.findOne({ where: { id: validVerification.userId } });
    if (!user) throw new BadRequestException("User not found");

    user.isEmailVerified = true;
    await this.userRepo.save(user);

    validVerification.isVerified = true;
    await this.verifyRepo.save(validVerification);

    this.logger.log(`Email verified for user ${user.id}`);

    return { message: "Email verified successfully" };
  }

  async generateOtp(userId: string, purpose: string): Promise<{ message: string; code?: string }> {
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, 10);

    await this.otpRepo.save({
      userId,
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    this.logger.log(`OTP generated for user ${userId}, purpose: ${purpose}`);

    return {
      message: "OTP sent",
      code: process.env.NODE_ENV !== "production" ? code : undefined,
    };
  }

  async verifyOtp(userId: string, code: string, purpose: string): Promise<boolean> {
    const otps = await this.otpRepo.find({
      where: { userId, purpose, isUsed: false },
      order: { createdAt: "DESC" },
      take: 5,
    });

    for (const otp of otps) {
      if (otp.expiresAt < new Date()) continue;
      if (otp.attempts >= 5) continue;

      otp.attempts += 1;
      await this.otpRepo.save(otp);

      const valid = await bcrypt.compare(code, otp.codeHash);
      if (valid) {
        otp.isUsed = true;
        await this.otpRepo.save(otp);
        this.logger.log(`OTP verified for user ${userId}, purpose: ${purpose}`);
        return true;
      }
    }

    this.logger.warn(`OTP verification failed for user ${userId}, purpose: ${purpose}`);
    return false;
  }

  async generateMfaSecret(userId: string, name: string): Promise<{ secret: string; otpauthUrl: string }> {
    const secret = authenticator.generateSecret();
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");

    const otpauthUrl = authenticator.keyuri(user.email, "JOHAR", secret);

    return { secret, otpauthUrl };
  }

  async registerMfaDevice(
    userId: string,
    type: string,
    name: string,
    secret?: string
  ): Promise<MfaDevice> {
    if (type !== "TOTP") {
      throw new BadRequestException("Only TOTP is currently supported");
    }
    if (!secret) {
      throw new BadRequestException("Secret is required for TOTP registration");
    }

    if (!authenticator.verify({ token: "000000", secret })) {
      this.logger.warn(`MFA secret validation failed for user ${userId}`);
    }

    return this.mfaRepo.save({
      userId,
      type,
      name,
      secret,
      isVerified: false,
      isActive: true,
    });
  }

  async verifyMfaDevice(userId: string, deviceId: string, code: string): Promise<boolean> {
    const device = await this.mfaRepo.findOne({ where: { id: deviceId, userId } });
    if (!device) return false;

    if (device.type === "TOTP" && device.secret) {
      const isValid = authenticator.verify({ token: code, secret: device.secret });

      if (isValid) {
        device.isVerified = true;
        device.lastUsedAt = new Date();
        device.failedAttempts = 0;
        await this.mfaRepo.save(device);
        this.logger.log(`MFA device ${deviceId} verified`);
        return true;
      } else {
        device.failedAttempts += 1;
        if (device.failedAttempts >= 10) {
          device.isActive = false;
          this.logger.warn(`MFA device ${deviceId} deactivated due to too many failed attempts`);
        }
        await this.mfaRepo.save(device);
      }
    }

    return false;
  }

  async verifyMfaForUser(userId: string, code: string): Promise<boolean> {
    const devices = await this.mfaRepo.find({
      where: { userId, isActive: true, isVerified: true },
    });

    for (const device of devices) {
      if (device.type === "TOTP" && device.secret) {
      const isValid = authenticator.verify({ token: code, secret: device.secret });

        if (isValid) {
          device.lastUsedAt = new Date();
          device.failedAttempts = 0;
          await this.mfaRepo.save(device);
          this.logger.log(`MFA verified for user ${userId} via device ${device.id}`);
          return true;
        } else {
          device.failedAttempts += 1;
          await this.mfaRepo.save(device);
        }
      }
    }

    this.logger.warn(`MFA verification failed for user ${userId}`);
    return false;
  }

  async getMfaDevices(userId: string): Promise<MfaDevice[]> {
    return this.mfaRepo.find({
      where: { userId, isActive: true },
      select: ["id", "type", "name", "isVerified", "isActive", "lastUsedAt", "createdAt"],
    });
  }

  async removeMfaDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.mfaRepo.findOne({
      where: { id: deviceId, userId },
    });
    if (!device) throw new BadRequestException("Device not found");
    device.isActive = false;
    await this.mfaRepo.save(device);
    this.logger.log(`MFA device ${deviceId} removed for user ${userId}`);
  }
}
