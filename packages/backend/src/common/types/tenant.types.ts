export interface TenantContext {
  userId: string;
  email: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  requestId?: string;
}
