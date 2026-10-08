# JOHAR — Enterprise Business Requirements Document (BRD)

**JOHAR — Global Gold & Jewelry Digital Infrastructure & Marketplace**
**جوهر — منصة الذهب والمجوهرات الرقمية المؤسسية**

> AFZOM × JOHAR · وثيقة المتطلبات المؤسسية الموحّدة (SINGLE SOURCE OF TRUTH لتنفيذ بنداً ببند)

| الحقل | القيمة |
|---|---|
| الإصدار | v1.0 |
| الحالة | الأساس (Development Baseline) |
| الجمهور | المؤسس، CTO، Backend، AI، Blockchain، ERP، أمن، قانوني، DevOps |
| الوثائق المرافقة | `JOHAR-MasterArchitecture-v1.md` (معمارية) · `JOHAR-PermissionMatrix-v1.md` (مصفوفة 95 صلاحية) · `JOHAR-Access-Permissions-Spec-v1.md` (مواصفة الأدوار) · `SECURITY-OPERATIONS.md` (أمن/DR) |
| قاعدة الحكم | ما لم يُذكر خلافه: «ما هو مكتوب في هذه الوثيقة = التزام تنفيذ؛ ما هو مميز بحالة = وصف الحالة الفعلية»

---

## 0. المنهجية — رموز الحالة

كل بند يحمل أحد ثلاثة رموز حالة:

| الرمز | المعنى |
|---|---|
| **[✓] موجود** | مطبَّق فعلياً في الكود ومتحقَّق منه (route/model/service موجودان ويعملان) |
| **[◐] جزئي** | أساس موجود لكن ناقص (نموذج بلا سلسلة كاملة، أو خدمة بلا واجهة، أو بيانات أولية) |
| **[✗] مخطط** | غير منفَّذ — بند خارطة طريق تُنفَّذ في مرحلة محددة أدناه |

**قاعدة النزاهة**: لا ندعي في هذه الوثيقة شيئاً غير موجود. `[✓]` يعني «تحققتُ من وجوده في الكود الحي». `[✗]` يعني التزاماً مستقبلياً صريحاً وليس إنجازاً.

---

## 1. الموضع والفرضية (وضع التفكير)

**JOHAR ليس متجراً إلكترونياً فحسب — إنه بنية تحتية رقمية للمعادن الثمينة و سوق مؤسسي.**

| البُعد | الفرضية |
|---|---|
| المشكلة | شراء وبيع وتتبع الذهب والأحجار والمجوهرات يفتقر إلى: هوية رقمية للأصل، سجل حيازة موثوق، أدلة تحقق، سوق مؤسسي منظَّم، وسلسلة امتثال |
| الحل | منصة تدمج: ERP (سجل تشغيلي) + JOHAR ID (هوية الأصل) + جواز رقمي + تحقق معتمدي (مختبر) + سوق B2C/B2B/B2G + طبقة أدلة Blockchain + محركات AI + مركز امتثال |
| العميل | 3 فئات: **Customer** (فردي) · **Business** (اقتصادي/مؤسسي/تجاري) · **Institution** (بنك، تأمين، جهة تنظيمية — وفق اتفاق) |
| القيمة | «من المنبع إلى اليد — هوية واحدة، أدلة موثوقة، سوق منظم» |

**الخطاب المسيطر**: `DIGITAL INFRASTRUCTURE & MARKETPLACE` — نسمّي المنتج كما يُرى من الزبون: شراء/بيع/تحقق/تفاوض/دفع/تتبع فقط.

---

## 2. مبادئ النزاهة (غير قابلة للتفاوض)

1. **لا ادعاء تنظيمي**: هذه البنية التحتية لا تُقدَّم كـ«نظام مصرفي مرخص» ولا بديل عن ترخيص مصرفي/مؤسسة مالية ولا عن جهة اعتماد رسمية. أي شريحة تحتاج ذلك تُوثَّق كنطاق خارج التنفيذ الحالي (§33).
2. **لا توكنيزة غامضة**: لا ننشئ أوراقاً/رموزاً رقمية قابلة للتداول مقابل أصل فيزيائي بدون أساس قانوني وتشغيلي (خزائن حقيقية، مصادقة، هامش). الأصول الفيزيائية تبقى في الواقع، والنظام يسجّل ويوثّق.
3. **AI ليس شهادة**: مخرجات الـAI حملة إلزامياً: `Declared | Measured | Laboratory Reported | AI Estimated` + قيد §9 (لا «100% أصلي» من صورة، ولا «JOHAR certified» بلا شهادة جهة مختصة).
4. **Blockchain = أدلة لا قاعدة بيانات**: لا نضع كلمات مرور ولا بيانات KYC تفصيلية ولا أسراراً تجارية — فقط `Hash/Reference/Proof` مع تحقق نزاهة.
5. **كل حدث حرِج**: `Event + Actor + Timestamp + Evidence` — لا انتقال ملكية بلا سلسلة حيازة وسجل تدقيق append-only.
6. **HITL**: القرارات الحساسة (تحقق، امتثال، رفع حظر) تُتخذ بأناس موثوقين موثَّقين، لا بصندوق أسود.
7. **الشفافية**: نعرض حالة التحقق الفعلية (مستوى 0–6) وليس رقماً تسويقياً (§6 في المعمارية).

---

## 3. جرد الوضع الحالي (As-Is Inventory)

نظرة سريعة على ما هو موجود فعلاً في المستودع (دليل الفجوات — يقرأ مع `JOHAR-MasterArchitecture-v1.md`):

| المجال | المكوّنات الموجودة | الحالة |
|---|---|---|
| الهوية والوصول | `User, Organization, OrgMember, Role, Permission, RolePermission, AccountType(17), ExternalEntity` + JWT/MFA/TOTP + OAuth Google | **[✓] موجود** |
| RBAC/ABAC | `middleware/auth.ts` + `authorize.ts` + `PermissionRegistry` (95 صلاحية) + قرارات `ALLOW/REQUIRE_VERIFICATION/REQUIRE_REVIEW/BLOCK` | **[✓] موجود** |
| الأصول والجوهر | `GoldAsset` (goldId/serial/manufacturerSerial/karat/weight/purity) + `DigitalIdentity` + `DigitalPassport` + QR/NFC | **[✓] موجود** |
| ERP الجردي | `GoldErpInventory, Warehouse, CustodyVault, ChainOfCustody, CustodyTransferRequest` + ثوابت `L(t)=C(t)+S(t)` | **[✓] موجود** |
| المختبر والفحص | `AssayLab, AssayRecord` + نقاط `assay/*` | **[✓] موجود** |
| التحقق والأدلة | `UserVerification` (مستويات 0–6) + `TrustVerification` (فئات 4–6) + `verificationStatus` | **[✓] موجود** |
| AI | 5 محركات (رؤية/معادن/احتيال/شذوذ/تسعير) + `AiAnalysisResult` (humanReviewStatus) + قيود §9 | **[✓] موجود** |
| البلوكشين | `BlockchainEvidence` + `BlockchainBridgeService` (hash/ref فقط) + `ErpAuditTrail` | **[✓] موجود** |
| السوق | `MarketplaceItem` + `B2bController` + `EscrowEngineService` + `PaymentGatewayService` | **[◐] جزئي** (بلا `Order` كجداول مبيعات) |
| التدقيق | `AuditLog` (severity/category, تصدير SIEM) + append-only | **[✓] موجود** |
| اللوجستيك | `LogisticsEvent, LogisticsLiveTracker` | **[✓] موجود** |
| الامتثال | `AMLComplianceService` + `KYCVerificationRouter` + `Organization.kybStatus`/لوائح | **[✓] موجود** — البوابات الآلية للبلدان [✗] |
| البيانات/التحليلات | `StatisticsService` + `GET /stats/vaa` + `GET /audit/export/siem` | **[◐] جزئي** |
| المبيعات/الأوامر | لا `Order`/`Invoice` شاملة بعد | **[✗] مخطط** (قسم 9) |
| الموردون/المشتريات | لا `Supplier` مستقل ولا سلسلة PR→RFQ→PO→GRN كاملة | **[✗] مخطط** (قسم 9) |
| العروض/التفاوض | لا `Offer` | **[✗] مخطط** (قسم 12) |
| مركز الامتثال GREEN/YELLOW/RED | لا شاشة مصنّفة بالألوان | **[✗] مخطط** (قسم 14) |
| شاشة التحكم المؤسسي | لا JOHAR CONTROL CENTER | **[✗] مخطط** (قسم 21) |

