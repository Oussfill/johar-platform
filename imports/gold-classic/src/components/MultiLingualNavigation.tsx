// ============================================================================
// GOLD PLATFORM — MULTI-LINGUAL NAVIGATION COMPONENT
// ============================================================================
// شريط التنقل الرئيسي — يدعم الصلاحيات وعرض الروابط حسب دور المستخدم

import React, { useState, useCallback, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Language = 'AR' | 'FR' | 'EN';
type Currency = 'DZD' | 'EUR' | 'USD';
type RoleCode = 'SUPER_ADMIN' | 'ADMIN' | 'CUSTODY_MANAGER' | 'LAB_DIRECTOR' | 'AUDITOR' | 'LAB_TECHNICIAN' | 'CUSTODIAN' | 'MARKETPLACE_SELLER' | 'VIEWER';

interface NavigationProps {
  currentLanguage: Language;
  currentCurrency: Currency;
  onLanguageChange: (lang: Language) => void;
  onCurrencyChange: (currency: Currency) => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: RoleCode;
  userName?: string;
  onLogout?: () => void;
}

interface NavTranslations {
  [key: string]: { AR: string; FR: string; EN: string };
}

// ============================================================================
// NAV ITEMS — كل عنصر يحدد الصلاحيات المطلوبة
// ============================================================================

interface NavItem {
  id: string;
  translations: { AR: string; FR: string; EN: string };
  permissions: string[]; // صلاحيات فارغة = متاح للجميع
  roles?: RoleCode[];    // أدور محددة (اختياري)
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', translations: { AR: 'الرئيسية', FR: 'Accueil', EN: 'Home' }, permissions: [] },
  { id: 'assets', translations: { AR: 'الأصول', FR: 'Actifs', EN: 'Assets' }, permissions: ['assets:read'] },
  { id: 'verify', translations: { AR: 'تحقق', FR: 'Vérifier', EN: 'Verify' }, permissions: [] },
  { id: 'marketplace', translations: { AR: 'السوق', FR: 'Marché', EN: 'Marketplace' }, permissions: ['marketplace:read'] },
  { id: 'vaults', translations: { AR: 'الخزائن', FR: 'Coffres', EN: 'Vaults' }, permissions: ['vaults:read'] },
  { id: 'erp', translations: { AR: 'لوحة التحكم', FR: 'Tableau de Bord', EN: 'Command Center' }, permissions: ['erp:dashboard'] },
  { id: 'ownership', translations: { AR: 'التمليك', FR: 'Propriété', EN: 'Ownership' }, permissions: ['ownership:read'] },
  { id: 'ai_assistant', translations: { AR: 'المساعد الذكي', FR: 'Assistant IA', EN: 'AI Assistant' }, permissions: ['ai:analyze'] },
];

// ============================================================================
// ROLE PERMISSIONS MAP
// ============================================================================

const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['hr:read', 'hr:write', 'financial:read', 'financial:write', 'assets:read', 'assets:write', 'assay:read', 'assay:write', 'digital:read', 'digital:write', 'marketplace:read', 'marketplace:write', 'custody:read', 'custody:write', 'custody:transfer', 'custody:approve', 'compliance:read', 'compliance:write', 'system:read', 'system:write', 'erp:dashboard', 'audit:read', 'ai:analyze', 'ownership:read', 'ownership:write', 'vaults:read', 'vaults:write'],
  CUSTODY_MANAGER: ['custody:read', 'custody:write', 'custody:transfer', 'custody:approve', 'assets:read', 'vaults:read', 'vaults:write', 'erp:dashboard', 'ownership:read', 'ownership:write'],
  LAB_DIRECTOR: ['assay:read', 'assay:write', 'assets:read', 'hr:read', 'digital:read', 'ai:analyze', 'erp:dashboard', 'vaults:read'],
  AUDITOR: ['assets:read', 'assay:read', 'custody:read', 'erp:dashboard', 'audit:read', 'compliance:read', 'financial:read', 'system:read', 'vaults:read'],
  LAB_TECHNICIAN: ['assay:read', 'assay:write', 'assets:read'],
  CUSTODIAN: ['assets:read', 'custody:read', 'vaults:read'],
  MARKETPLACE_SELLER: ['marketplace:read', 'marketplace:write', 'assets:read'],
  VIEWER: ['assets:read'],
};

