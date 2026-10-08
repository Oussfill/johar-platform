// ============================================================================
// GOLD PLATFORM — PROTECTED ROUTE COMPONENT
// ============================================================================
// مكون حماية المسارات — يتحقق من المصادقة والدور قبل عرض الصفحة

import React from 'react';
import { useAuth } from './AuthContext';
import { RoleCode, canAccessPage, PageId } from '../types/roles';

// AuthContext uses long role codes (SUPER_ADMIN, ADMIN, etc.)
// roles.ts uses short codes (SA, OM, LA, NO, VM, DR, ME, CU, AU)
const ROLE_MAP: Record<string, RoleCode> = {
  SUPER_ADMIN: 'SA',
  ADMIN: 'SA',
  CUSTODY_MANAGER: 'OM',
  LAB_DIRECTOR: 'LA',
  AUDITOR: 'AU',
  LAB_TECHNICIAN: 'LA',
  CUSTODIAN: 'VM',
  MARKETPLACE_SELLER: 'ME',
  VIEWER: 'CU',
};

function mapRoleCode(dbRoleCode: string): RoleCode {
  return ROLE_MAP[dbRoleCode] || 'CU';
}

interface ProtectedRouteProps {
  pageId: PageId;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ pageId, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // أثناء تحميل بيانات المصادقة
  if (isLoading) {
    return (
      <div style={centerStyle}>
        <div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⏳</div>
        <p style={{ color: '#c6a969', marginTop: 12 }}>جوهر</p>
      </div>
    );
  }

  // غير مصادق — إعادة التوجيه لصفحة الدخول
  if (!isAuthenticated || !user) {
    return <UnauthorizedPage reason="login" pageId={pageId} />;
  }

  // تحويل رمز الدور إلى الكود القصير ثم التحقق من الصلاحية
  const shortCode = mapRoleCode(user.roleCode);

  // التحقق من الصلاحية
  if (!canAccessPage(shortCode, pageId)) {
    return <UnauthorizedPage reason="forbidden" pageId={pageId} roleCode={user.roleCode} />;
  }

  return <>{children}</>;
};

// ─── صفحة غير مصرح ────────────────────────────────────────────────────────
const UnauthorizedPage: React.FC<{
  reason: 'login' | 'forbidden';
  pageId: string;
  roleCode?: string;
}> = ({ reason, pageId, roleCode }) => {
  const isLogin = reason === 'login';

  return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          {isLogin ? '🔒' : '🚫'}
        </div>
        <h1 style={{
          color: isLogin ? '#c6a969' : '#dc3545',
          fontSize: '1.5rem',
          fontWeight: 700,
          margin: '0 0 8px',
        }}>
          {isLogin ? 'جوهر' : '403 — Forbidden'}
        </h1>
        <p style={{ color: '#8a8a9a', fontSize: 14, margin: '0 0 24px' }}>
          {isLogin
            ? 'Please sign in to access this page'
            : `Role "${roleCode}" does not have access to "${pageId}"`}
        </p>
        {!isLogin && (
          <button
            onClick={() => { localStorage.removeItem('gold-token'); localStorage.removeItem('gold-user'); window.location.href = '/'; }}
            style={btnStyle}
          >
            Sign In with Different Account
          </button>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const centerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
};

const cardStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(20, 20, 30, 0.95)',
  borderRadius: 16,
  border: '1px solid rgba(198, 169, 105, 0.2)',
  padding: '48px 40px',
  maxWidth: 420,
  width: '90%',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: 'linear-gradient(135deg, #c6a969, #a67c00)',
  border: 'none',
  borderRadius: 8,
  color: '#0a0a0f',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 14,
};

export default ProtectedRoute;