> القاعدة: الأركان الخمسة (هوية، أصل/جوهر، تحقق، أدلة، سوق) قائمة؛ الفجوات كلها في الطبقة السوقية الاندماجية (أوامر/عروض/دفع مؤسسي) والتحليلات.

---

## 4. البنية العالمية (Customer / Business / Institution)

موقع JOHAR داخل منظومة AFZOM:

```
AFZOM (Global Ecosystem)
 └─ JOHAR (Digital Precious-Asset Infrastructure & Marketplace)
     ├─ CUSTOMER PORTAL      (فردي: شراء/بيع/تحقق/تفاوض/تتبع)
     ├─ BUSINESS PORTAL      (اقتصادي/صناعي/مختبر/مورد/لوجستيك)
     ├─ INSTITUTIONAL PORTAL (بنك/تأمين/تنظيمي — وفق اتفاق وصلاحيات)
     └─ ADMIN / OPS CORE     (ERP + امتثال + أمن + تحليلات)
```

| الفئة | من يُمثلها | المزايا الرئيسة | الحالة |
|---|---|---|---|
| **Customer** | المستهلك/الفرد | حساب بسيط + تحقق تدريجي + شراء/بيع من السوق + جواز الأصل + QR/NFC + سجل حيازة | **[✓] موجود** |
| **Business** | تاجر/صائغ/مصنع/مورد/مختبر/لوجستيك | ملف أعمال (AccountType) + ERP + إدراج B2B + واجهة مختبر + سلسلة مشتريات | **[◐] جزئي** |
| **Institution** | بنك/تأمين/حكومة | بوابة مؤسسية + APIs + تقارير امتثال/تدقيق + مستويات Trust عالية | **[✗] مخطط** (P4) |

**القاعدة التشغيلية**: حساب واحد (One Account) — `User` واحد يحمل ملفاً شخصياً + ملف أعمال + أدوار متعددة عبر `OrgMember`, مع **سياق مؤسسي نشط واحد** (`/orgs/:id/switch`). صلاحية كل طلب = `platformRole ∩ orgRole ∩ accountType deltas ∩ ABAC`.

---

## 5. القائمة المؤسسية (Enterprise Menu — 14 مجموعة)

قائمة الواجهات العليا (باللغة العربية كلغة أولى/FR/EN) — متطلبات هبوط لكل مجموعة:

| # | المجموعة | المحتوى المطلوب | الحالة |
|---|---|---|---|
| 1 | **كتلة الأمان** | تسجيل دخول آمن، نسيت كلمة المرور، تحقق بخطوتين، حالة الحساب، الجلسات | **[✓] موجود** (`auth/*`, `mfa/*`) |
| 2 | **صفحتي** | ملفي الشخصي/المؤسسي، التحقق من الهوية، مفاتيح API، الإشعارات | **[✓] موجود** |
| 3 | **أصولي** | أصولي، حالة الأصل، `Status → Details → History → Transfer` | **[✓] موجود** (`assets`) |
| 4 | **سوق الجوهرة** | قائمة المعروض، فلترة التحقق، B2C/B2B، بحث | **[✓] موجود** (`marketplace`,`b2b`) |
| 5 | **جواز السفر** | إثبات الهوية، والفحص المخبري — والتحقق العام `VERIFY` | **[✓] موجود** (`digital-identity`,`verify`) |
| 6 | **المختبر** | `Assay Lab — بيانات الفحص` (Assignment → Input → Lock) | **[✓] موجود** (`assay`) |
| 7 | **ERP JOHAR** | المخزون/الخزائن/الحركات/الحيازة، CONSIGNMENT، ثوابت الجرد | **[✓] موجود** (`erp`) |
| 8 | **العروض** | `Pricing & Comparison — Offers` (إنشاء، إرسال، معلّق، سجل البيانات) | **[✗] مخطط** (قسم 12) |
| 9 | **التسوق** | `ProcessSale — Compare, Order, Escrow, Fulfilment, Delivery` | **[◐] جزئي** (`escrow`,`payment`) |
| 10 | **المشتريات** | `PR → RFQ → PO → Receiving → Inspection → Inventory` | **[✗] مخطط** (قسم 9) |
| 11 | **لوجستيك** | `Shipment − Live Tracker` (WHO/WHEN/WHERE/WHAT/WHY/STATUS) | **[✓] موجود** (`logistics`) |
| 12 | **التسليم** | `P(Inspected) → Q → Receive → QR/NFC Validate` | **[◐] جزئي** |
| 13 | **الدفع** | `Checkout − Escrow − Payment − Confirm − Contract` | **[◐] جزئي** (`escrow`,`payment`) |
| 14 | **التواصل والدعم** | `Support Tickets − SLA − Feedback` | **[◐] جزئي** (`contact`) — SLA/P1-P4 [✗] |

---

## 6. مواصفة JOHAR ID (المعرّف المؤسسي للأصل)

**الصيغة**:

```
JOHAR-<CLASS>-<COUNTRY-CODE>-<YEAR>-<SEQUENCE>
مثال:  JOHAR-GOLD-ALG-2026-00000001
```

| المكوّن | القاعدة |
|---|---|
| `JOHAR` | البادئة الثابتة للعلامة |
| `CLASS` | صنف الأصل: `GOLD` · `SILVER` · `PLATINUM` · `PALLADIUM` · `GEM` · `JEWELLERY` · `COIN` (`RAW` للمواد الخام) |
| `COUNTRY-CODE` | ISO3 للسوق الذي صُدِّر فيه الأصل (مبدئياً `ALG`) |
| `YEAR` | سنة التسجيل |
| `SEQUENCE` | رقم تسلسلي عدّاد مركزي (8 خانات — يقبل > 10⁸ أصلاً) |

**التعايش مع الحالي**: `goldId` الحالية (مثل `GOLD-…`) تبقى كمعرّف داخلي تشغيلي؛ `JOHAR ID` يُضاف كحقل `joharId` على `DigitalIdentity` **[✗ مخطط]** — يُنشأ آلياً عند «تنشيط الجواز» عبر مسار `activate-passport` المعتمد، لا باليد إلا قبل بذم أولي.

