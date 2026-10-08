import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { User } from "../users/user.entity";
import { Session } from "./session.entity";
import { JwtPayload } from "../../common/types/tenant.types";
import { UserRole } from "../rbac/user-role.entity";
import { Role } from "../rbac/role.entity";
import { Permission } from "../rbac/permission.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    private jwtService: JwtService,
    @Inject("JWT_REFRESH_SECRET") private refreshSecret: string
  ) {}

  private async getUserRolesAndPermissions(userId: string) {
    const userRoles = await this.userRoleRepo.find({
      where: { userId, isActive: true },
      relations: ["role"],
    });

    const roleNames = userRoles.map((ur) => ur.role?.name).filter(Boolean);
    const roleIds = userRoles.map((ur) => ur.roleId).filter(Boolean);

    let permissionNames: string[] = [];
    if (roleIds.length > 0) {
      const roles = await this.roleRepo.find({
        where: { id: In(roleIds) },
        relations: ["permissions"],
      });

      const permSet = new Set<string>();
      roles.forEach((role) => {
        role.permissions?.forEach((perm) => permSet.add(perm.name));
      });
      permissionNames = Array.from(permSet);
    }

    return { roles: roleNames, permissions: permissionNames };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        "Account locked. Try again later."
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.userRepo.save(user);
      throw new UnauthorizedException("Invalid credentials");
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    return user;
  }

  async login(user: User, ip?: string, userAgent?: string) {
    const sessionId = crypto.randomUUID();
    const { roles, permissions } = await this.getUserRolesAndPermissions(user.id);

    const userRole = await this.userRoleRepo.findOne({
      where: { userId: user.id, isActive: true },
      order: { createdAt: "DESC" },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: userRole?.organizationId,
      roles,
      permissions,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: "15m" });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: "refresh", sessionId },
      { secret: this.refreshSecret, expiresIn: "7d" }
    );

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.sessionRepo.save({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: refreshHash,
      ip,
      userAgent,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; sessionId: string }>(
        refreshToken,
        { secret: this.refreshSecret }
      );

      const session = await this.sessionRepo.findOne({
        where: { id: payload.sessionId, isActive: true },
      });

      if (!session) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      if (session.expiresAt < new Date()) {
        await this.sessionRepo.update(session.id, { isActive: false });
        throw new UnauthorizedException("Refresh token expired");
      }

      const valid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (!valid) {
        await this.sessionRepo.update(session.id, { isActive: false });
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException("User not found or inactive");
      }

      const newSessionId = crypto.randomUUID();
      const { roles, permissions } = await this.getUserRolesAndPermissions(user.id);

      const userRole = await this.userRoleRepo.findOne({
        where: { userId: user.id, isActive: true },
        order: { createdAt: "DESC" },
      });

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        organizationId: userRole?.organizationId,
        roles,
        permissions,
        sessionId: newSessionId,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: "15m",
      });
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, type: "refresh", sessionId: newSessionId },
        { secret: this.refreshSecret, expiresIn: "7d" }
      );

      await this.sessionRepo.update(session.id, { isActive: false });

      const refreshHash = await bcrypt.hash(newRefreshToken, 10);
      await this.sessionRepo.save({
        id: newSessionId,
        userId: user.id,
        refreshTokenHash: refreshHash,
        ip: session.ip,
        userAgent: session.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(sessionId: string) {
    await this.sessionRepo.update(sessionId, { isActive: false });
  }

  async logoutAll(userId: string) {
    await this.sessionRepo.update(
      { userId, isActive: true },
      { isActive: false }
    );
  }

  async getActiveSessions(userId: string) {
    return this.sessionRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: "DESC" },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) throw new BadRequestException("Session not found");
    await this.sessionRepo.update(sessionId, { isActive: false });
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    if (data.password.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = this.userRepo.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash,
    });
    const saved = await this.userRepo.save(user);

    return {
      id: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
    };
  }

  async getUserSessions(userId: string) {
    return this.sessionRepo.find({
      where: { userId, isActive: true },
      select: ["id", "userAgent", "ip", "createdAt", "expiresAt"],
      order: { createdAt: "DESC" },
    });
  }
}
