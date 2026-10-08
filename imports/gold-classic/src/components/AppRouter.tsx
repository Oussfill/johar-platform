import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { Sidebar } from './Sidebar';
import {
  HomePage,
  MarketplacePage,
  MarketplaceDetailPage,
  VerifyPage,
  AiAssistantPage,
  MyAssetsPage,
  MyOrdersPage,
  OwnershipActivatePage,
  NotaryDashboardPage,
  NotaryCertifyPage,
  DigitalRegistrarPage,
  OwnershipHistoryPage,
  ErpAssetsPage,
  ErpAssetsRegisterPage,
  ErpVaultsPage,
  ErpInventoryReconciliationPage,
  ErpInvariantCheckPage,
  AssetMutationsPage,
  StatAnalysisPage,
  LabRequestsPage,
  LabRecordsPage,
  LabCertificatesPage,
  CustodyChainPage,
  CustodyTransfersPage,
  CustodyApprovalsPage,
  LogisticsTrackingPage,
  FinanceTreasuryPage,
  FinanceEscrowPage,
  FinancePricingPage,
  FinanceInvoicesPage,
  SecurityFraudPage,
  SecurityHumanReviewPage,
  ComplianceKycAmlPage,
  AdminAuditLogsPage,
  AdminBlockchainPage,
  AdminUsersRbacPage,
  SystemMonitorPage,
  AdminProductsPage,
  AdminNfcPage,
  AdminB2bPage,
  AdminWorkersPage,
} from '../pages';
import { ControlCenterPage } from '../pages/controlCenterPage';
import { PublicLandingPage } from './PublicLandingPage';
import { useAuth } from './AuthContext';
import { LoginPage } from './LoginPage';
import { MobileMenuButton } from './MobileMenuButton';
import { RoleCode, PageId, PAGE_PATHS, PAGE_LABELS } from '../types/roles';

type Language = 'AR' | 'FR' | 'EN';
type Currency = 'DZD' | 'EUR' | 'USD';

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

// Build reverse lookup: path pattern → PageId
const PATH_TO_PAGE: Array<{ pattern: RegExp; pageId: PageId }> = [];

Object.entries(PAGE_PATHS).forEach(([pageId, path]) => {
  // Convert path params like :id → [^/]+
  const regexStr = path.replace(/:[^/]+/g, '[^/]+');
  PATH_TO_PAGE.push({
    pattern: new RegExp('^' + regexStr + '$'),
    pageId: pageId as PageId,
  });
});

