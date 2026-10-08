// ============================================================================
// جوهر - Arabic PowerPoint Presentation Generator
// ============================================================================
// ينشئ عرضًا تقديميًا كاملاً بالعربية مع لقطات شاشة حقيقية من الموقع
// التشغيل: node scripts/generate-pptx.js

const pptxgen = require('pptxgenjs');
const sizeOf = require('image-size');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, 'ppt-assets');
const LOGO = path.join(__dirname, '..', 'logo.jpeg');
const OUTPUT = path.join(__dirname, '..', 'Johar-Presentation.pptx');

// ─── Brand Colors (6-digit hex RGB only — pptxgenjs requirement) ─────────────
const GOLD = 'C6A969';
const GOLD_DARK = 'A67C00';
const GOLD_LIGHT = 'E0D5C1';
const BG_DARK = '0A0A0F';
const BG_CARD = '141420';
const TEXT_LIGHT = 'E8E8F0';
const TEXT_MUTED = '8A8A9A';
const GREEN = '3CB97E';
const RED = 'DC3545';

// Pre-computed blended border colors (avoid dynamic string concat that
// produces invalid 8-digit hex like C6A96933)
const BORDER_GOLD_SUB = '3A3424';   // ~26% gold on dark card
const BORDER_GOLD_SOFT = '2A2820';   // ~20% gold
const BORDER_GOLD_MID = '4F472F';    // ~40% gold
const BORDER_GREEN = '1E4A34';       // ~26% green
const BORDER_GRAY = '4A4A52';        // ~26% gray

// Map role colors to pre-computed borders
const ROLE_BORDERS = {
  SA: '4F472F', OM: '334F6B', LA: '6B4F24', NO: '4A3F6B',
  VM: '244F4B', DR: '6B4F1F', ME: BORDER_GREEN, CU: BORDER_GRAY, AU: '6B2A2A',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function addImageFit(slide, imgPath, x, y, w, h) {
  let dims;
  try {
    const buf = fs.readFileSync(imgPath);
    dims = sizeOf.imageSize ? sizeOf.imageSize(buf) : sizeOf(buf);
  } catch (e) {
    dims = { width: 1440, height: 900 };
  }
  const ar = dims.width / dims.height;
  const boxAr = w / h;
  let dw, dh;
  if (ar > boxAr) {
    dw = w; dh = w / ar;
  } else {
    dh = h; dw = h * ar;
  }
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  slide.addImage({ path: imgPath, x: dx, y: dy, w: dw, h: dh, sizing: { type: 'cover', w, h } });
}

function header(slide, pptx, title, subtitle) {
  slide.background = { color: BG_DARK };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 1.15,
    fill: { color: BG_DARK },
    line: { color: BG_DARK, width: 0 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 1.15, w: '100%', h: 0.03,
    fill: { color: GOLD },
    line: { color: GOLD, width: 0 },
  });
  slide.addImage({
    path: LOGO,
    x: 12.05, y: 0.15, w: 0.85, h: 0.85,
    sizing: { type: 'contain', w: 0.85, h: 0.85 },
  });
  slide.addText(title, {
    x: 0.5, y: 0.12, w: 11.4, h: 0.62,
    fontSize: 26, bold: true, color: GOLD, align: 'right',
    fontFace: 'Arial', rtlMode: true,
  });
  slide.addText(subtitle, {
    x: 0.5, y: 0.66, w: 11.4, h: 0.44,
    fontSize: 13, color: TEXT_MUTED, align: 'right',
    fontFace: 'Arial', rtlMode: true,
  });
  slide.addText('جوهر — البنية التحتية الرقمية العالمية للذهب والمعادن الثمينة', {
    x: 0.5, y: 7.12, w: 12.5, h: 0.3,
    fontSize: 9, color: TEXT_MUTED, align: 'center',
    fontFace: 'Arial', rtlMode: true,
  });
}

function bulletBox(slide, pptx, items, x, y, w, h, opts = {}) {
  const fontSize = opts.fontSize || 14;
  const gap = opts.gap || 0.52;
  items.forEach((item, i) => {
    const iy = y + (i * gap);
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + w - 0.22, y: iy + 0.13, w: 0.1, h: 0.1,
      fill: { color: GOLD },
      line: { color: GOLD, width: 0 },
    });
    slide.addText(item, {
      x: x, y: iy, w: w - 0.32, h: gap,
      fontSize, color: opts.color || TEXT_LIGHT, align: 'right',
      fontFace: 'Arial', valign: 'top', rtlMode: true,
    });
  });
}

