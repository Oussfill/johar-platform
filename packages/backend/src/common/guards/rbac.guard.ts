import { Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { TenantContext } from "../types/tenant.types";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

export const ROLES_KEY = "roles";
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = "permissions";
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    const request = context.switchToHttp().getRequest();
    const tenant: TenantContext | undefined = (request as any).tenant;

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (isPublic) {
      return true;
    }

    if (!tenant) {
      throw new ForbiddenException("Authentication required");
    }

    if (tenant.roles.includes("SUPER_ADMIN")) {
      return true;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) =>
        tenant.roles.includes(role)
      );
      if (!hasRole) {
        throw new ForbiddenException(
          `Required roles: ${requiredRoles.join(", ")}`
        );
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every((perm) =>
        tenant.permissions.includes(perm)
      );
      if (!hasPermission) {
        throw new ForbiddenException(
          `Required permissions: ${requiredPermissions.join(", ")}`
        );
      }
    }

    return true;
  }
}