| الحقل المقترح | النوع | ملاحظة |
|---|---|---|
| `joharId` | String unique | القيمة النهائية المطبّقة على المعدن (QR/NFC) |
| `class` | Enum | GOLD…RAW |
| `countryCode` | String | ALG افتراضياً |
| `issueYear` | Int | سنة الإصدار |
| `sequence` | BigInt | عدّار مركزي آمن (لا صراع) |
| `issuedAt/issuedBy/evidenceHash` | … | كل إصدار يثبّت كحدث على البلوكشين |

---

## 7. جواز الأصل الرقمي (Digital Precious Asset Passport)

الجواز هو **طبقة الإثبات العامة** للأصل (Layer 04 في المعمارية). موجود فعلياً كجدول `DigitalPassport` ويُعرض علناً عبر `GET /api/v1/assets/verify/:passportNumber`.

**أقسام الجواز التي تُعرض** (كما في صفحة التحقق الحية):

| القسم | المحتوى | الحالة |
|---|---|---|
| `verification` | `status` (VERIFIED…)، `goldId`, `passportNumber`, `digitalSignature` | **[✓] موجود** |
| `asset` | الاسم، goldId, serialNumber, metalType, karat, weightGross/Net, measuredPurity, productType | **[✓] موجود** |
| `assay` | totalAssays, lastAssayDate, certifiedPurity, certifiedKarat, recentResults | **[✓] موجود** (بيانات البذر) |
| `chainOfCustody` | totalEvents + history (أحداث سلسلة الحيازة) | **[✓] موجود** |
| `custody` | موقع الحفظ الحالي/الخزنة | **[✓] موجود** |
| `digitalIdentity` | JOHAR ID / ربط الهوية | **[◐] جزئي** |
| `disclaimer` | إخلاء مسؤولية — الجواز دليل تحقق لا شهادة ملكية قانونية | **[✓] موجود** |

**متطلبات الجواز (BRD)**:
1. **حساب hash**: `passportHash = sha256(passportNumber | goldId | totalWeight)` — يجعل الجواز قابلاً للتحقق من التلاعب.
2. **كل جواز مرتبط بأصل واحد** (`assetId` فريد)؛ لا تصدر جوازات مكررة.
3. **الإصدار عبر مسار معتمد**: `activate-passport` (يؤكد الحالة + يثبّت `BlockchainEvidence`) — لا إنشاء يدوي للمنتج **[◐ جزئي]**.
4. **الإلغاء**: `isRevoked/revokedReason/revokedAt` — الجواز الملغي لا يُعرض كـ VERIFIED.
5. **الانتهاء**: `expiryDate` لنتائج الفحص — بعد انتهاءها يُعرض «تحقق منتهٍ يلزم تحديث».
6. **المستقبل**: إضافة `joharId` في `digitalIdentity` (قسم 6).

---

## 8. سير عمل الفحص والاعتماد (Assay & Certification Workflow)

**الخط المتفق عليه**: أصل → استلام → فحص/تحليل → توثيق → جواز → سوق.

```
RAW MATERIAL → RECEIVE → SAMPLE → WEIGH (Gross/Net)
   → ASSAY (XRF/Fire) → DECLARED/MEASURED/LAB-REPORTED
   → ASSIGN KARAT + PURITY → LOCK + SIGN (Lab)
   → DIGITAL PASSPORT ISSUE (Registrar) → JOHAR ID → SERIAL → QR/NFC
   → BLOCKCHAIN EVIDENCE → LIST/SELL
```

| المهمة | المسؤول | سجل النظام | الحالة |
|---|---|---|---|
| تسجيل الأصل (بيانات مُعلنة) | المالك/البائع | `GoldAsset` (status) | **[✓] موجود** |
| وزن صافٍ/خام | موظف المخزن | وزن Net/Gross على الأصل | **[◐] جزئي** (`weightNet=0` في عيّنات) |
| فحص العيار/النقاوة | المختبر (`AssayLab`) | `AssayRecord` + `certifiedKarat/Purity` | **[✓] موجود** |
| تثبيت وتوقيع | مختبر معتمد | `locked` + توقيع | **[✓] موجود** (`assay/*`) |
| إصدار الجواز | `DigitalRegistrar` | `DigitalPassport` + JOHAR ID | **[✓] موجود** (بذر دليل) — JOHAR ID [✗] |
| الرقم التسلسلي/QR/NFC | الإصدار | `serialNumber` + ربط هوية | **[✓] موجود** (`NfcController`) |
| الإثبات | طبقة الأدلة | `BlockchainEvidence` | **[✓] موجود** |

**قاعدة (SoD)**: المختبر لا يكتب الهوية ولا يصدر الجواز؛ المسجّل لا يفحص. فصل المهام إلزامي (§6 HITL في المعمارية).

---

## 9. وحدات ERP (Modules)

JOHAR ERP = **السجل التشغيلي للنظام** (System of Record). 43 موديلاً موجوداً الآن؛ السلاسل التجارية الكاملة هي فجوة المرحلة القادمة.

| الوحدة | المتطلبات | الحالة |
|---|---|---|
| **Organization (ORG)** | شركات/فروع، هيئة هرمية، عضوية/أدوار، تبديل سياق نشط | **[✓] موجود** (`orgs`, `OrgMember`) — فروع/إدارات [✗] |
| **CRM** | جهات اتصال + سجل تواصل + خط أنابيب مبيعات مبسط | **[◐] جزئي** (`ContactMessage`) — pipeline [✗] |
| **Suppliers** | `Supplier` + عقود/شهادات + تقييم | **[✗] مخطط** |
| **Procurement** | `PR → RFQ → PO → GRN → Inspection → Inventory` | **[✗] مخطط** (مسارات جزئية موجودة في `routes`) |
| **Sales/Orders** | `Order` عبر المنتج: سلة → أمر → Escrow → فواتير | **[✗] مخطط** (escrow [✓] جزئي) |
| **Inventory** | `GoldErpInventory` + خزائن + حركات + جرد + `L(t)=C(t)+S(t)` | **[✓] موجود** |
| **HR/Payroll** | `Worker`, `WorkerType`, `SalaryPayment` | **[✓] موجود** |
| **Financial** | إثبات حساب/مجموعات، إيصالات، تقارير مالية مبسطة | **[◐] جزئي** (`financial/*`) |
| **Assay Lab** | جدولة فحوص، نتائج، قفل، إعادة فحص | **[✓] موجود** |
| **Logistics** | أحداث + تتبع حي + مسارات تحت مسؤولية | **[✓] موجود** |
| **Documents** | جواز + مرفقات + (فواتير/شهادات رسمية مستقبلاً) | **[◐] جزئي** |

**القواعد الملزمة**: كل حركة مخزون/حيازة/نقل → `Event + Actor + Timestamp + Evidence`؛ الحفظ بقاعدة `L(t)`؛ كل عملية حساسة تمر عبر `authz` (SoD).

---

## 10. طبقة البلوكشين — الإثبات والأدلة (Evidence Layer)

> Blockchain ≠ نظام السجلات. Blockchain = سجل أدلة خارجي/قابل للتحقق من صحة التلاعب.

