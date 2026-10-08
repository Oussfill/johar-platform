const fs = require('fs');
const path = require('path');

const newArKeys = {
  "navServices": "خدماتنا",
  "navSecurity": "الأمان",
  "navAbout": "عن جوهر",
  "badge": "منصة التداول المؤسسي",
  "heroTitle1": "مستقبل تداول",
  "heroTitle2": "الذهب والمجوهرات",
  "heroSubtitle": "منظومة رقمية متكاملة لرقمنة، تداول، وحفظ الذهب والمجوهرات بمعايير مؤسسية وأمنية فائقة. نجمع بين الأسواق، المختبرات، والخدمات اللوجستية في منصة واحدة.",
  "explore": "الدخول للمنصة",
  "learnMore": "اكتشف المزيد",
  "unifiedPlatform": "خدمات أعمال متكاملة",
  "unifiedDesc": "بنية تحتية رقمية شاملة لدورة حياة الأصول، من الفحص المخبري وحتى التسليم النهائي.",
  "srvIdentity": "الهوية الرقمية",
  "srvIdentityDesc": "إصدار جوازات سفر رقمية وشهادات ملكية موثقة وغير قابلة للتزوير لكل أصل ذهبي.",
  "srvMarketplace": "السوق والمزادات",
  "srvMarketplaceDesc": "تداول آمن بين الشركات (B2B)، تقديم عروض، وتنظيم مزادات حية موثقة.",
  "srvCompliance": "الامتثال والمخاطر",
  "srvComplianceDesc": "نظام متقدم للتحقق من الهويات (KYC) وفحص العقوبات لضمان بيئة تداول آمنة.",
  "srvLogistics": "الخدمات اللوجستية",
  "srvLogisticsDesc": "إدارة آمنة لحركة النقل، نقل العهدة، والتخزين الموثق في الخزائن المعتمدة.",
  "srvLab": "ربط المختبرات",
  "srvLabDesc": "تسجيل نتائج الفحص المخبري والعيارات بشكل مباشر وموثوق من قبل مختبرات معتمدة.",
  "srvFinance": "الإدارة المالية",
  "srvFinanceDesc": "إدارة متكاملة للفواتير، المدفوعات، وتسويات العقود مع تقارير أداء لحظية.",
  "securityTitle1": "مبنية على أسس",
  "securityTitle2": "الثقة والأمان المطلق",
  "securityDesc": "الأمان هو جوهر عملنا. نطبق أقصى معايير العزل وحماية البيانات لضمان خصوصية مطلقة لمعلومات شركتك وأصولك التجارية.",
  "secIsolation": "عزل تام للبيانات",
  "secIsolationDesc": "خصوصية مطلقة لبيانات كل شركة أو كيان تجاري دون أي تداخل.",
  "secRbac": "تحكم دقيق بالصلاحيات",
  "secRbacDesc": "نظام أدوار متقدم يضمن وصول كل موظف وشريك لما يخصه فقط.",
  "secAudit": "سجل تدقيق شامل",
  "secAuditDesc": "توثيق دقيق لكل حركة أو تغيير في النظام لضمان الشفافية والمساءلة.",
  "certTitle": "أعلى معايير الاعتماد",
  "certSubtitle": "درجة أمان مؤسسية",
  "techEncryption": "التشفير",
  "techEncryptionVal": "معايير بنكية متقدمة",
  "techAuth": "المصادقة",
  "techAuthVal": "تحقق أمني صارم",
  "techAudit": "المراقبة",
  "techAuditVal": "أنظمة تدقيق مستمرة 24/7",
  "ctaTitle": "هل أنت مستعد لرقمنة أعمالك؟",
  "ctaSubtitle": "انضم إلى المعيار الجديد في إدارة وتداول الذهب والمجوهرات عالمياً.",
  "enterPlatform": "ابدأ الآن مع جوهر",
  "copyright": "منصة جوهر. جميع الحقوق محفوظة.",
  "privacy": "الخصوصية",
  "terms": "الشروط",
  "compliancePolicy": "الامتثال"
};

const arPath = path.join('src', 'locales', 'ar.json');
let arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));

arJson.landing = { ...(arJson.landing || {}), ...newArKeys };

fs.writeFileSync(arPath, JSON.stringify(arJson, null, 2));
console.log('Arabic translations updated successfully.');
