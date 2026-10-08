import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { TenantContext } from "../types/tenant.types";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

export const TENANT_ISOLATED_KEY = "tenantIsolated";
export const TenantIsolated = () =>
  SetMetadata(TENANT_ISOLATED_KEY, true);

export const RESOURCE_OWNER_KEY = "resourceOwner";
export const ResourceOwner = (source: "params" | "body" | "query" = "params", field = "organizationId") =>
  SetMetadata(RESOURCE_OWNER_KEY, { source, field });

export const ABAC_PERMISSION_KEY = "abacPermission";
export const RequireAbacPermission = (...permissions: string[]) =>
  SetMetadata(ABAC_PERMISSION_KEY, permissions);

const logger = new Logger("AbacGuard");

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
      throw new UnauthorizedException("Authentication required");
    }

    const isTenantIsolated = this.reflector.getAllAndOverride<boolean>(
      TENANT_ISOLATED_KEY,
      [context.getHandler(), context.getClass()]
    );

    const resourceOwnerConfig = this.reflector.getAllAndOverride<{
      source: "params" | "body" | "query";
      field: string;
    }>(RESOURCE_OWNER_KEY, [context.getHandler(), context.getClass()]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      ABAC_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!isTenantIsolated && !resourceOwnerConfig && !requiredPermissions) {
      return true;
    }

    if (tenant.roles.includes("SUPER_ADMIN") || tenant.roles.includes("PLATFORM_ADMIN")) {
      return true;
    }

    if (isTenantIsolated) {
      this.validateTenantIsolation(tenant, request);
    }

    if (resourceOwnerConfig) {
      this.validateResourceOwnership(tenant, request, resourceOwnerConfig);
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      this.validatePermissions(tenant, requiredPermissions);
    }

    return true;
  }

  private validateTenantIsolation(tenant: TenantContext, request: any): void {
    const resourceOrgId =
      request.params?.organizationId ||
      request.body?.organizationId ||
      request.query?.organizationId;

    if (resourceOrgId && tenant.organizationId && resourceOrgId !== tenant.organizationId) {
      logger.warn(
        `Cross-tenant access denied: user ${tenant.userId} (${tenant.organizationId}) ` +
        `tried to access resource in org ${resourceOrgId}`
      );
      throw new ForbiddenException("Access denied: cross-tenant access prohibited");
    }
  }

  private validateResourceOwnership(
    tenant: TenantContext,
    request: any,
    config: { source: "params" | "body" | "query"; field: string }
  ): void {
    const resourceOrgId = request[config.source]?.[config.field];

    if (!resourceOrgId) {
      return;
    }

    if (tenant.organizationId && resourceOrgId !== tenant.organizationId) {
      logger.warn(
        `Resource ownership violation: user ${tenant.userId} (${tenant.organizationId}) ` +
        `tried to access resource owned by org ${resourceOrgId}`
      );
      throw new ForbiddenException("Access denied: you do not own this resource");
    }
  }

  private validatePermissions(tenant: TenantContext, requiredPermissions: string[]): void {
    const missing = requiredPermissions.filter(
      (perm) => !tenant.permissions.includes(perm)
    );

    if (missing.length > 0) {
      logger.warn(
        `Permission denied for user ${tenant.userId}: ` +
        `missing [${missing.join(", ")}]`
      );
      throw new ForbiddenException(
        `Missing required permissions: ${missing.join(", ")}`
      );
    }
  }

  validateTenantAccess(
    tenant: TenantContext,
    resourceOrganizationId?: string
  ): void {
    if (tenant.roles.includes("SUPER_ADMIN") || tenant.roles.includes("PLATFORM_ADMIN")) {
      return;
    }

    if (
      resourceOrganizationId &&
      tenant.organizationId &&
      resourceOrganizationId !== tenant.organizationId
    ) {
      throw new ForbiddenException("Access denied: cross-tenant access prohibited");
    }
  }
}