| المطلب | الوصف | الحالة |
|---|---|---|
| التثبيت | كل حدث حرِج (تسجيل أصل، فحص، إصدار جواز، نقل ملكية، قرار HITL) يثبّت hashً + مرجعاً | **[✓] موجود** (`BlockchainBridgeService`) |
| النزاهة | `CheckIntegrity` — Mismatch → Alert | **[✓] موجود** |
| الخصوصية | لا كلمات مرور/KYC/أسرار — Hash/Ref/Proof فقط | **[✓] موجود** |
| القراءة الأخيرة | HITL قرارات و Audits تكتب Evidence بـ `AI_DECISION_HITL` وغيرها | **[✓] موجود** |
| المعاينة العامة | عرض `digest/timestamp/anchor` في الجواز والتحقق | **[◐] جزئي** |

**المرحلة القادمة**: مشغّل أحداث (Event Bus — Redis Streams/Kafka) + جسر أدلة قابل للتوصيل (مثبّت حقيقي لاحقاً) **[✗ مخطط]** (P3).

---

## 11. السوق (Marketplace)

**الموضع**: Commerce Engine — يعرض ويتاجر، لا يملك أصل/جرد (الـERP هو صاحب المنتج/المخزون/السعر/العميل).

| القناة | الوصف | الحالة |
|---|---|---|
| B2C | `marketplace/*` — عمومي الشراء مع عربون/دفع | **[✓] موجود** |
| B2B/B2G | `b2bRoutes` + `B2bController` — عروض مجمّعة/عملاء مؤسسيون | **[✓] موجود** |
| C2C | مؤجَّلة لشروط النموذج (§8 المعمارية: "Refund Signed off" لشروط النموذج) | **[✗] مخطط** |

**متطلبات العرض**: كل `listing` يخضع لـ `listing:create` + التحقق التدريجي (المستوى المناسب) + `ProductType` (New/Pre-Owned/Restored) + ربط الجواز عند التحقق.

**نقاط القوة الحالية**: `EscrowEngineService` (ضمان دفع حتى التسليم) + `PaymentGatewayService` (تعدد بوابات) — يُبنى فوقهما سير الأوامر (قسم 9).

---

## 12. العروض والتفاوض (Offers & Negotiation)

النموذج المطلوب (Prisma — يضاف):

| الحقل | الوصف |
|---|---|
| `id` | UUID |
| `assetId` / `listingId` | الأصل أو العرض المتعلق |
| `Type` | `BUY | SELL | EXCHANGE | REPURCHASE` |
| `Status` | `PENDING_RECEIPT → LIVE → COUNTERED → ACCEPTED | EXPIRED | WITHDRAWN | REJECTED` |
| `askPrice/offerPrice/currency` | السعر المطلوب/المقترح + العملة |
| `validUntil` | انتهاء الصلاحية |
| `Terms` | شروط العرض (دلتا اللوجستيك/الشحن/الفحص) |
| `createdBy/respondedBy/decidedAt` | أصحاب القرار + زمن كل موقف |
| `المصدر` | مفتوح (سوق) أو مباشر (B2B) |

القواعد: **العرض سجلّ (Record) ليس رسالة** — كل رد يكتب Offer ثانياً مرتبطاً بالأب؛ كل حالة تُوثَّق `AuditLog` + Evidence; انتهاء `validUntil` يدخل `EXPIRED` آلياً.

**العلاقة بالمشتريات**: سير التفاوض يغذي `RFQ/Offer` في المشتريات المؤسسية (قسم 9).

---

## 13. محركات الذكاء الاصطناعي (AI Engines)

5 محررات موجودة الآن — مهمتها «توصية» لا «حقيقة نهائية»:

| المحرك | الدور | الحالة |
|---|---|---|
| `JewelleryVisionAnalyzer` | تحليل بصري للماركات/الدمغات/العيوب/التلاعب | **[✓] موجود** |
| `AIPreciousMetalsAssistant` | تحليل معدني (ذهب/فضة/بلاتين/بلاديوم/أحجار) | **[✓] موجود** |
| `GoldFraudIntelligenceEngine` | شذوذات + صور احتيال متعددة المصادر | **[✓] موجود** |
| `MLAnomalyDetectionService` | شذوذ الأنماط (مخزون/مورد/مبيعات) | **[✓] موجود** |
| `GoldPricingEngine` | التسعير (مدخل — خارج نطاق الذكاء) | **[✓] موجود** |

**الالتزامات (BRD)**:
- كل نتيجة تحمل `model/version + timestamp + input ref + confidence + result + explanation + humanReviewStatus` (§25).
- بيانات العيار/النقاوة تحمل المصدر إلزامياً: `Declared|Measured|Laboratory Reported|AI Estimated`.
- لا خروج كـ«100% أصلي» من صورة فقط ولا «JOHAR certified» بلا شهادة مختبر (§9).
- HITL: `POST /ai/results/:id/review` + `POST /ai/fraud/:id/review` بقرار بشري موثق → Evidence.
- النتائج لا تُحذف (سجل تراكمي: `AiFraudLog` + `ErpAuditTrail`).

**التوسع المخطط**: Pricing/Fraud/Risk/Document/Customer Intelligence مدمجة في لوحة التحكم (قسم 21) **[✗ مخطط]** (P3).

---

## 14. مركز الامتثال (Compliance Center)

طريقة تقييم الألوان لكل كيان (مستخدم/مؤسسة/معاملة/أصل):

| اللون | المعنى | الانعكاس | الحالة |
|---|---|---|---|
| **GREEN** | كل العوامل سليمة وموثقة | تُقبل العمليات بالمسار الآلي (ALLOW) | **[✓] موجود** عبر `authorize()` |
| **YELLOW** | نقص/قيد قابل للرفع (وثيقة، تحقق إضافي، بلد قيد) | `REQUIRE_REVIEW`/`REQUIRE_VERIFICATION` (428) + قائمة عمل | **[◐] جزئي** |
| **RED** | مخالفة/حظر (AML، فشل KYC، اشتباه احتيال) | `BLOCK` (403)/تعليق ملكية + تقرير + استئناف HITL | **[✓] موجود** (أساس) — شاشة ملونة [✗] |

**لوحة الامتثال المطلوبة (مركز)** **[✗ مخطط]**:
1. عدّادات: GREEN/YELLOW/RED لكل فئة (مؤسسات، مستخدمون، أصول، معاملات).
2. قائمة حالات YELLOW قابلة للتعيين (Owners) + مهلة زمنية.
3. الحالات RED: سبب + أدلة + قرار استئناف نهائي (HITL موثق).
4. تقرير تنظيمي (Whole Report) قابل للتصدير للجهات المعنية.

**المسارات الحالية**: `AMLComplianceService` + `KYCVerificationRouter` + `Organization.kybStatus` + قرار `compliance:decide` للمراجعة البشرية + درجة المخاطرة على السجل.

---

## 15. الطبقة القانونية والموثّق (Legal & Notarial)

| المكوّن | الوصف | الحالة |
|---|---|---|
| `NotaryAccount/NotaryRecord` | موثق معتمد يسجّل عقداً/توكيلاً مرتبطاً بمعاملة | **[✓] موجود** |
| `DigitalRegistrar/DigitalRegistrarLog` | مسجل رقمي لإصدار الهوية والجواز (فصل مهام عن المختبر) | **[✓] موجود** |
| شروط العقد | أجزاء قابلة للعرض ضمن `Terms` للعروض/الأوامر | **[◐] جزئي** |
| التوقيع الإلكتروني | توقيع الحالة `digitalSignature` على الجواز | **[✓] موجود** (hash مبدئي) — PAdES [✗] |

