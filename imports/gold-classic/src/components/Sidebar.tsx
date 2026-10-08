// ============================================================================
// GOLD PLATFORM — SIDEBAR NAVIGATION (Role-Based)
// ============================================================================
// الشريط الجانبي — يعرض فقط الأقسام والصفحات المسموحة للدور الحالي

import React, { useState } from 'react';
import { RoleCode, PageId, SIDEBAR_GROUPS, PAGE_LABELS, canAccessPage } from '../types/roles';

interface SidebarProps {
  roleCode: RoleCode;
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  language: 'AR' | 'FR' | 'EN';
  userName?: string;
  collapsed?: boolean;
  onLogout?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  roleCode,
  currentPage,
  onNavigate,
  language,
  userName,
  collapsed = false,
  onLogout,
  mobileOpen = false,
  onMobileClose,
}) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const dir = language === 'AR' ? 'rtl' : 'ltr';
  const isMobile = window.innerWidth < 768;
  const isVisible = !isMobile || mobileOpen;

  // تصفية المجموعات والصفحات حسب الصلاحيات
  const visibleGroups = SIDEBAR_GROUPS
    .map(group => ({
      ...group,
      pages: group.pages.filter(page => canAccessPage(roleCode, page)),
    }))
    .filter(group => group.pages.length > 0);

  return (
    <aside
      dir={dir}
      style={{
        width: collapsed ? 64 : 260,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d0d14 0%, #12121a 100%)',
        borderRight: dir === 'rtl' ? 'none' : '1px solid rgba(198,169,105,0.12)',
        borderLeft: dir === 'rtl' ? '1px solid rgba(198,169,105,0.12)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, transform 0.3s ease',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: dir === 'rtl' ? 'auto' : 0,
        right: dir === 'rtl' ? 0 : 'auto',
        zIndex: 100,
        transform: isMobile && !mobileOpen ? (dir === 'rtl' ? 'translateX(100%)' : 'translateX(-100%)') : 'translateX(0)',
        boxShadow: isMobile && mobileOpen ? '0 0 40px rgba(0,0,0,0.7)' : 'none',
      }}
    >
      {isMobile && onMobileClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px' }}>
          <button
            onClick={onMobileClose}
            style={{ background: 'transparent', border: 'none', color: '#8a8a9a', fontSize: 24, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
      {/* الشعار */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1px solid rgba(198,169,105,0.1)',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <img src="/johar-logo.jpeg" alt="جوهر" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ color: '#c6a969', fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>{language === 'AR' ? 'جوهر' : 'JOHAR'}</span>
        )}
      </div>

      {/* معلومات المستخدم */}
      {!collapsed && userName && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(198,169,105,0.06)' }}>
          <p style={{ color: '#c6a969', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </p>
          <p style={{ color: '#666', fontSize: 10, margin: '2px 0 0' }}>{roleCode}</p>
        </div>
      )}

      {/* المجموعات والصفحات */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {visibleGroups.map(group => {
          const isExpanded = expandedGroup === group.id || collapsed;
          return (
            <div key={group.id}>
              {!collapsed && (
                <button
                  onClick={() => setExpandedGroup(isExpanded && !collapsed ? null : group.id)}
                  style={{
                    width: '100%',
                    padding: '8px 20px',
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    cursor: 'pointer',
                    textAlign: dir === 'rtl' ? 'right' : 'left',
                  }}
                >
                  {group[language]} {expandedGroup === group.id ? '▾' : '▸'}
                </button>
              )}
              {isExpanded && group.pages.map(pageId => {
                const meta = PAGE_LABELS[pageId];
                const isActive = currentPage === pageId;
                return (
                  <button
                    key={pageId}
                    onClick={() => onNavigate(pageId)}
                    title={collapsed ? meta[language] : undefined}
                    style={{
                      width: '100%',
                      padding: collapsed ? '10px 0' : '8px 20px',
                      background: isActive ? 'rgba(198,169,105,0.12)' : 'transparent',
                      border: 'none',
                      borderLeft: dir === 'ltr' && isActive ? '3px solid #c6a969' : undefined,
                      borderRight: dir === 'rtl' && isActive ? '3px solid #c6a969' : undefined,
                      color: isActive ? '#c6a969' : '#8a8a9a',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      justifyContent: collapsed ? 'center' : (dir === 'rtl' ? 'flex-start' : 'flex-start'),
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{meta.icon}</span>
                    {!collapsed && <span>{meta[language]}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* زر تسجيل الخروج */}
      {onLogout && (
        <div style={{ padding: 12, borderTop: '1px solid rgba(198,169,105,0.1)' }}>
          <button
            onClick={onLogout}
            title={collapsed ? 'Logout / تسجيل الخروج' : undefined}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(220, 53, 69, 0.08)',
              border: '1px solid rgba(220, 53, 69, 0.25)',
              borderRadius: 8,
              color: '#dc3545',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              justifyContent: collapsed ? 'center' : (dir === 'rtl' ? 'flex-end' : 'flex-start'),
              transition: 'all 0.15s',
            }}
          >
            <span>🚪</span>
            {!collapsed && <span>{dir === 'rtl' ? 'تسجيل الخروج' : 'Log out'}</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