function infoPanel(slide, pptx, title, items, x, y, w, h, fontSize, gap) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: BG_CARD },
    line: { color: BORDER_GOLD_SUB, width: 1 },
  });
  slide.addText(title, {
    x: x + 0.1, y: y + 0.15, w: w - 0.2, h: 0.45,
    fontSize: 16, bold: true, color: GOLD, align: 'right',
    fontFace: 'Arial', rtlMode: true,
  });
  bulletBox(slide, pptx, items, x + 0.2, y + 0.7, w - 0.4, h - 0.85, { fontSize: fontSize || 12, gap: gap || 0.72 });
}

function statCard(slide, pptx, x, y, w, h, value, label, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: BG_CARD },
    line: { color: BORDER_GOLD_MID, width: 1 },
  });
  slide.addText(value, {
    x, y: y + 0.1, w, h: 0.55,
    fontSize: 26, bold: true, color, align: 'center',
    fontFace: 'Arial',
  });
  slide.addText(label, {
    x, y: y + 0.62, w, h: 0.3,
    fontSize: 11, color: TEXT_MUTED, align: 'center',
    fontFace: 'Arial', rtlMode: true,
  });
}

function screenshotSlide(pptx, title, subtitle, imgFile, panelTitle, panelItems, panelFontSize) {
  const s = pptx.addSlide();
  header(s, pptx, title, subtitle);
  addImageFit(s, path.join(ASSETS, imgFile), 0.45, 1.45, 8.3, 5.45);
  infoPanel(s, pptx, panelTitle, panelItems, 9.0, 1.45, 3.85, 5.45, panelFontSize, 0.72);
  return s;
}