**الالتزام**: لا نقل ملكية بلا أثر Notarial/Registrar مسجّل عند انطباقه (القانون الجزائري/السوق) — الأدوات موجودة، الأحكام التنظيمية نراجعها في P4.

---

## 16. تنسيق الدفع (Payment Orchestration)

> JOHAR **لا يحتفظ بأموال الزبائن** — ينسّق المرور بين بوابات/حسابات الجهات وفق التصاريح. أي احتفاظ بأموال يتطلب ترخيصاً ويقع خارج النطاق (قسم 33).

| المرحلة | الآلية | الحالة |
|---|---|---|
| السلة → تأكيد | أمر + مرجع | **[◐] جزئي** |
| الضمان | `EscrowEngineService` — مبلغ محمي حتى التسليم/الفحص | **[✓] موجود** |
| الدفع الفعلي | `PaymentGatewayService` — تعدد بوابات (بطاقة/تحويل/محافظ مسموحة) | **[✓] موجود** |
| الإثبات | إيصال + `PaymentConfirmed` حدث + Evidence | **[◐] جزئي** |
| الإفصاح | العملة (DZD/EUR/USD) + الرسوم + إخلاء مسؤولية غير-بنكي | **[✓] موجود** (إفصاح الموقع) |

---

## 17. اللوجستيك والحفظ (Logistics & Custody)

**قاعدة السجل**: كل حركة تُوثَّق بـ `WHO / WHEN / WHERE / WHAT / WHY / STATUS`.

| المكوّن | الوصف | الحالة |
|---|---|---|
| `LogisticsEvent` | حدث حركة (شحن، استلام، إعادة توجيه) | **[✓] موجود** |
| `LogisticsLiveTracker` | تتبع حي مسؤول عن الحالة | **[✓] موجود** |
| `CustodyVault` | الخزنة واحتواها السياق | **[✓] موجود** |
| `ChainOfCustody` | سلسلة الحيازة لكل أصل | **[✓] موجود** |
| `CustodyTransferRequest` | نقل مسؤولية بموافقة | **[✓] موجود** |

**متطلبات BRD**:
- عند الاستلام: تحقق QR/NFC + فحص مقابل بيانات الجواز قبل قبول الحفظ.
- أي نقطة في السلسلة (أصل/خزنة/ناقل) قابلة للاستعلام: `Where is asset X now?`.
- الحركات الحساسة تُثبَّت على البلوكشين كأدلة.

---

## 18. الدعم الفني والـSLA (Support & SLA)

نموذج الأولويات متعدد المستويات — متطلبات (البوابة ساندة `contact/*` **[◐ جزئي]**):

| الأولوية | الوصف | المثال | SLA الهدف (مطلوب) |
|---|---|---|---|
| **P1** | عطل حرِج يمنع التشغيل/أمني | تعليق النظام، تسرب محتمل، فشل دفع جماعي | استجابة ≤ 15 دقيقة · حل ≤ 4 ساعات |
| **P2** | خلل كبير بواجهة/دفع لعملاء | فشل escrow فردي، خطأ 400/500 مستمر | استجابة ≤ 1 ساعة · حل ≤ 8 ساعات |
| **P3** | خلل متوسط حول المعنى | عرض خاطئ لبيانات، بطء مؤقت | استجابة ≤ 4 ساعات · حل ≤ 24 ساعة |
| **P4** | طلب/تحسين/سؤال | إنشاء ميزة، استفسار وثيق | حل ≤ 5 أيام عمل |

كيفية قياس: تذاكر `support/tickets` + حالة SLA في لوحة التحكم (قسم 21) + تقرير أسبوعي.

---

## 19. مركز الأمان (Security Center)

| الضابط | الوصف | الحالة |
|---|---|---|
| MFA/TOTP | تفعيل اختياري/إلزامي حسب الدور ومستوى العمليات | **[✓] موجود** (`mfa/*`) |
| كلمات المرور | bcrypt (Argon2id اختياري) + سياسة قوة | **[✓] موجود** |
| RBAC/ABAC | `authorize()` مركزي + 95 صلاحية + SoD | **[✓] موجود** |
| Rate Limit/Injections | 100/دقيقة + Helmet/CSP + params-style validation | **[✓] موجود** |
| Encryption | AES للبيانات الحساسة (NFC/Ownership) | **[✓] موجود** |
| SIEM/التصدير | `GET /audit/export/siem` (NDJSON/CEF) | **[✓] موجود** |
| Backup/DR | PITR + نسخ دورية + خطة خارج الموقع | **[✓] موجود** (`SECURITY-OPERATIONS.md`) |
| Incident Response | Playbook 7 خطوات + تشكيلة أدوار | **[✓] موجود** |
| جلسة وDevices | عرض الجلسات النشطة/الإلغاء عن بُعد | **[◐] جزئي** |

**مبدأ**: Zero-Trust + مبدأ الامتياز الأصغر + ألا تكشف أسراراً أبداً (لا `JWT_SECRET`/`DATABASE_URL` في تقارير/إصلاحات).

---

## 20. الأدوار والحوكمة (RBAC — 17 دوراً مرجعياً)

النموذج الكامل في `JOHAR-PermissionMatrix-v1.md` (95 صلاحية + tiers + scope + risk + SoD)؛ هنا الـ17 دوراً المرجعي للمؤسسة مع ربطه بالحالي (أدوار المنصة 9 + أدوار المؤسسة 9 + `AccountType`):

| # | الدور | الاتجاه | اختصاص رئيسي | الحالة |
|---|---|---|---|---|
| 1 | **SUPER ADMIN** | منصة | كامل المنصة، الإعداد، المؤسسات | **[✓] موجود** |
| 2 | **Regulator / Auditor** | منصة | قراءة شاملة + تقارير امتثال/تدقيق (مستوى بقراءة) | **[✓] موجود** (`audit:read`) |
| 3 | **Compliance Officer** | منصة | قرارات YELLOW/RED، AML، KYC/KYB review | **[✓] موجود** (`compliance:*`) |
| 4 | **Security Admin** | منصة | إدارة جلسات، مفاتيح API، حوادث، قفل/إلغاء | **[◐] جزئي** |
| 5 | **Support Agent** | منصة | تذاكر P1–P4 + حلول أولية | **[◐] جزئي** (`contact`) |
| 6 | **Lab Manager** | منصة | جدولة الفحوص، تسكين طلبات المختبر، اعتماد نتائج | **[✓] موجود** (`assay`) |
| 7 | **Assay Technician** | منصة | إدخال فحوص، القفل والتوقيع | **[✓] موجود** |
| 8 | **Digital Registrar** | منصة | إصدار الجواز/JOHAR ID (SoD عن المختبر) | **[✓] موجود** |
| 9 | **Finance / Treasury** | منصة/مؤسسة | تسوية الدفعات/الإثبات، التقارير المالية | **[◐] جزئي** (`financial`) |
| 10 | **Warehouse/Vault Operator** | مؤسسة | جرد، خزائن، حركات، استلام | **[✓] موجود** (`erp`) |
| 11 | **Logistics Operator** | مؤسسة | شحن وتتبع وأحداث | **[✓] موجود** (`logistics`) |
| 12 | **Procurement Manager** | مؤسسة | PR/RFQ/PO | **[✗] مخطط** (قسم 9) |
| 13 | **Sales / Marketplace Manager** | مؤسسة | إدراج، عروض، أوامر | **[✓] موجود** (`marketplace`) |
| 14 | **Customer (B2C)** | فردي | شراء/بيع/تحقق/تفاوض | **[✓] موجود** |
| 15 | **Business Operator (B2B)** | شركة | ERP مؤسسته + B2B | **[✓] موجود** |
| 16 | **Institutional User (B2G)** | مؤسسة | بوابات مؤسسية + APIs + تقارير | **[✗] مخطط** (P4) |
| 17 | **API Consumer** | خارجي | مفاتيح API بمجرّد نطاق | **[◐] جزئي** (`ApiKey`) |

