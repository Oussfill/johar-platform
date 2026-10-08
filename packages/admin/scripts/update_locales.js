const fs = require('fs');
const path = require('path');

const localesPath = path.resolve(__dirname, '../src/locales');

const arAdditions = {
  "dashboard": "لوحة التحكم",
  "kpi": "مؤشرات الأداء",
  "alerts": "التنبيهات",
  "pending": "العمليات المعلقة",
  "customers": "العملاء",
  "companies": "الشركات",
  "suppliers": "الموردون",
  "labs": "المختبرات",
  "kyc": "توثيق KYC",
  "kyb": "توثيق KYB",
  "ubo": "المالكون الفعليون",
  "assets": "الأصول",
  "johar_id": "هويات JOHAR",
  "passports": "جوازات رقمية",
  "inventory": "المخزون",
  "lab": "المختبر",
  "assay": "نتائج الفحص",
  "equipment": "المعدات",
  "logistics": "اللوجستيات",
  "custody": "العهدة",
  "warehouses": "المستودعات",
  "finance": "المالية",
  "invoices": "الفواتير",
  "payments": "المدفوعات",
  "marketplace": "السوق",
  "offers": "العروض",
  "negotiations": "التفاوض",
  "auctions": "المزادات",
  "compliance": "الامتثال",
  "aml": "مكافحة غسل الأموال",
  "sanctions": "قوائم العقوبات",
  "security": "سجلات الأمان",
  "contracts": "العقود",
  "notary": "كاتب العدل",
  "legal": "القضايا القانونية",
  "ai_pricing": "التسعير الذكي",
  "ai_fraud": "كشف الاحتيال",
  "ai_risk": "تقييم المخاطر",
  "settings": "الإعدادات",
  "users": "المستخدمون",
  "roles": "الصلاحيات",
  "audit": "سجل المراجعة",
  "support": "الدعم الفني",
  "logout": "تسجيل الخروج",
  "hr": "الموارد البشرية"
};

const enAdditions = {
  "dashboard": "Dashboard",
  "kpi": "KPIs",
  "alerts": "Alerts",
  "pending": "Pending Operations",
  "customers": "Customers",
  "companies": "Companies",
  "suppliers": "Suppliers",
  "labs": "Laboratories",
  "kyc": "KYC Verification",
  "kyb": "KYB Verification",
  "ubo": "UBO Records",
  "assets": "Assets",
  "johar_id": "JOHAR IDs",
  "passports": "Digital Passports",
  "inventory": "Inventory",
  "lab": "Laboratory",
  "assay": "Assay Results",
  "equipment": "Equipment",
  "logistics": "Logistics",
  "custody": "Custody",
  "warehouses": "Warehouses",
  "finance": "Finance",
  "invoices": "Invoices",
  "payments": "Payments",
  "marketplace": "Marketplace",
  "offers": "Offers",
  "negotiations": "Negotiations",
  "auctions": "Auctions",
  "compliance": "Compliance",
  "aml": "AML Checks",
  "sanctions": "Sanctions List",
  "security": "Security Logs",
  "contracts": "Contracts",
  "notary": "Notary",
  "legal": "Legal Cases",
  "ai_pricing": "AI Pricing",
  "ai_fraud": "Fraud Detection",
  "ai_risk": "Risk Assessment",
  "settings": "Settings",
  "users": "Users",
  "roles": "Roles",
  "audit": "Audit Log",
  "support": "Support",
  "logout": "Logout",
  "hr": "HR"
};

const frAdditions = {
  "dashboard": "Tableau de Bord",
  "kpi": "Indicateurs",
  "alerts": "Alertes",
  "pending": "Opérations en Attente",
  "customers": "Clients",
  "companies": "Sociétés",
  "suppliers": "Fournisseurs",
  "labs": "Laboratoires",
  "kyc": "Vérification KYC",
  "kyb": "Vérification KYB",
  "ubo": "Bénéficiaires Réels",
  "assets": "Actifs",
  "johar_id": "IDs JOHAR",
  "passports": "Passeports Numériques",
  "inventory": "Inventaire",
  "lab": "Laboratoire",
  "assay": "Résultats d'Essai",
  "equipment": "Équipement",
  "logistics": "Logistique",
  "custody": "Garde",
  "warehouses": "Entrepôts",
  "finance": "Finance",
  "invoices": "Factures",
  "payments": "Paiements",
  "marketplace": "Marché",
  "offers": "Offres",
  "negotiations": "Négociations",
  "auctions": "Enchères",
  "compliance": "Conformité",
  "aml": "Lutte Anti-Blanchiment",
  "sanctions": "Listes de Sanctions",
  "security": "Journaux de Sécurité",
  "contracts": "Contrats",
  "notary": "Notaire",
  "legal": "Affaires Juridiques",
  "ai_pricing": "Tarification IA",
  "ai_fraud": "Détection de Fraude",
  "ai_risk": "Évaluation des Risques",
  "settings": "Paramètres",
  "users": "Utilisateurs",
  "roles": "Rôles",
  "audit": "Journal d'Audit",
  "support": "Support",
  "logout": "Déconnexion",
  "hr": "RH"
};

function updateLocale(file, additions) {
  const filePath = path.join(localesPath, file);
  let data = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      data = JSON.parse(content);
    } catch (e) {
      console.log(`Error parsing ${file}, starting fresh`);
    }
  } else {
    fs.mkdirSync(localesPath, { recursive: true });
  }
  
  data = { ...data, ...additions };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${file}`);
}

updateLocale('ar.json', arAdditions);
updateLocale('en.json', enAdditions);
updateLocale('fr.json', frAdditions);
