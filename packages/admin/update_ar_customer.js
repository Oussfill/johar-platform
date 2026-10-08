const fs = require('fs');
const path = require('path');
const arTrans = {
  dashboardTitle: "لوحة تحكم العميل",
  welcomeMsg: "مرحباً بك في منصة جوهر للأصول الرقمية",
  ownedAssets: "الأصول المملوكة",
  totalAssets: "إجمالي الأصول",
  totalValue: "القيمة الإجمالية (تقديري)",
  activeOrders: "الطلبات النشطة",
  addNewAsset: "إضافة أصل جديد",
  code: "الرمز",
  name: "الاسم",
  weight: "الوزن",
  grade: "العيار",
  status: "الحالة",
  actions: "إجراءات",
  offerForSale: "عرض للسوق",
  requestAssay: "طلب فحص مختبر",
  requestTransport: "طلب نقل عهدة",
  deleteCancel: "حذف/إلغاء",
  orderHistory: "سجل الطلبات (السوق)",
  noOrders: "لا توجد طلبات حالية",
  cancelOrder: "إلغاء الطلب",
  addNewAssetTitle: "إضافة أصل جديد",
  assetType: "نوع الأصل",
  gold: "ذهب",
  silver: "فضة",
  nameDesc: "الاسم / الوصف",
  placeholderGold: "سبيكة ذهب 100 جرام",
  weightGrams: "الوزن (جرام)",
  storageLoc: "موقع التخزين",
  cancelBtn: "إلغاء",
  saveBtn: "حفظ",
  marketOfferTitle: "عرض للسوق - إنشاء عرض",
  selectAsset: "اختر الأصل الموثق",
  selectAssetPlaceholder: "-- اختر من أصولك --",
  askingPrice: "السعر المطلوب (USD)",
  publishMarketBtn: "طرح بالسوق",
  labAssayTitle: "طلب فحص مختبر",
  testType: "نوع الفحص",
  purityTest: "فحص نقاء",
  issueJoharId: "إصدار هوية (Johar ID)",
  submitRequestBtn: "تقديم الطلب",
  transportTitle: "طلب نقل عهدة",
  destination: "الوجهة المطلوبة",
  destinationPlaceholder: "مثال: مستودع دبي المركزي",
  noAssets: "لا توجد أصول مسجلة",
  confirmDelete: "هل أنت متأكد من حذف هذا الأصل؟"
};

const file = path.join('src', 'locales', 'ar.json');
let json = JSON.parse(fs.readFileSync(file, 'utf8'));
json.customer = arTrans;
fs.writeFileSync(file, JSON.stringify(json, null, 2));

console.log('Arabic customer dashboard translations applied.');