**قواعد الحوكمة**: الصلاحيات تُمنح بحسب السياق النشط (`platformRole ∩ orgRole ∩ accountType deltas`)؛ لا يجوز للدور أن يقرر على نفسه (SoD — اختبار في المعيار §32: `OWNER` يحاول `kyb/approve` على مؤسسته → 403).

---

## 21. لوحة التحكم المؤسسية (JOHAR CONTROL CENTER)

**الشاشة الجديدة المطلوبة** (SPA) **[✗ مخطط]** — هبوط الأدوار المؤسسية (Super/Admin/Compliance/Finance) مع 5 بطاقات KPI رئيسية + لوحات حية:

| اللوحة | المحتوى | المصدر |
|---|---|---|
| **KPI (5 بطاقات)** | VAA (أصول نشطة موثقة) · Verified Users · Verified Orgs · GMV · Pending HITL | `GET /stats/vaa` + stats |
| **Live Transactions** | آخر المعاملات الحساسة لحظياً (نوع + حالة + أثر) | `AuditLog` + Events |
| **Risk Monitor** | عدادات GREEN/YELLOW/RED + أعلى المخاطر | امتثال (قسم 14) |
| **Asset Verification Queue** | طابور HITL (نتائج AI بانتظار قرار بشري) | `GET /ai/results?status=` |
| **Blockchain Events** | آخر الأدلة المُثبّتة + تحقق النزاهة | `BlockchainEvidence` |
| **Financial Overview** | إجمالي الصفقات، escrow مغلق، عملة | `financial`/escrow |
| **Logistics** | شحنات نشطة + نقاط تتبع متأخرة | `LogisticsLiveTracker` |
| **Support SLA** | عدّادات P1–P4 ضد الهدف | تذاكر (قسم 18) |

**قاعدة: الأدوار الرقابية (Auditor/Regulator) ترى نسخة القراءة-only. لا شاشة واحدة تكشف أسراراً (مفاتيح/بيانات بنكية) حتى لمن يملك `dashboard:view`.**

---

## 22. معماري البرمجيات (Software Architecture)

```
            ┌──────────────────────── CLIENT LAYER ────────────────────────┐
            │  Consumer · Business · Admin · Lab · Logistics · Legal ·     │
            │  Institutional · API (8 بوابات / Portals)                    │
            └──────────────────────────────┬───────────────────────────────┘
                                           ▼
            ┌────────────────────── API GATEWAY/LAYER ─────────────────────┐
            │  /api/v1/* · auth/JWT+MFA · authorize() (RBAC+ABAC) ·        │
            │  rate-limit · CORS/Helmet · OpenAPI (auto-introspection)     │
            └──────────────────────────────┬───────────────────────────────┘
                                           ▼
   ┌─────────────┬───────────────┬───────────────┬───────────────┬───────────────┐
   │  SERVICE    │   SERVICE     │   SERVICE     │   SERVICE     │   SERVICE     │
   │  ERP        │  JOHAR ID/    │  AI ENGINES   │  Compliance/  │  MARKETPLACE/ │
   │  (System of │  Passport     │  (5) + HITL   │  Trust/KYC-   │  Escrow/      │
   │  Record)    │               │               │  AML           │  Payment      │
   └─────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
                                     │
              ┌──────────────────────┼────────────────────────────────────┐
              ▼                      ▼                                    ▼
         PostgreSQL/Neon     Redis (جلسات/طوابير/تخزين)             Blockchain
         (نظام سجلات)        + Object Storage + Search               (أدلة فقط)
```

**المبادئ**: Modular + API-First + Cloud-Native + Secure-by-Design — كل محرك سيرفس/مجلد مستقل (`src/services/*`) بلا ترابط صلب.

**المنافذ (8)**: Consumer · Business · Admin/Ops · Lab · Logistics · Legal/Notary · Institutional · API/Dev.

---

## 23. التقنيات (Tech Stack)

| الطبقة | الاختيار | الدور | الحالة |
|---|---|---|---|
| Backend | Node.js (Express/TS) | API + منطق | **[✓] موجود** |
| Frontend | React (Vite/TS) | SPA + PWA الموالية | **[✓] موجود** |
| DB | PostgreSQL (Neon، Serverless) | نظام السجلات | **[✓] موجود** |
| Cache/Queue | Redis | جلسات/معدّل/طوابير أحداث | **[✗] مخطط** (Redis Streams) |
| Object Storage | مرن S3/nets | صور/وثائق | **[◐] جزئي** (`primaryImageUrl/galleryUrls`) |
| Search | مرِن (أو pg full-text) | البحث في السوق/الأصول | **[✗] مخطط** |
| Event Bus | Redis Streams/Kafka | أحداث §15 | **[✗] مخطط** (P3) |
| Blockchain | جسر أدلة (hash/ref) | إثبات | **[✓] موجود** — مثبّت حقيقي [✗] |
| Auth | JWT + MFA/TOTP + OAuth2 | هوية | **[✓] موجود** |
| Deployment | Netlify Functions + Vite | نشر حي | **[✓] موجود** |

---

## 24. خريطة الأدوات (Tools Mapping)

| الحاجة | الأداة الحالية/المقترحة | الحالة |
|---|---|---|
| (Documentation) السجلات | `docs/*` (MasterArch, BRD, PermissionMatrix, AccessSpec, SEC-OPS) | **[✓] موجود** |
| اختبارات انحدار حية | `test-full-site-v2.js` (37 بنداً)/`test-hitl-live.js` | **[✓] موجود** |
| مسابير الفحص | `probe-*.js` (ownership/verify/resolver/instrument) | **[✓] موجود** |
| بذر البيانات | `seed-*.js` المخصصة (جوازات/عيّنات) | **[✓] موجود** |
| تقارير الإنجاز | `make_report_pptx.py` → PPTX | **[✓] موجود** |
| توثيق ERD | توليد Prisma schema → موديلات | **[✓] موجود** (جرد موديلات) |
| CI | لاحقاً: tsc + eslint + اختبارات في السيل | **[✗] مخطط** |

---

## 25. دورة التشغيل الكاملة (Full Process Cycle)

```
RAW MATERIAL → INTAKE → ASSAY (مختبر) → JOHAR ID + SERIAL → QR/NFC
  → DIGITAL PASSPORT → BLOCKCHAIN EVIDENCE → ERP INVENTORY
  → LISTING (Marketplace) → OFFER/NEGOTIATION → ORDER
  → ESCROW PAYMENT → CONTRACT (Legal/Notarial)
  → LOGISTICS/DELIVERY → CUSTODY (Vault/ChainOfCustody)
  → OWNERSHIP TRANSFER → RESALE (عرض جديد)
```