// ─── Create Presentation ────────────────────────────────────────────────────
(async () => {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'WIDE';
  pptx.author = 'جوهر';
  pptx.company = 'جوهر';
  pptx.title = 'منصة جوهر — عرض تقديمي شامل';
  pptx.subject = 'البنية التحتية الرقمية العالمية للذهب والمعادن الثمينة';
  pptx.rtlMode = true;

  // ═════════════════ SLIDE 1: Title ═════════════════
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };

    s.addImage({
      path: LOGO,
      x: 5.57, y: 0.55, w: 2.2, h: 2.2,
      sizing: { type: 'contain', w: 2.2, h: 2.2 },
    });

    s.addText('جوهر', {
      x: 0.5, y: 3.15, w: 12.33, h: 0.9,
      fontSize: 48, bold: true, color: GOLD, align: 'center',
      fontFace: 'Arial', rtlMode: true,
    });
    s.addText('البنية التحتية الرقمية العالمية للذهب والمعادن الثمينة', {
      x: 0.5, y: 4.05, w: 12.33, h: 0.6,
      fontSize: 22, color: GOLD_LIGHT, align: 'center',
      fontFace: 'Arial', rtlMode: true,
    });
    s.addText('Infrastructure Numerique Mondiale pour l\'Or et les Metaux Precieux', {
      x: 0.5, y: 4.62, w: 12.33, h: 0.4,
      fontSize: 13, italic: true, color: TEXT_MUTED, align: 'center',
      fontFace: 'Arial',
    });

    s.addShape(pptx.ShapeType.rect, {
      x: 4.17, y: 5.25, w: 5, h: 0.02,
      fill: { color: GOLD }, line: { color: GOLD, width: 0 },
    });

    const pills = ['ISO/IEC 17025', 'ISO 27001', 'Zero-Trust', 'AR | FR | EN', 'DZD | EUR | USD'];
    pills.forEach((p, i) => {
      const pw = 2.0;
      const px = 0.85 + (i % 5) * 2.35;
      s.addShape(pptx.ShapeType.roundRect, {
        x: px, y: 5.55, w: pw, h: 0.42, rectRadius: 0.21,
        fill: { color: '1A1A24' },
        line: { color: BORDER_GOLD_MID, width: 1 },
      });
      s.addText(p, {
        x: px, y: 5.55, w: pw, h: 0.42,
        fontSize: 11, color: GOLD, align: 'center', valign: 'middle',
        fontFace: 'Arial',
      });
    });

    statCard(s, pptx, 1.17, 6.25, 3.3, 1.0, '34', 'صفحة تشغيلية متكاملة', GOLD);
    statCard(s, pptx, 5.02, 6.25, 3.3, 1.0, '9', 'أدوار بصلاحيات دقيقة', GREEN);
    statCard(s, pptx, 8.87, 6.25, 3.3, 1.0, '23+', 'نقطة نهاية API', TEXT_LIGHT);

    s.addText('عرض تقديمي رسمي — 2026', {
      x: 0.5, y: 7.15, w: 12.33, h: 0.3,
      fontSize: 10, color: TEXT_MUTED, align: 'center',
      fontFace: 'Arial', rtlMode: true,
    });
  }

  // ═════════════════ SLIDE 2: Landing ═════════════════
  screenshotSlide(pptx,
    'نظرة عامة على المنصة', 'الصفحة الرئيسية العامة — واجهة الترحيب بالزوار',
    '01-landing.png', 'أبرز المزايا',
    [
      'تداول وتوثيق وتمليك الأصول الذهبية',
      'التحقق عبر QR و NFC من الأصالة',
      'دعم 3 لغات مع RTL كامل للعربية',
      'أسعار بـ 3 عملات (دينار/يورو/دولار)',
      'سوق إلكتروني بمعايير ISO 17025',
      'أمان Zero-Trust وتشفير شامل',
    ], 12);

  // ═════════════════ SLIDE 3: Login ═════════════════
  screenshotSlide(pptx,
    'تسجيل الدخول والأمان', 'واجهة الدخول مع دعم المصادقة الثنائية MFA',
    '02-login.png', 'طبقات الأمان',
    [
      'كلمات مرور مشفرة بـ bcrypt (12 دورة)',
      'رموز JWT بصلاحية زمنية محدودة',
      'مصادقة ثنائية TOTP اختيارية',
      'قفل الحساب بعد 5 محاولات فاشلة',
      'مقاومة هجمات Timing Attacks',
      'تسجيل كل محاولة دخول في Audit Log',
    ], 11.5);

  // ═════════════════ SLIDE 4: Dashboard ═════════════════
  screenshotSlide(pptx,
    'لوحة التحكم الرئيسية', 'نظرة شاملة على الأصول والخزائن والتنبيهات',
    '03-dashboard.png', 'مؤشرات حية',
    [
      'إجمالي الأصول والأصول النشطة',
      'عدد الخزائن والمخازن',
      'تنبيهات الاحتيال (آخر 7 أيام)',
      'العمليات المعلقة والفحوصات',
      'توزيع الأصول حسب الحالة والمعدن',
      'سجل الأحداث لحظيًا',
    ], 12);

  // ═════════════════ SLIDE 5: Marketplace ═════════════════
  screenshotSlide(pptx,
    'السوق الإلكتروني', 'تصفح وشراء أصول ذهبية موثقة ومعتمدة',
    '04-marketplace.png', 'مزايا السوق',
    [
      'أصول مضمونة الأصالة 100%',
      'تفصيل شفاف للسعر (معدن + تصنيع + شهادة)',
      'فلترة حسب نوع المعدن والقيراط',
      'دعم B2C و B2B و B2G',
      'تسعير مرجعي مرتبط بسعر الذهب',
      'إثبات ملكية عبر Blockchain',
    ], 11.5);

  // ═════════════════ SLIDE 6: Asset Registry ═════════════════
  screenshotSlide(pptx,
    'سجل الأصول الرقمي', 'معرف فريد Gold ID لكل قطعة مادية',
    '05-erp-assets.png', 'مبادئ السجل',
    [
      'أصل مادي واحد = هوية رقمية واحدة',
      'سجل قابل للتتبع عبر الزمن',
      'دقة الملاعبة والوزن معتمدة مخبريًا',
      'جواز رقمي شامل لكل قطعة',
      'تسجيل سلسلة الحيازة كاملة',
      'ربط بالأدلة المشفرة Blockchain',
    ], 12);

  // ═════════════════ SLIDE 7: Vaults ═════════════════
  screenshotSlide(pptx,
    'الخزائن والمخازن', 'إدارة مراكز الحفظ والحيازة المادية',
    '06-erp-vaults.png', 'إدارة الحيازة',
    [
      'خزائن ومخازن مرتبطة بالأصول',
      'تتبع لحظي لحركة كل قطعة',
      'نقل معتمد ثنائي التوقيع',
      'سلسلة حيازة غير قابلة للكسر',
      'ضبط المخزون والمطابقة الدورية',
      'عتبة اعتماد مزدوج > 50,000 دولار',
    ], 11.5);

  // ═════════════════ SLIDE 8: Custody Chain ═════════════════
  screenshotSlide(pptx,
    'سلسلة الحيازة', 'تتبع كامل من المصنع إلى المالك النهائي',
    '07-custody-chain.png', 'تتبع الأصول',
    [
      'سجل زمني غير قابل للتعديل',
      'كل تغيير حيازة موثق وموقع',
      'تدقيق مستقل عبر دور المفتش',
      'إشعارات للعمليات الحرجة',
      'أدلة مشفرة على Blockchain',
      'فصل مهام SoD بين الأدوار',
    ], 12);

  // ═════════════════ SLIDE 9: Finance ═════════════════
  screenshotSlide(pptx,
    'الإدارة المالية والخزينة', 'محرك التسعير والفوترة والضمان المالي',
    '08-finance-treasury.png', 'الأدوات المالية',
    [
      'محرك تسعير مرتبط بسعر الذهب العالمي',
      'ضمان مالي Escrow للمعاملات',
      'فوترة تلقائية مع ضرائب ورسوم',
      'دعم DZD و EUR و USD',
      'أربع عيون للعمليات > 50,000$',
      'تقارير مالية قابلة للتدقيق',
    ], 11.5);

  // ═════════════════ SLIDE 10: Fraud Detection ═════════════════
  screenshotSlide(pptx,
    'كشف الاحتيال بالذكاء الاصطناعي', 'محرك ذكي لتحليل المخاطر والشذوذ',
    '09-security-fraud.png', 'الحماية الذكية',
    [
      'تحليل المخاطر بدرجات دقيقة (0-100)',
      'تصنيف: منخفض / متوسط / عالي / حرج',
      'مراجعة بشرية للتنبيهات الحرجة',
      'إخلاء مسؤولية AI مع كل تقرير',
      'تتبع أنماط الشذوذ المختلفة',
      'تنبيهات فورية للفريق الأمني',
    ], 12);

  // ═════════════════ SLIDE 11: Compliance ═════════════════
  screenshotSlide(pptx,
    'الامتثال — KYC / AML', 'التحقق من الهوية ومكافحة غسل الأموال',
    '10-compliance.png', 'الامتثال',
    [
      'التحقق من هوية العملاء KYC',
      'مكافحة غسل الأموال AML',
      'حالات: لم يبدأ / قيد المراجعة / موثق',
      'مطابقة مع ISO 27001',
      'تدقيق كامل لكل العمليات',
      'توافق مع المعايير الدولية',
    ], 12);

  // ═════════════════ SLIDE 12: System Monitor ═════════════════
  screenshotSlide(pptx,
    'مراقبة النظام', 'صحة الخدمة والتكاملات في الوقت الفعلي',
    '11-system-monitor.png', 'المؤشرات',
    [
      'حالة قاعدة البيانات لحظيًا',
      'مدة تشغيل الخدمة Uptime',
      'استهلاك الذاكرة والمعالج',
      'الاتصالات النشطة',
      'حالة التكاملات الخارجية',
      'اتفاقيات مستوى الخدمة SLA',
    ], 12);

  // ═════════════════ SLIDE 13: Admin Products ═════════════════
  screenshotSlide(pptx,
    'إدارة المنتجات', 'لوحة تحكم كاملة للمنتجات والاستفسارات',
    '12-admin-products.png', 'إدارة كاملة',
    [
      'إضافة وتعديل وحذف المنتجات',
      'إدارة استفسارات العملاء',
      'صور وأوصاف متعددة اللغات',
      'تسعير بعملات متعددة',
      'فلاتر وتصنيفات دقيقة',
      'إحصائيات مشاهدات وتفاعل',
    ], 12);

  // ═════════════════ SLIDE 14: Mobile ═════════════════
  {
    const s = pptx.addSlide();
    header(s, pptx, 'التوافق مع الهواتف', 'تصميم متجاوب بالكامل مع كل الأجهزة');
    addImageFit(s, path.join(ASSETS, '13-mobile.png'), 0.8, 1.5, 3.8, 5.3);

    s.addText('التجاوب الكامل', {
      x: 5.2, y: 1.7, w: 7.6, h: 0.6,
      fontSize: 20, bold: true, color: GOLD, align: 'right',
      fontFace: 'Arial', rtlMode: true,
    });
    bulletBox(s, pptx, [
      'قائمة جانبية منزلقة على الهاتف',
      'زر hamburger سهل الاستخدام',
      'جداول قابلة للتمرير أفقيًا',
      'دعم كامل للعربية RTL على الهاتف',
      'أداء سريع حتى على شبكات ضعيفة',
      'تجربة موحدة على سطح المكتب والهاتف',
    ], 5.2, 2.5, 7.5, 3.5, { fontSize: 15, gap: 0.78 });
  }

  // ═════════════════ SLIDE 15: RBAC ═════════════════
  {
    const s = pptx.addSlide();
    header(s, pptx, 'نظام الصلاحيات RBAC', '9 أدوار مع مصفوفة وصول دقيقة لكل صفحة');

    const roles = [
      { code: 'SA', ar: 'مدير النظام الأعلى', pages: '34' },
      { code: 'OM', ar: 'مدير العمليات', pages: '21' },
      { code: 'LA', ar: 'مدير المختبر', pages: '8' },
      { code: 'NO', ar: 'كاتب العدل', pages: '4' },
      { code: 'VM', ar: 'مدير الخزائن', pages: '9' },
      { code: 'DR', ar: 'الكاتب الرقمي', pages: '5' },
      { code: 'ME', ar: 'التاجر', pages: '8' },
      { code: 'CU', ar: 'الزبون', pages: '7' },
      { code: 'AU', ar: 'المفتش', pages: '17' },
    ];

    roles.forEach((r, i) => {
      const w = 3.9, h = 1.5;
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 0.55 + col * 4.15;
      const y = 1.6 + row * 1.75;

      s.addShape(pptx.ShapeType.roundRect, {
        x, y, w, h, rectRadius: 0.1,
        fill: { color: BG_CARD },
        line: { color: ROLE_BORDERS[r.code], width: 1.5 },
      });
      s.addShape(pptx.ShapeType.roundRect, {
        x: x + w - 1.05, y: y + 0.18, w: 0.85, h: 0.42, rectRadius: 0.21,
        fill: { color: GOLD },
      });
      s.addText(r.code, {
        x: x + w - 1.05, y: y + 0.18, w: 0.85, h: 0.42,
        fontSize: 14, bold: true, color: BG_DARK, align: 'center', valign: 'middle',
        fontFace: 'Arial',
      });
      s.addText(r.ar, {
        x: x + 0.15, y: y + 0.15, w: w - 1.25, h: 0.5,
        fontSize: 15, bold: true, color: TEXT_LIGHT, align: 'right',
        fontFace: 'Arial', rtlMode: true,
      });
      s.addText('الصفحات المسموحة: ' + r.pages, {
        x: x + 0.15, y: y + 0.75, w: w - 0.3, h: 0.4,
        fontSize: 12, color: TEXT_MUTED, align: 'right',
        fontFace: 'Arial', rtlMode: true,
      });
    });

    s.addText('الصلاحيات مفروضة على مستوى الخادم (Server-side RBAC) وليس الواجهة فقط — 17 مجموعة وصول مختلفة', {
      x: 0.55, y: 6.6, w: 12.23, h: 0.35,
      fontSize: 11, italic: true, color: GOLD, align: 'center',
      fontFace: 'Arial', rtlMode: true,
    });
  }

  // ═════════════════ SLIDE 16: Tech Stack ═════════════════
  {
    const s = pptx.addSlide();
    header(s, pptx, 'البنية التقنية', 'Full-Stack TypeScript — أمان على كل طبقة');

    const layers = [
      { t: 'React 19 + TypeScript', d: 'واجهة 34 صفحة — Vite — RTL كامل', icon: 'R' },
      { t: 'Express + Node.js', d: 'خادم API — 23+ نقطة نهاية — RBAC', icon: 'X' },
      { t: 'Prisma + PostgreSQL', d: 'قاعدة بيانات علائقية — 25+ جدول', icon: 'D' },
      { t: 'JWT + bcrypt + TOTP', d: 'مصادقة متعددة الطبقات — MFA', icon: 'S' },
      { t: 'Polygon Blockchain', d: 'أدلة مشفرة فقط — لا بيانات شخصية', icon: 'B' },
      { t: 'AI / ML Engine', d: 'كشف احتيال — تحليل مجوهرات', icon: 'A' },
    ];

    layers.forEach((l, i) => {
      const w = 5.95, h = 1.55;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.6 + col * 6.25;
      const y = 1.6 + row * 1.72;

      s.addShape(pptx.ShapeType.roundRect, {
        x, y, w, h, rectRadius: 0.1,
        fill: { color: BG_CARD },
        line: { color: BORDER_GOLD_SUB, width: 1 },
      });
      s.addShape(pptx.ShapeType.roundRect, {
        x: x + w - 1.15, y: y + 0.35, w: 0.85, h: 0.85, rectRadius: 0.15,
        fill: { color: '231F14' },
        line: { color: BORDER_GOLD_MID, width: 1 },
      });
      s.addText(l.icon, {
        x: x + w - 1.15, y: y + 0.35, w: 0.85, h: 0.85,
        fontSize: 26, bold: true, color: GOLD, align: 'center', valign: 'middle',
        fontFace: 'Arial',
      });
      s.addText(l.t, {
        x: x + 0.2, y: y + 0.25, w: w - 1.5, h: 0.5,
        fontSize: 15, bold: true, color: GOLD, align: 'right',
        fontFace: 'Arial',
      });
      s.addText(l.d, {
        x: x + 0.2, y: y + 0.8, w: w - 1.5, h: 0.55,
        fontSize: 12, color: TEXT_MUTED, align: 'right',
        fontFace: 'Arial', rtlMode: true,
      });
    });
  }

  // ═════════════════ SLIDE 17: Closing ═════════════════
  {
    const s = pptx.addSlide();
    s.background = { color: BG_DARK };

    s.addText('لماذا منصة جوهر؟', {
      x: 0.5, y: 0.6, w: 12.33, h: 0.8,
      fontSize: 34, bold: true, color: GOLD, align: 'center',
      fontFace: 'Arial', rtlMode: true,
    });

    const features = [
      'شفافية كاملة — كل قطعة لها سجل رقمي قابل للتتبع',
      'أمان مؤسسي — Zero-Trust و RBAC وتشفير شامل',
      'ذكاء اصطناعي — كشف احتيال وتحليل نقاوة',
      'امتثال دولي — ISO 17025 / ISO 27001 / KYC / AML',
      'تدويل حقيقي — 3 لغات و 3 عملات مع RTL',
      'Blockchain — أدلة مشفرة غير قابلة للتعديل',
    ];

    features.forEach((f, i) => {
      const y = 1.75 + i * 0.85;
      s.addShape(pptx.ShapeType.roundRect, {
        x: 2.2, y, w: 9.0, h: 0.7, rectRadius: 0.35,
        fill: { color: BG_CARD },
        line: { color: BORDER_GOLD_SOFT, width: 1 },
      });
      s.addShape(pptx.ShapeType.ellipse, {
        x: 10.55, y: y + 0.2, w: 0.3, h: 0.3,
        fill: { color: GOLD }, line: { color: GOLD, width: 0 },
      });
      s.addText('V', {
        x: 10.55, y: y + 0.17, w: 0.3, h: 0.36,
        fontSize: 13, bold: true, color: BG_DARK, align: 'center', valign: 'middle',
        fontFace: 'Arial',
      });
      s.addText(f, {
        x: 2.4, y: y + 0.05, w: 8.0, h: 0.6,
        fontSize: 15, color: TEXT_LIGHT, align: 'right', valign: 'middle',
        fontFace: 'Arial', rtlMode: true,
      });
    });

    s.addShape(pptx.ShapeType.rect, {
      x: 4.17, y: 7.0, w: 5, h: 0.02,
      fill: { color: GOLD }, line: { color: GOLD, width: 0 },
    });
    s.addText('شكرًا لاهتمامكم — جوهر 2026', {
      x: 0.5, y: 7.08, w: 12.33, h: 0.35,
      fontSize: 12, color: TEXT_MUTED, align: 'center',
      fontFace: 'Arial', rtlMode: true,
    });
  }

  // ─── Save ────────────────────────────────────────────────────────────────
  await pptx.writeFile({ fileName: OUTPUT });
  console.log('SUCCESS - PowerPoint saved to:', OUTPUT);
  const stats = fs.statSync(OUTPUT);
  console.log('File size:', (stats.size / 1024).toFixed(1), 'KB');
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
