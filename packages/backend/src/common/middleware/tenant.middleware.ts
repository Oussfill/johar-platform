import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "../types/tenant.types";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    try {
      const token = authHeader.slice(7);
      const payload = this.jwtService.verify<JwtPayload>(token);

      (req as any).tenant = {
        userId: payload.sub,
        email: payload.email,
        organizationId: payload.organizationId,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        sessionId: payload.sessionId,
      };
    } catch {
      // Invalid token — tenant will be undefined
    }

    next();
  }
}