| المرحلة | الحالة | الملاحظة |
|---|---|---|
| المواد الخام → استقبال | **[◐] جزئي** | `RAW` class مخطط، الاستقبال عبر `erp` |
| الفحص/الاعتماد | **[✓] موجود** | `assay/*` + جواز |
| الهوية/الجواز | **[✓] موجود** | JOHAR ID [✗] |
| الإثبات | **[✓] موجود** | Blockchain |
| الجرد/السوق | **[✓] موجود** | listings |
| العروض/الأمر/الدفع | **[◐] جزئي** | Offers [✗]، Order [✗]، escrow [✓] |
| العقد/الموثق | **[✓] موجود** | Notary |
| اللوجستيك/الحفظ | **[✓] موجود** | |
| نقل الملكية/إعادة البيع | **[✓] موجود** | `OwnershipTransferProcess` + سلسلة حيازة |

---

## 26. المنافذ والتطبيقات (Apps & Portals)

| # | المنفذ | المستخدم | الحالة |
|---|---|---|---|
| 1 | Consumer Portal | الفرد | **[✓] موجود** |
| 2 | Business Portal | تاجر/شركة/مصنع | **[✓] موجود** |
| 3 | Admin / Ops Console | المشغلون | **[✓] موجود** (جزئي) |
| 4 | Lab Portal | المختبر | **[✓] موجود** |
| 5 | Logistics Portal | الشحن/النقل | **[✓] موجود** |
| 6 | Legal/Notary Portal | موثق/مسجّل | **[✓] موجود** (أساس) |
| 7 | Institutional Portal | بنك/حكومي | **[✗] مخطط** (P4) |
| 8 | API & Dev Portal | مطورون | **[◐] جزئي** (`ApiKey` + `docs`) |

---

## 27. مبدأ تجربة المستخدم (UX Principle)

> الزبون يرى فقط: **شراء · بيع · تحقق · تفاوض · دفع · تتبع** — كل البنية والامتثال خلف الكواليس.

- كل ما يظهر للمستهلك حول أصل: جواز + حالة تحقق + سجل حيازة + الخيار الأسلم ← transparent.
- كلمات مفتاحية عمومية (AR/FR/EN): «تأكد، تتبع، اشترِ بأمان» + إخلاء مسؤولية ظاهر في صفحة التحقق.
- لا نظهر صلاحيات/مصفوفات/مفاتيح للعميل أبداً؛ بل «السياق المؤسسي» كما لدى الأدوار.

---

## 28. التسمية (Naming)

- **الاسم**: **JOHAR — Global Gold & Jewelry Digital Infrastructure & Marketplace**
- **بطاقة الخدمة**: `جوهر — منصة الذهب والمجوهرات الرقمية المؤسسية`
- **الخطاب**: `TWO-WORD` لكل واجهة (Verify، Track، Buy، Negotiate، Pay) كما في خطاب المستهلك.

---

## 29. خارطة الطريق (MVP Phases)

| المرحلة | النطاق | الحالة/الملاحظة |
|---|---|---|
| **P1 — أساس معاملاتي** | REGISTER → KYC → ASSET → ASSAY → JOHAR ID → SERIAL → QR/NFC → PASSPORT → ERP → LIST → OFFER → NEGOTIATE → VERIFY | **[✓] الغالبية موجودة** — Offers/JOHAR ID [✗] |
| **P2 — سلاسل تجارية** | PAYMENT → CONTRACT → LOGISTICS → CUSTODY → OWNERSHIP | **[◐] الجزء الأكبر موجود** — Order كيومية [✗] |
| **P3 — ذكاء ومؤسسات** | AI → Risk → Analytics → Institutional APIs → Blockchain Evidence حقيقي → International | **[✗] مخطط** |
| **P4 — مؤسسات دولية** | بنوك/تأمين/حكومي + Country Compliance Layer (ALG→AFR→MENA→EU) | **[✗] مخطط** |

---

## 30. نموذج البيانات (Data Model)

### 30.1 الجداول الموجودة (مخزون مجموعات — 43 موديلاً)

```
IDENTITY         User, Role, Permission, RolePermission, Organization, OrgMember,
                 ExternalEntity, EmailOtp
PRODUCT/JOHAR ID GoldAsset, DigitalIdentity, DigitalPassport, OwnershipKey
ERP/INVENTORY    GoldErpInventory, Warehouse, AssayLab, AssayRecord, CustodyVault,
                 ChainOfCustody, CustodyTransferRequest
HR               Worker, WorkerType, SalaryPayment
AI               AiAnalysisResult, AiFraudLog
EVIDENCE         BlockchainEvidence, ErpAuditTrail, AuditLog, AuditorWatchLog
MARKETPLACE      MarketplaceItem, EscrowLedger, EscrowEvent
LOGISTICS        LogisticsEvent
COMPLIANCE       UserVerification, NotaryAccount, NotaryRecord, DigitalRegistrar,
                 DigitalRegistrarLog
CRM/COM          NewsletterSubscriber, Article, BuyerProgramRegistration, ContactMessage
API              ApiKey
```

### 30.2 نماذج مقترحة (Prisma — إضافية على الجدول)

**(أ) `JoharAssetId` — المعرف المؤسسي (قسم 6):**
```prisma
model JoharAssetId {
  id           String   @id @default(uuid())
  assetId      String   @unique                      // ربط GoldAsset
  class        String                                // GOLD/SILVER/...
  countryCode  String   @default("ALG")
  issueYear    Int
  sequence     BigInt   @unique                      // عدّار مركزي
  joharId      String   @unique                      // JOHAR-GOLD-ALG-2026-00000001
  issuedAt     DateTime @default(now())
  issuedBy     String                                // DigitalRegistrar.id
  evidenceHash String?                               // إثبات البلوكشين
  @@unique([class, countryCode, issueYear, sequence])
}
```

**(ب) `AssetPassportLifecycle` — دورة حياة الجواز:**
```prisma
model AssetPassportLifecycle {
  id            String   @id @default(uuid())
  assetId       String   @unique
  passportId    String   @unique                      // DigitalPassport.id
  issuedAt      DateTime @default(now())
  status        String   @default("ISSUED")           // ISSUED|UPDATED|REVOKED|EXPIRED
  eventType     String                                // PASSPORT_ISSUE/PASSPORT_UPDATE/...
  actorId       String
  evidenceHash  String?
  createdAt     DateTime @default(now())
}
```

**(ج) `Offer` — عرض/تفاوض (قسم 12):**
```prisma
model Offer {
  id             String   @id @default(uuid())
  assetId        String?
  listingId      String?
  type           String                                // BUY/SELL/EXCHANGE/REPURCHASE
  status         String   @default("PENDING_RECEIPT")  // ...LIVE/COUNTERED/ACCEPTED/EXPIRED/WITHDRAWN/REJECTED
  requestPrice   Decimal? @db.Decimal(12, 4)
  offerPrice     Decimal? @db.Decimal(12, 4)
  currency       String   @default("DZD")
  validUntil     DateTime?
  terms          Json?
  createdById    String
  respondedById  String?
  parentOfferId  String?                               // سلسلة العروض المضادة
  decidedAt      DateTime?
  evidenceHash   String?
  createdAt      DateTime @default(now())
}
```