// ============================================================================
// HELPER: Check if user can see nav item
// ============================================================================

function canSeeNavItem(roleCode: RoleCode | undefined, item: NavItem): boolean {
  if (!roleCode) return item.permissions.length === 0; // غير مصادق = صفحات عامة فقط
  const userPerms = ROLE_PERMISSIONS[roleCode] || [];
  if (userPerms.includes('*')) return true; // SUPER_ADMIN يرى كل شيء
  if (item.permissions.length === 0) return true; // صفحات عامة
  return item.permissions.some(p => userPerms.includes(p));
}

// ============================================================================
// ROLE LABELS
// ============================================================================

const ROLE_LABELS: Record<RoleCode, { AR: string; FR: string; EN: string }> = {
  SUPER_ADMIN: { AR: 'مدير النظام', FR: 'Super Admin', EN: 'Super Admin' },
  ADMIN: { AR: 'مدير', FR: 'Admin', EN: 'Admin' },
  CUSTODY_MANAGER: { AR: 'مدير الحيازة', FR: 'Gestionnaire Custody', EN: 'Custody Manager' },
  LAB_DIRECTOR: { AR: 'مدير المختبر', FR: 'Directeur Lab', EN: 'Lab Director' },
  AUDITOR: { AR: 'مفتتش', FR: 'Auditeur', EN: 'Auditor' },
  LAB_TECHNICIAN: { AR: 'تقني مختبر', FR: 'Technicien Lab', EN: 'Lab Technician' },
  CUSTODIAN: { AR: '呵صين', FR: 'Gardien', EN: 'Custodian' },
  MARKETPLACE_SELLER: { AR: 'بائع', FR: 'Vendeur', EN: 'Seller' },
  VIEWER: { AR: 'مشاهد', FR: 'Observateur', EN: 'Viewer' },
};

// ============================================================================
// MULTI-LINGUAL NAVIGATION COMPONENT
// ============================================================================

