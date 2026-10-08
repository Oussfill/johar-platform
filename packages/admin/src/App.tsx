import { useState } from "react";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./components/AuthContext";
import GuestLandingPage from "./components/GuestLandingPage";
import LoginPage from "./components/LoginPage";
import { Loader2, LogOut, Gem, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";

// Main pages
import Dashboard from "./components/Dashboard";
import CustomerDashboard from "./components/CustomerDashboard";

import KPIPage from "./components/KPIPage";
import AlertsPage from "./components/AlertsPage";
import PendingPage from "./components/PendingPage";
import CustomersPage from "./components/CustomersPage";
import CompaniesPage from "./components/CompaniesPage";
import SuppliersPage from "./components/SuppliersPage";
import LabsPage from "./components/LabsPage";
import KYCPage from "./components/KYCPage";
import KYBPage from "./components/KYBPage";
import UBOPage from "./components/UBOPage";
import AssetsPage from "./components/AssetsPage";
import JoharIDPage from "./components/JoharIDPage";
import PassportsPage from "./components/PassportsPage";
import InventoryPage from "./components/InventoryPage";
import LabPage from "./components/LabPage";
import AssayPage from "./components/AssayPage";
import EquipmentPage from "./components/EquipmentPage";
import LogisticsPage from "./components/LogisticsPage";
import CustodyPage from "./components/CustodyPage";
import WarehousesPage from "./components/WarehousesPage";
import FinancePage from "./components/FinancePage";
import InvoicesPage from "./components/InvoicesPage";
import PaymentsPage from "./components/PaymentsPage";
import MarketplacePage from "./components/MarketplacePage";
import OffersPage from "./components/OffersPage";
import NegotiationsPage from "./components/NegotiationsPage";
import AuctionsPage from "./components/AuctionsPage";
import CompliancePage from "./components/CompliancePage";
import AMLPage from "./components/AMLPage";
import SanctionsPage from "./components/SanctionsPage";
import SecurityPage from "./components/SecurityPage";
import ContractsPage from "./components/ContractsPage";
import NotaryPage from "./components/NotaryPage";
import LegalPage from "./components/LegalPage";
import AIPricingPage from "./components/AIPricingPage";
import AIFraudPage from "./components/AIFraudPage";
import AIRiskPage from "./components/AIRiskPage";
import SettingsPage from "./components/SettingsPage";
import UsersPage from "./components/UsersPage";
import RolesPage from "./components/RolesPage";
import AuditPage from "./components/AuditPage";
import SupportPage from "./components/SupportPage";
import HRPage from "./components/HRPage";

type Page =
  | "hr" | "dashboard" | "kpi" | "alerts" | "pending"
  | "customers" | "companies" | "suppliers" | "labs"
  | "kyc" | "kyb" | "ubo"
  | "assets" | "johar-id" | "passports" | "inventory"
  | "lab" | "assay" | "equipment"
  | "logistics" | "custody" | "warehouses"
  | "finance" | "invoices" | "payments"
  | "marketplace" | "offers" | "negotiations" | "auctions"
  | "compliance" | "aml" | "sanctions" | "security"
  | "contracts" | "notary" | "legal"
  | "ai-pricing" | "ai-fraud" | "ai-risk"
  | "settings" | "users" | "roles" | "audit" | "support";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { authed, loading, scope, me, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  // Sync HTML dir attribute whenever language changes
  // This ensures RTL/LTR is correct on every page without re-selecting
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  // On first load: apply dir based on whatever language i18n detected from localStorage
  const isRTL = i18n.language?.startsWith('ar');
  if (typeof document !== 'undefined') {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language || 'ar';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-johar-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 gold-text animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return showLogin ? (
      <LoginPage onGoGuest={() => setShowLogin(false)} />
    ) : (
      <GuestLandingPage onGoLogin={() => setShowLogin(true)} />
    );
  }

  if (scope === "consumer") {
    return (
      <div className="min-h-screen bg-johar-black text-johar-white" dir={isRTL ? "rtl" : "ltr"}>
        <header className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-sm border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                <img src="/logo.jpeg" alt="JOHAR Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-bold gold-text">JOHAR</h1>
                <p className="text-xs text-johar-gray-light">{t('dashboard')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select 
                className="bg-transparent border border-johar-gray-dark rounded text-sm p-1 text-johar-white"
                value={i18n.language?.substring(0, 2) || 'ar'}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
              <div className="text-sm text-end hidden sm:block">
                <p className="font-medium" dir="ltr">{me?.email as string}</p>
              </div>
              <button onClick={signOut} className="btn-secondary text-sm flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          <CustomerDashboard />
        </main>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":   return <Dashboard />;
      case "kpi":         return <KPIPage />;
      case "alerts":      return <AlertsPage />;
      case "pending":     return <PendingPage />;
      case "customers":   return <CustomersPage />;
      case "companies":   return <CompaniesPage />;
      case "suppliers":   return <SuppliersPage />;
      case "labs":        return <LabsPage />;
      case "kyc":         return <KYCPage />;
      case "kyb":         return <KYBPage />;
      case "ubo":         return <UBOPage />;
      case "assets":      return <AssetsPage />;
      case "johar-id":    return <JoharIDPage />;
      case "passports":   return <PassportsPage />;
      case "inventory":   return <InventoryPage />;
      case "lab":         return <LabPage />;
      case "assay":       return <AssayPage />;
      case "equipment":   return <EquipmentPage />;
      case "logistics":   return <LogisticsPage />;
      case "custody":     return <CustodyPage />;
      case "warehouses":  return <WarehousesPage />;
      case "finance":     return <FinancePage />;
      case "invoices":    return <InvoicesPage />;
      case "payments":    return <PaymentsPage />;
      case "marketplace": return <MarketplacePage />;
      case "offers":      return <OffersPage />;
      case "negotiations":return <NegotiationsPage />;
      case "auctions":    return <AuctionsPage />;
      case "compliance":  return <CompliancePage />;
      case "aml":         return <AMLPage />;
      case "sanctions":   return <SanctionsPage />;
      case "security":    return <SecurityPage />;
      case "contracts":   return <ContractsPage />;
      case "notary":      return <NotaryPage />;
      case "legal":       return <LegalPage />;
      case "ai-pricing":  return <AIPricingPage />;
      case "ai-fraud":    return <AIFraudPage />;
      case "ai-risk":     return <AIRiskPage />;
      case "settings":    return <SettingsPage />;
      case "hr":          return <HRPage />;
      case "users":       return <UsersPage />;
      case "roles":       return <RolesPage />;
      case "audit":       return <AuditPage />;
      case "support":     return <SupportPage />;
      default:            return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-johar-black text-johar-white" dir={isRTL ? "rtl" : "ltr"}>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar with mobile toggle logic handled inside Sidebar or wrapper here */}
      <div className={`fixed inset-y-0 z-50 transition-transform duration-300 lg:relative lg:translate-x-0 ${
        isRTL 
          ? (mobileMenuOpen ? "translate-x-0 right-0" : "translate-x-full right-0 lg:translate-x-0") 
          : (mobileMenuOpen ? "translate-x-0 left-0" : "-translate-x-full left-0 lg:translate-x-0")
      }`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page as Page);
            setMobileMenuOpen(false); // Close on mobile navigation
          }}
        />
      </div>

      <main className="flex-1 overflow-auto flex flex-col h-screen w-full relative z-0">
        <header className="sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                className="lg:hidden p-2 text-johar-gray-light hover:text-white"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-black text-johar-gold">JOHAR</h1>
                <p className="hidden md:block text-xs text-johar-gray-light tracking-wide uppercase">
                  Global Gold & Jewelry Digital Infrastructure
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <select 
                className="bg-white/5 border border-white/10 rounded-lg text-sm p-1.5 md:p-2 text-white outline-none focus:border-johar-gold"
                value={i18n.language?.substring(0, 2) || 'ar'}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>

              <button className="relative p-2 text-johar-gray-light hover:text-white hidden sm:block">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-johar-gold to-yellow-300 flex items-center justify-center text-black text-sm font-bold shadow-md">
                  A
                </div>
                <div className="hidden sm:block text-sm">
                  <p className="font-bold">{t('super_admin')}</p>
                </div>
              </div>

              <button onClick={signOut} className="btn-secondary text-sm flex items-center gap-2 px-3 py-1.5">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 pb-24">{renderPage()}</div>
      </main>
    </div>
  );
}