**(د) `ComplianceCase` — ملف امتثال ملون (قسم 14):**
```prisma
model ComplianceCase {
  id          String  @id @default(uuid())
  subjectType String                       // ORGANIZATION|USER|ASSET|TRANSACTION
  subjectId   String
  color       String  @default("YELLOW")   // GREEN|YELLOW|RED
  reason      String?
  evidenceRef String?
  assignedTo  String?
  status      String  @default("OPEN")     // OPEN|IN_PROGRESS|RESOLVED|CLOSED
  resolution  String?
  decidedById String?
  decidedAt   DateTime?
  createdAt   DateTime @default(now())
}
```

**(هـ) `KybEvidence` — أدلة الاعتماد المؤسسي:**
```prisma
model KybEvidence {
  id             String  @id @default(uuid())
  organizationId String
  factor         String                      // COMPANY_REGISTRY|LEGAL_REP|TAX|BANK_REF|...
  documentUrl    String?
  verifiedById   String?
  verifiedAt     DateTime?
  status         String  @default("PENDING") // PENDING|VERIFIED|REJECTED
  notes          String?
}
```

> هذه النماذج **مسودة Scheme أصيلة** تُثبَّت في `prisma/schema.prisma` عند مرحلة P1.5/P2 (السلاسل التجارية) بعد موافقة على مواصفات الحقول الدقيقة مع مصفوفة الصلاحيات.

---

## 31. مواصفة واجهة API

### 31.1 المرجع الحي

- `GET /api/v1/openapi.json` — OpenAPI 3.0.3 مولَّد آلياً (introspection على `app._router`) — **مصدر حقيقة واحد** بلا توزيع مزدوج.
- `GET /api/v1/docs` — وثيقة HTML ذاتية (CSP-safe).
- العدد الحي حالياً: **181 نقطة** عبر أوسمة (ERP 35، AUTH 11، PUBLIC 7، …) تتجدد عند كل نشر.

### 31.2 مجموعات المسارات الموجودة (كلها `/api/v1`)

`auth · assets · ai · custody · erp · audit · vaults · marketplace · hr · financial · assay · digital-identity · compliance · system · ownership · logistics · contact · admin · stats · b2b · orgs · trust`

### 31.3 إضافات MVP (المطلوبة — بالحالة)

| المجموعة | المسار | المبدأ | الحالة |
|---|---|---|---|
| Offers | `GET/POST /offers` · `POST /offers/:id/respond` · `POST /offers/:id/cancel` | `offer:create/respond/cancel` | **[✗] مخطط** |
| Orders | `POST /orders` · `GET /orders/:id` · `POST /orders/:id/finalize` | `order:create/read/finalize` | **[✗] مخطط** |
| Invoices | `GET /orders/:id/invoice` · `POST /orders/:id/pay` | `order:invoice/pay` | **[◐] جزئي** (`financial`) |
| Procurement | `PR → RFQ → PO → GRN` نقطة لكل مرحلة | `procurement:*` | **[✗] مخطط** (مسارات جزئية في `routes`) |
| Compliance | `GET /compliance/cases` · `POST /compliance/cases/:id/assign|resolve` | `compliance:*` | **[◐] جزئي** (أساس HITL) |
| Dashboard | `GET /control-center/summary` · `/live-transactions` · `/risk-monitor` | `dashboard:view` | **[✗] مخطط** (قسم 21) |
| JOHAR ID | `POST /assets/:id/activate-passport` · `GET /assets/johar/:joharId` | `passport:activate` / `joharid:read` | **[◐] جزئي** (مسار التفعيل مبدئي) |
| Support | `GET/POST /support/tickets` · `GET /support/questions` | `support:*` | **[✗] مخطط** |

### 31.4 عقد الاستجابات

غلاف موحد `{ success, data, error }`؛ رموز الخطأ: 400 (إدخال)، 401 (جلسة)، 403 (BLOCK/SoD)، 404، 409 (تعارض)، 428 (REQUIRE_VERIFICATION)، 429 (rate)، 500؛ كل نقطة محمية تحمل `x-johar.permission` + `x-johar.scope`.

---

## 32. مؤشر الحقيقة / معايير القبول (North Star — §37)

**VAA = Verified Active Assets** — «عدد الأصول النشطة ذات الهوية والجواز غير الملغي وحالة تحقق سليمة».

- **مدعوم فعلياً**: `GET /api/v1/stats/vaa` (audit:read) — يحسب VAA + نسبة التوثيق + مستخدمين/مؤسسات موثقين + توزيع trustLevel + بلدان + حجم طابور HITL.
- **معايير Acceptance** (قابلة للتحقق — كل طور):

| المعيار | طريقة التحقق |
|---|---|
| كل أصل مسجّل له JOHAR ID + توأم رقمي قابل للعرض | `GET /assets/johar/:id` → 200 مع جواز ممتلئ |
| عمليات الحرجة مقيّدة بالمصفوفة (RBAC+ABAC) | استدعاء `authz` وسط + إحصاء 403/428 |
| منع كسر SoD | اختبار `OWNER` يحاول `kyb/approve` على مؤسسته → 403 |
| AI بلا مطلق بلا شهادة | فحص سلسلة «certified/genuine» في مخرجات API |
| كل حدث حرِج مثبَّت Evidence | فحص `BlockchainEvidence` لكل transfer/approve/status |
| تدقيق غير قابل للحذف (append-only) | اختبار محاولة تعديل → فشل/mismatch |
| لا بيانات حساسة صريحة على البلوكشين | فحص `BlockchainEvidence` (hash/ref فقط) |
| الترقية التدريجية تفعل أولاً | عميل بمستوى أدنى يحاول `listing:create` → 428 |

---

## 33. النطاق الصريح والحدود (Limitations — Honesty Box)

1. **ليست نظاماً مصرفياً**: لا إيداع أموال، لا فوائد، لا منتجات تمويل. الدفع يتوسط (Orchestration) عبر بوابات مرخصة. أي تمدد يلزم ضوابط قانونية وشريحة منفصلة.
2. **لا توكنيزة/أوراق قابلة للتداول** بلا أساس قانوني وحدود خزائن. (مبادئ §2)
3. **AI مشورة، لا شهادة**: القيد §9 مطبّق‏؛ «الحقيقة» للمختبر/المرجع الإنسان.
4. **Blockchain أدلة**: بنية تُثبّت hash/مرجع؛ المثبّت الخارجي الحقيقي مرحلة P3.
5. **الاعتمادات**: المختبر/نتائج البذر هي بيانات تجريبية للتطوير؛ الاعتماد الرسمي لاحق.
6. **بيانات العينة**: الوزن `weightNet=0` لعينات معينة — بند تنظيف/فكّ مسؤولية في شاشة الجواز (يُظهر الوزن كما هو).

---

*تُحدَّث هذه الوثيقة عند كل شريحة تنفيذية؛ سجل حقيقة الصلاحيات: `JOHAR-PermissionMatrix-v1.md`، والحاكم المعماري: `JOHAR-MasterArchitecture-v1.md`، والسلوكي: `JOHAR-Access-Permissions-Spec-v1.md`.*