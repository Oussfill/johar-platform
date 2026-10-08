const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerDashboard.tsx', 'utf8');

// The file has a lot of Arabic text. I will do a regex replacement for common words and add i18n
if (!code.includes('useTranslation')) {
  code = "import { useTranslation } from 'react-i18next';\n" + code;
  code = code.replace(/export default function CustomerDashboard\(\) \{/, "export default function CustomerDashboard() {\n  const { t } = useTranslation();");
}

const replaces = [
  ['لوحة تحكم العميل', 'customer.dashboardTitle'],
  ['مرحباً بك في منصة جوهر للأصول الرقمية.', 'customer.welcomeMsg'],
  ['الأصول المملوكة', 'customer.ownedAssets'],
  ['إجمالي الأصول', 'customer.totalAssets'],
  ['إجمالي القيمة (تقديري)', 'customer.totalValue'],
  ['الطلبات النشطة', 'customer.activeOrders'],
  ['إضافة أصل جديد', 'customer.addNewAsset'],
  ['الرمز', 'customer.code'],
  ['الاسم', 'customer.name'],
  ['الوزن', 'customer.weight'],
  ['العيار', 'customer.grade'],
  ['الحالة', 'customer.status'],
  ['إجراءات', 'customer.actions'],
  ['عرض للبيع', 'customer.offerForSale'],
  ['طلب فحص', 'customer.requestAssay'],
  ['طلب نقل', 'customer.requestTransport'],
  ['حذف/إلغاء', 'customer.deleteCancel'],
  ['سجل الطلبات (السوق)', 'customer.orderHistory'],
  ['لا توجد طلبات حالية', 'customer.noOrders'],
  ['إلغاء الطلب', 'customer.cancelOrder'],
  ['إضافة أصل جديد', 'customer.addNewAssetTitle'],
  ['نوع الأصل', 'customer.assetType'],
  ['ذهب', 'customer.gold'],
  ['فضة', 'customer.silver'],
  ['الاسم / الوصف', 'customer.nameDesc'],
  ['سبيكة ذهب 100 جرام', 'customer.placeholderGold'],
  ['الوزن (جرام)', 'customer.weightGrams'],
  ['موقع التخزين', 'customer.storageLoc'],
  ['إلغاء', 'customer.cancelBtn'],
  ['حفظ', 'customer.saveBtn'],
  ['عرض للسوق - إنشاء عرض', 'customer.marketOfferTitle'],
  ['اختر الأصل الموثق', 'customer.selectAsset'],
  ['-- اختر من أصولك --', 'customer.selectAssetPlaceholder'],
  ['السعر المطلوب (USD)', 'customer.askingPrice'],
  ['طرح بالسوق', 'customer.publishMarketBtn'],
  ['طلب فحص مختبر', 'customer.labAssayTitle'],
  ['نوع الفحص', 'customer.testType'],
  ['فحص نقاء', 'customer.purityTest'],
  ['إصدار هوية (Johar ID)', 'customer.issueJoharId'],
  ['تقديم الطلب', 'customer.submitRequestBtn'],
  ['طلب نقل عهدة', 'customer.transportTitle'],
  ['الوجهة المطلوبة', 'customer.destination'],
  ['مثال: مستودع دبي المركزي', 'customer.destinationPlaceholder']
];

for (const [ar, key] of replaces) {
  // Replace plain text in JSX
  const regexText = new RegExp(ar, 'g');
  code = code.replace(regexText, `{t('${key}', '${ar}')}`);
  
  // Replace attributes like placeholder="موقع التخزين"
  const attrRegex = new RegExp(`placeholder="\\{t\\('${key}', '${ar}'\\)\\}"`, 'g');
  code = code.replace(attrRegex, `placeholder={t('${key}', '${ar}')}`);
}

fs.writeFileSync('src/components/CustomerDashboard.tsx', code);

// Now update translation files
const path = require('path');
const enTrans = {
  dashboardTitle: "Customer Dashboard",
  welcomeMsg: "Welcome to JOHAR Digital Assets Platform.",
  ownedAssets: "Owned Assets",
  totalAssets: "Total Assets",
  totalValue: "Total Value (Est.)",
  activeOrders: "Active Orders",
  addNewAsset: "Add New Asset",
  code: "Code",
  name: "Name",
  weight: "Weight",
  grade: "Grade",
  status: "Status",
  actions: "Actions",
  offerForSale: "Offer for Sale",
  requestAssay: "Request Assay",
  requestTransport: "Request Transport",
  deleteCancel: "Delete/Cancel",
  orderHistory: "Order History (Market)",
  noOrders: "No current orders",
  cancelOrder: "Cancel Order",
  addNewAssetTitle: "Add New Asset",
  assetType: "Asset Type",
  gold: "Gold",
  silver: "Silver",
  nameDesc: "Name / Description",
  placeholderGold: "100g Gold Bar",
  weightGrams: "Weight (Grams)",
  storageLoc: "Storage Location",
  cancelBtn: "Cancel",
  saveBtn: "Save",
  marketOfferTitle: "Offer to Market - Create Offer",
  selectAsset: "Select Verified Asset",
  selectAssetPlaceholder: "-- Select from your assets --",
  askingPrice: "Asking Price (USD)",
  publishMarketBtn: "Publish to Market",
  labAssayTitle: "Request Lab Assay",
  testType: "Test Type",
  purityTest: "Purity Test",
  issueJoharId: "Issue Identity (Johar ID)",
  submitRequestBtn: "Submit Request",
  transportTitle: "Request Custody Transfer",
  destination: "Required Destination",
  destinationPlaceholder: "e.g., Dubai Central Vault"
};

const frTrans = {
  dashboardTitle: "Tableau de Bord Client",
  welcomeMsg: "Bienvenue sur la plateforme d'actifs numériques JOHAR.",
  ownedAssets: "Actifs Possédés",
  totalAssets: "Total des Actifs",
  totalValue: "Valeur Totale (Est.)",
  activeOrders: "Commandes Actives",
  addNewAsset: "Ajouter un Actif",
  code: "Code",
  name: "Nom",
  weight: "Poids",
  grade: "Qualité",
  status: "Statut",
  actions: "Actions",
  offerForSale: "Mettre en Vente",
  requestAssay: "Demander une Analyse",
  requestTransport: "Demander un Transport",
  deleteCancel: "Supprimer/Annuler",
  orderHistory: "Historique des Commandes",
  noOrders: "Aucune commande en cours",
  cancelOrder: "Annuler la Commande",
  addNewAssetTitle: "Ajouter un Actif",
  assetType: "Type d'Actif",
  gold: "Or",
  silver: "Argent",
  nameDesc: "Nom / Description",
  placeholderGold: "Lingot d'or 100g",
  weightGrams: "Poids (Grammes)",
  storageLoc: "Lieu de Stockage",
  cancelBtn: "Annuler",
  saveBtn: "Enregistrer",
  marketOfferTitle: "Offre sur le Marché - Créer",
  selectAsset: "Sélectionner un Actif Vérifié",
  selectAssetPlaceholder: "-- Sélectionnez parmi vos actifs --",
  askingPrice: "Prix Demandé (USD)",
  publishMarketBtn: "Publier sur le Marché",
  labAssayTitle: "Demander une Analyse en Labo",
  testType: "Type de Test",
  purityTest: "Test de Pureté",
  issueJoharId: "Émettre l'Identité (Johar ID)",
  submitRequestBtn: "Soumettre la Demande",
  transportTitle: "Demander un Transfert de Garde",
  destination: "Destination Requise",
  destinationPlaceholder: "ex: Chambre Forte Centrale de Dubaï"
};

for (const [lang, translations] of Object.entries({ en: enTrans, fr: frTrans })) {
  const file = path.join('src', 'locales', `${lang}.json`);
  let json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.customer = translations;
  fs.writeFileSync(file, JSON.stringify(json, null, 2));
}

console.log('Customer Dashboard translations applied.');