export const MultiLingualNavigation: React.FC<NavigationProps> = ({
  currentLanguage,
  currentCurrency,
  onLanguageChange,
  onCurrencyChange,
  currentPage,
  onNavigate,
  userRole,
  userName,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const direction = currentLanguage === 'AR' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage.toLowerCase();
  }, [direction, currentLanguage]);

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      onLanguageChange(lang);
      setIsMobileMenuOpen(false);
    },
    [onLanguageChange],
  );

  const handleCurrencyChange = useCallback(
    (currency: Currency) => {
      onCurrencyChange(currency);
    },
    [onCurrencyChange],
  );

  // تصفية العناصر حسب الصلاحيات
  const visibleItems = NAV_ITEMS.filter(item => canSeeNavItem(userRole, item));

  return (
    <nav
      className="gold-navbar"
      dir={direction}
      role="navigation"
      aria-label="Main Navigation"
    >
      {/* الشعار */}
      <div className="gold-navbar__logo">
        <div className="gold-navbar__logo-icon">G</div>
        <span className="gold-navbar__logo-text">جوهر</span>
      </div>

      {/* روابط التنقل — حسب الصلاحيات */}
      <ul className="gold-navbar__links">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`gold-navbar__link ${
                currentPage === item.id ? 'gold-navbar__link--active' : ''
              }`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.id);
              }}
            >
              {item.translations[currentLanguage] || item.id}
            </a>
          </li>
        ))}
      </ul>

      {/* عناصر التحكم */}
      <div className="gold-navbar__controls">
        {/* محوّل العملات */}
        <div className="gold-currency-switcher" role="group" aria-label="Currency">
          {(['USD', 'EUR', 'DZD'] as Currency[]).map((currency) => (
            <button
              key={currency}
              className={`gold-currency-btn ${
                currentCurrency === currency ? 'gold-currency-btn--active' : ''
              }`}
              onClick={() => handleCurrencyChange(currency)}
              aria-label={`Switch to ${currency}`}
              aria-pressed={currentCurrency === currency}
            >
              {currency}
            </button>
          ))}
        </div>

        {/* محوّل اللغات */}
        <div className="gold-lang-switcher" role="group" aria-label="Language">
          {(['AR', 'FR', 'EN'] as Language[]).map((lang) => (
            <button
              key={lang}
              className={`gold-lang-btn ${
                currentLanguage === lang ? 'gold-lang-btn--active' : ''
              }`}
              onClick={() => handleLanguageChange(lang)}
              aria-label={`Switch to ${lang === 'AR' ? 'Arabic' : lang === 'FR' ? 'French' : 'English'}`}
              aria-pressed={currentLanguage === lang}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* معلومات المستخدم / تسجيل الدخول */}
        {userRole && userName ? (
          <div style={{ position: 'relative', marginLeft: direction === 'rtl' ? 0 : 12, marginRight: direction === 'rtl' ? 12 : 0 }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: 'rgba(198, 169, 105, 0.1)',
                border: '1px solid rgba(198, 169, 105, 0.2)',
                borderRadius: 8,
                color: '#c6a969',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 18 }}>👤</span>
              <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </span>
              <span style={{ fontSize: 10, color: '#8a8a9a' }}>▼</span>
            </button>

            {/* قائمة المستخدم */}
            {showUserMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: direction === 'rtl' ? 0 : 'auto',
                    left: direction === 'ltr' ? 0 : 'auto',
                    marginTop: 8,
                    background: 'rgba(20, 20, 30, 0.98)',
                    border: '1px solid rgba(198, 169, 105, 0.2)',
                    borderRadius: 10,
                    padding: '12px 0',
                    minWidth: 200,
                    zIndex: 100,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid #333', marginBottom: 8 }}>
                    <p style={{ color: '#c6a969', fontSize: 14, fontWeight: 700, margin: 0 }}>{userName}</p>
                    <p style={{ color: '#8a8a9a', fontSize: 11, margin: '4px 0 0' }}>
                      {ROLE_LABELS[userRole]?.[currentLanguage] || userRole}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout?.();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#dc3545',
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: direction === 'rtl' ? 'right' : 'left',
                    }}
                  >
                    {currentLanguage === 'AR' ? '🚪 تسجيل الخروج' : currentLanguage === 'FR' ? '🚪 Déconnexion' : '🚪 Sign Out'}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => onNavigate('home')}
            style={{
              padding: '6px 16px',
              background: 'linear-gradient(135deg, #c6a969, #a67c00)',
              border: 'none',
              borderRadius: 8,
              color: '#0a0a0f',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: direction === 'rtl' ? 0 : 12,
              marginRight: direction === 'rtl' ? 12 : 0,
            }}
          >
            {currentLanguage === 'AR' ? 'تسجيل الدخول' : currentLanguage === 'FR' ? 'Connexion' : 'Sign In'}
          </button>
        )}

        {/* قائمة الجوال */}
        <button
          className="gold-btn gold-btn--ghost gold-btn--sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
          style={{ display: 'none' }}
        >
          ☰
        </button>
      </div>
    </nav>
  );
};

// ============================================================================
// MULTI-LINGUAL TEXT COMPONENT
// ============================================================================

interface MultiLangTextProps {
  translations: { AR: string; FR: string; EN: string };
  language: Language;
  className?: string;
  as?: React.ElementType;
}

export const MultiLangText: React.FC<MultiLangTextProps> = ({
  translations,
  language,
  className = '',
  as: Tag = 'span',
}) => {
  return (
    <Tag className={className} dir={language === 'AR' ? 'rtl' : 'ltr'}>
      {translations[language] || translations.EN}
    </Tag>
  );
};

// ============================================================================
// LOCALIZED CURRENCY DISPLAY
// ============================================================================

interface CurrencyDisplayProps {
  amount: number;
  currency: Currency;
  language: Language;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  language,
  className = '',
}) => {
  const locale = language === 'AR' ? 'ar-DZ' : language === 'FR' ? 'fr-FR' : 'en-US';

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <span className={`gold-currency-display ${className}`} dir="ltr">
      {formatted}
    </span>
  );
};

export default MultiLingualNavigation;