function parsePageFromHash(hash: string): PageId {
  const raw = hash.replace(/^#/, '') || '/';
  for (const entry of PATH_TO_PAGE) {
    if (entry.pattern.test(raw)) {
      return entry.pageId;
    }
  }
  return 'home';
}

// ─── Component Map ───────────────────────────────────────────────────────

const PAGE_COMPONENTS: Record<PageId, React.FC<{ language: Language; currency: Currency }>> = {
  'home':                           HomePage,
  'marketplace':                    MarketplacePage,
  'marketplace-detail':             MarketplaceDetailPage,
  'verify':                         VerifyPage,
  'ai-assistant':                   AiAssistantPage,
  'my-assets':                      MyAssetsPage,
  'my-orders':                      MyOrdersPage,
  'ownership-activate':             OwnershipActivatePage,
  'notary-dashboard':               NotaryDashboardPage,
  'notary-certify':                 NotaryCertifyPage,
  'digital-registrar':              DigitalRegistrarPage,
  'ownership-history':              OwnershipHistoryPage,
  'erp-assets':                     ErpAssetsPage,
  'erp-assets-register':            ErpAssetsRegisterPage,
  'erp-vaults':                     ErpVaultsPage,
  'erp-inventory-reconciliation':   ErpInventoryReconciliationPage,
  'erp-invariant-check':            ErpInvariantCheckPage,
  'erp-asset-mutations':            AssetMutationsPage,
  'statistics-analysis':            StatAnalysisPage,
  'lab-requests':                   LabRequestsPage,
  'lab-records':                    LabRecordsPage,
  'lab-certificates':               LabCertificatesPage,
  'custody-chain':                  CustodyChainPage,
  'custody-transfers':              CustodyTransfersPage,
  'custody-approvals':              CustodyApprovalsPage,
  'logistics-tracking':             LogisticsTrackingPage,
  'finance-treasury':               FinanceTreasuryPage,
  'finance-escrow':                 FinanceEscrowPage,
  'finance-pricing':                FinancePricingPage,
  'finance-invoices':               FinanceInvoicesPage,
  'security-fraud':                 SecurityFraudPage,
  'security-human-review':          SecurityHumanReviewPage,
  'compliance-kyc-aml':             ComplianceKycAmlPage,
  'admin-audit-logs':               AdminAuditLogsPage,
  'admin-blockchain':               AdminBlockchainPage,
  'admin-users-rbac':               AdminUsersRbacPage,
  'system-monitor':                 SystemMonitorPage,
  'admin-products':                 AdminProductsPage,
  'admin-nfc':                       AdminNfcPage,
  'admin-b2b':                       AdminB2bPage,
  'admin-workers':                   AdminWorkersPage,
  'control-center':                  ControlCenterPage,
};

// ─── Main Router Component ───────────────────────────────────────────────

const GoldAppRouter: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem('gold-lang') as Language) || 'EN'
  );
  const [currency, setCurrency] = useState<Currency>(
    () => (localStorage.getItem('gold-currency') as Currency) || 'USD'
  );
  const [currentPage, setCurrentPage] = useState<PageId>(() =>
    parsePageFromHash(window.location.hash)
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 768);

  const direction = language === 'AR' ? 'rtl' : 'ltr';

  // Track viewport size so the mobile menu button appears/disappears dynamically
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Persist preferences to localStorage
  useEffect(() => {
    localStorage.setItem('gold-lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('gold-currency', currency);
  }, [currency]);

  // Set document direction and language
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language.toLowerCase();
  }, [direction, language]);

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    const handler = () => {
      const newPage = parsePageFromHash(window.location.hash);
      setCurrentPage(newPage);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Navigate to a page by updating the hash
  const navigate = useCallback((pageId: PageId) => {
    const path = PAGE_PATHS[pageId];
    window.location.hash = '#' + path;
    setCurrentPage(pageId);
  }, []);

  // Resolve short role code for the sidebar
  const shortRoleCode: RoleCode = useMemo(() => {
    if (!user?.roleCode) return 'CU';
    return mapRoleCode(user.roleCode);
  }, [user?.roleCode]);

  // Render the appropriate page component
  const renderPage = useCallback(() => {
    const PageComponent = PAGE_COMPONENTS[currentPage];
    if (!PageComponent) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❓</div>
          <h1 style={{ color: '#dc3545', fontSize: 24, fontWeight: 700 }}>404 — Page Not Found</h1>
          <p style={{ color: '#8a8a9a', marginTop: 8 }}>
            The page &quot;{currentPage}&quot; does not exist.
          </p>
          <button
            onClick={() => navigate('home')}
            style={{
              marginTop: 24,
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #c6a969, #a67c00)',
              border: 'none',
              borderRadius: 8,
              color: '#0a0a0f',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Back to Home
          </button>
        </div>
      );
    }
    return <PageComponent language={language} currency={currency} />;
  }, [currentPage, language, currency, navigate]);

  // Not authenticated — show the public landing page
  if (!isAuthenticated) {
    return (
      <PublicLandingPage
        language={language}
        currency={currency}
        onLanguageChange={setLanguage}
        onCurrencyChange={setCurrency}
      />
    );
  }

  const userName = user ? `${user.firstName} ${user.lastName}` : undefined;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: '#0a0a0f',
          borderBottom: '1px solid rgba(198,169,105,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/johar-logo.jpeg" alt="جوهر" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ color: '#c6a969', fontSize: 16, fontWeight: 700 }}>{language === 'AR' ? 'جوهر' : 'JOHAR'}</span>
          </div>
          <MobileMenuButton isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        </div>
      )}
      <Sidebar
        roleCode={shortRoleCode}
        currentPage={currentPage}
        onNavigate={(page) => { navigate(page); if (isMobile) setMobileMenuOpen(false); }}
        language={language}
        userName={userName}
        onLogout={() => { logout(); if (isMobile) setMobileMenuOpen(false); }}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        collapsed={!isMobile && false}
      />
      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : (direction === 'rtl' ? 0 : 260),
          marginRight: isMobile ? 0 : (direction === 'rtl' ? 260 : 0),
          minHeight: '100vh',
          paddingTop: isMobile ? 60 : 0,
          paddingLeft: isMobile ? 12 : 24,
          paddingRight: isMobile ? 12 : 24,
          paddingBottom: isMobile ? 16 : 28,
          width: isMobile ? '100%' : 'auto',
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        {mobileMenuOpen && isMobile && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 50,
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <ProtectedRoute pageId={currentPage}>
          {renderPage()}
        </ProtectedRoute>
      </main>
    </div>
  );
};

export default GoldAppRouter;
