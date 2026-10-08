import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { TenantContext } from "../types/tenant.types";

export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant: TenantContext | undefined = (request as any).tenant;

    if (!tenant) return undefined;

    if (data) {
      return tenant[data];
    }

    return tenant;
  }
);
