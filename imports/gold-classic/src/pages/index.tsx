// ============================================================================
// GOLD PLATFORM — PAGE ROUTER INDEX
// ============================================================================
// يجمّع كل الصفحات الفعلية من ملفات المجموعات
// تظل الواجهة: { language, currency }

import React from 'react';
import type { Language, Currency } from '../components/UiKit';
import { HomeDashboard } from '../components/HomeDashboard';
import MarketplacePageComp from '../components/MarketplacePage';

// ─── صفحات الزبون والسوق ───────────────────────────────────────────────────
export {
  MarketplaceDetailPage,
  MyAssetsPage,
  MyOrdersPage,
  OwnershipActivatePage,
  VerifyPage,
  AiAssistantPage,
} from './consumerPages';

// ─── صفحات كاتب العدل ──────────────────────────────────────────────────────
export {
  NotaryDashboardPage,
  NotaryCertifyPage,
  DigitalRegistrarPage,
  OwnershipHistoryPage,
} from './notaryPages';

// ─── صفحات ERP والأصول ─────────────────────────────────────────────────────
export {
  ErpAssetsPage,
  ErpAssetsRegisterPage,
  ErpVaultsPage,
  ErpInventoryReconciliationPage,
  ErpInvariantCheckPage,
  AssetMutationsPage,
} from './erpPages';

// ─── صفحات المختبر ─────────────────────────────────────────────────────────
export {
  LabRequestsPage,
  LabRecordsPage,
  LabCertificatesPage,
} from './labPages';

// ─── صفحات الحيازة واللوجستيات ─────────────────────────────────────────────
export {
  CustodyChainPage,
  CustodyTransfersPage,
  CustodyApprovalsPage,
  LogisticsTrackingPage,
} from './custodyPages';

// ─── صفحات المالية ─────────────────────────────────────────────────────────
export {
  FinanceTreasuryPage,
  FinanceEscrowPage,
  FinancePricingPage,
  FinanceInvoicesPage,
} from './financePages';

// ─── صفحات الأمن والامتثال ─────────────────────────────────────────────────
export {
  SecurityFraudPage,
  SecurityHumanReviewPage,
  ComplianceKycAmlPage,
} from './securityPages';

// ─── صفحات الإدارة ─────────────────────────────────────────────────────────
export {
  AdminAuditLogsPage,
  AdminBlockchainPage,
  AdminUsersRbacPage,
} from './adminPages';

export { SystemMonitorPage } from './systemMonitorPage';
export { AdminProductsPage } from './adminProductsPage';
export { AdminNfcPage } from './adminNfcPage';
export { AdminB2bPage } from './adminB2bPage';
export { AdminWorkersPage } from './workerPages';
export { StatAnalysisPage } from './statsPages';
export { ControlCenterPage } from './controlCenterPage';

// ─── الصفحة الرئيسية + السوق ───────────────────────────────────────────────
type Props = { language: Language; currency: Currency };

export const HomePage: React.FC<Props> = ({ language, currency }) => (
  <HomeDashboard language={language} currency={currency} />
);

export const MarketplacePage: React.FC<Props> = ({ language, currency }) => (
  <MarketplacePageComp language={language} currency={currency} />
);