# JOHAR — MASTER ARCHITECTURE (المعمارية التكاملية الاستنادية v1)

> AFZOM × JOHAR — GLOBAL DIGITAL PRECIOUS-ASSET & BUSINESS INFRASTRUCTURE
> Integrated ERP + AI + Blockchain + Digital Identity + Marketplace + Trust + Compliance

**الغرض**: وثيقة مرجعية موحّدة يفهمها المؤسس، والـCTO، والمطور الخلفي، ومهندس الذكاء الاصطناعي، ومهندس البلوكتشين، ومعماري الـERP، ومهندس الأمن، والمستشار القانوني — بنفس المخطط واللغة.
**المصدر**: Master Architecture (وثيقة AFZOM × JOHAR §1–§44) + تنفيذٍ فعلي مرجعي (هذا المستودع).
**وثائق مرافقة**: `JOHAR-Access-Permissions-Spec-v1.md` (المواصفة) و`JOHAR-PermissionMatrix-v1.md` (المصفوفة).

---

## 1. MASTER CONCEPT (§1)

```
AFZOM                          ← منظومة أمّ
  └─ GLOBAL ECOSYSTEM
       └─ JOHAR | جوهر          ← منصة الذهب والمجوهرات والأحجار والمواد الثمينة
            ├─ ERP        Operational System of Record
            ├─ AI         Intelligence Engine
            ├─ JOHAR ID   Digital Product/Asset Identity
            ├─ TRUST      Verification + Compliance + Risk
            ├─ BLOCKCHAIN Evidence & Audit Layer
            └─ MARKETPLACE B2C / B2B / B2G (Commerce Engine)
```

### الصيغة الأمّ (§43) — حالة المطابقة الحالية

| الكيان | التعريف | التنفيذ الحالي | الحالة |
|---|---|---|---|
| AFZOM | Global Ecosystem | (هوية العلامة — خارجة عن نطاق الكود) | — |
| JOHAR | Global Digital Platform | تطبيق Express + React على Netlify/Neon | ✅ |
| ERP | Operational System of Record | مسارات `assets, custody, vaults, erp, hr, financial, assay, logistics` + 43 موديلاً | ✅ |
| JOHAR ID | Digital Product Identity | `DigitalIdentity` + `DigitalPassport` + QR/NFC | ✅ |
| AI | Intelligence Engine | `JewelleryVisionAnalyzer`, `GoldFraudIntelligenceEngine`, `AIPreciousMetalsAssistant`, `MLAnomalyDetectionService` | ✅ |
| VERIFICATION | Trust Engine | `UserVerification`, `KYCVerificationRouter`, مصفوفة المستوى 0–3 | ✅ |
| BLOCKCHAIN | Evidence & Audit Layer | `BlockchainEvidence`, `BlockchainBridgeService`, `ErpAuditTrail`, `AuditLog` | ✅ |
| MARKETPLACE | Commerce Engine | `MarketplaceItem`, `B2bController`, مسارات `marketplace` و`b2b` | ✅ |
| DATA | Strategic Intelligence Asset | `StatisticsService`, `GoldPricingEngine` | مرحلي |
| API | Connectivity Layer | 14 مجموعة مسارات `/api/v1/*` + OAuth2 (Google) | ✅ |
| CYBERSECURITY | Security Foundation | MFA/TOTP، BCrypt/Argon، rate-limit، JWT، RBAC/ABAC، Helmet/CSP | ✅ |
| COMPLIANCE | Regulatory Control Layer | `AMLComplianceService`, `KYCVerificationRouter`, مصفوفة القرار ALLOW/REVIEW/BLOCK | ✅ |

**قاعدة ذهبية مطبّقة في الكود (§2)**: Modular + API-First + Cloud-Native + Secure-by-Design — كل محرك في مجلد/خدمة مستقلة (راجع `src/services/*`)، ولا توجد ترابطات صلبة.

---

## 2. الطبقات 12 (§3) → الخريطة التنفيذية

| الطبقة | الوحدة | مكوّنات التنفيذ |
|---|---|---|
| **L1 Identity** | المستخدم/المؤسسة/الهوية | `User`, `Organization`, `OrgMember`, `Role`, `ExternalEntity`, `AccountType` (17) |
| **L2 Access & Security** | Auth + MFA + RBAC/ABAC | `middleware/auth.ts` (JWT/MFA)، `middleware/authorize.ts` (`authz`)، `AuthorizeService`، `PermissionRegistry` (95 صلاحية) |
| **L3 ERP** | القلب التشغيلي | `GoldAsset`, `GoldErpInventory`, `Warehouse`, `CustodyVault`, `ChainOfCustody`, `AssayLab/AssayRecord`, `Worker/SalaryPayment`, `ErpAuditTrail` |
| **L4 JOHAR ID** | هوية المنتج | `DigitalIdentity`, `DigitalPassport`, QR/NFC (`NfcController`), `OwnershipKey` |
| **L5 AI** | الذكاء والتحليل | `AiAnalysisResult`, `AiFraudLog`, المحرّكات الخمسة أعلاه |
| **L6 Verification & Trust** | التحقق والأدلة | `UserVerification`، مستويات التحقق (0–3)، دلتا نوع الحساب |
| **L7 Blockchain** | سجل الأدلة | `BlockchainEvidence`, `BlockchainBridgeService` (تثبيت hash + مرجع — لا بيانات حساسة) |
| **L8 Marketplace** | التجارة | `MarketplaceItem`, `EscrowEngineService`, `PaymentGatewayService`, `B2bController` |
| **L9 Logistics** | الحركة والتسليم | `LogisticsEvent`, `LogisticsLiveTracker` |
| **L10 Data & Analytics** | البيانات وذكاء الأعمال | `StatisticsService`, `GoldPricingEngine`, `AuditLog`/`groupBy` |
| **L11 Compliance** | KYC/KYB + AML + قواعد | `KYCVerificationRouter`, `AMLComplianceService`, `Kybid` عبر `Organization.kybStatus` |
| **L12 API & Integration** | الربط الخارجي | `GoogleOAuthService`, `MailService`, `LabInstrumentIoTGateway`, `/api/v1/*` |

**الخلاصة التسليمية**: البنية الفعلية مطابقة للطبقات 12؛ الفجوة الوحيدة هي L10 (Warehouse/Lakehouse) وL12 (API Keys راجع `ApiKey` موديل — يعمل جزئياً).

---

## 3. ERP — OPERATIONAL SYSTEM OF RECORD (§4)

> JOHAR ERP يُدار بالكامل داخل النظام (ليس خارجياً).

| وحدة ERP | التغطية الحالية | نقطة الضعف |
|---|---|---|
| Organization (شركات/فروع/إدارات/موظفون/صلاحيات) | `Organization`, `OrgMember`, `OrgRole` (9 أدوار) + نقاط `/orgs` | فروع/إدارات: غير مفصّلة بعد |
| CRM | `MarketplaceItem` (عرض) + `ContactMessage`, `BuyerProgramRegistration` | لا يوجد نموذج Sales pipeline متكامل |
| Suppliers | (لا نموذج مستقل) | **فجوة MVP** — يحتاج `Supplier` + عقود |
| Procurement (PR→RFQ→PO→Receiving→Inspection→Inventory) | مسار `inventory`/`financial` جزئي | **فجوة** — مطلوب سلسلة أوامر شراء كاملة |
| Sales (Quotation→SO→Verification→Payment→Fulfillment→Delivery) | `EscrowEngineService`, `PaymentGatewayService`, `Order*` في المصفوفة | **فجوة الأوامر**: لا توجد `Order` جدولاً بعد على مستوى المنتج |
| Inventory | `GoldErpInventory`, `Warehouse`, حركات، جرد | خامس جيد؛ رفع `reservation` جزئي |
| Logistics | `LogisticsEvent`, `LogisticsLiveTracker` + مسارات `logistics` | مكتمل للمرحلة الحالية |
| Documents | `DigitalPassport`, `AssetController` (وثائق) | فواتير/شهادات رسمية: `Documents` عام غير مفصل |

**قواعد ERP المسجّلة**: مبدأ الحفظ `L(t) = C(t) + S(t)` (فحص `erp/invariant-check`)، سلسلة الحيازة `ChainOfCustody`، الأثر التدقيقي `ErpAuditTrail`.

---

## 4. JOHAR ID و DIGITAL TWIN (§5، §6، §27، §28)

المسار الحالي للمنتج:

```
Physical Product → Serial Number → GoldAsset (الإصدار)
   → DigitalIdentity (JOHAR ID) → DigitalPassport (Layer 04)
   → AI Analysis → Verification → Blockchain Evidence → Listing/Sale/Transfer
```

نموذج التوأم (تطبيق فعلي في `GoldAsset`): Weight, Purity, Karat, Manufacturer, Serial, Documents, QR/NFC, Ownership events.

**نقطة التوأمة (Twin)**: `DigitalIdentity` و`DigitalPassport` هما **التوأم الرقمي**؛ `BlockchainEvidence` يربط الأحداث بحيث لا ينتقل المنتج بملكية جديدة بل بـ `OwnershipTransferProcess` + `ChainOfCustody` (هوية المنتج ≠ هوية المالك — §28).

**دورة الحياة الذكية (§27)**: تمثلها حقول الحالة على `GoldAsset` + `ownershipTransferProcess` (CREATED→REGISTERED→…→LISTED→SOLD→TRANSFERRED→SUSPENDED→RETIRED)، وكل انتقال مسجّل بـ `Event + Actor + Timestamp + Evidence`.

**دعم المصنفات (§28)**: حقل مصدر المنتج يميز New / Pre-Owned / Restored (نموذج `ProductType` والـ`goldId`). إضافة جديدة لم تنفذ بعد (لا `TradeStatus` مفصل) — مطلوب في الشريحة التنفيذية القادمة.

---

## 5. AI ENGINE (§7–§10، §25، §26، §30، §32)

### الوحدات الحالية
- `JewelleryVisionAnalyzer` — التحليل البصري: علامات، دمغات، شكل، لون، عيوب، تلاعب.
- `AIPreciousMetalsAssistant` — تحليل المعادن (ذهب/فضة/بلاتين/بلاديوم/أحجار).
- `GoldFraudIntelligenceEngine` — شذوذات وصور احتيال متعددة المصادر.
- `MLAnomalyDetectionService` — كشف شذوذ الأنماط (مخزون، مورد، مبيعات — §30).
- `GoldPricingEngine` — التسعير (خارج نطاق الذكاء لكنه مدخله).

### الحدود المثبتة كتابةً في النظام (§9) — إلزامية
- يخرج AI: `AI Assessment: High Consistency | Potential Inconsistency Detected | Insufficient Data`.
- **لا** يخرج أبداً: «100% genuine» من صورة فقط، ولا «JOHAR certified» بلا شهادة جهة مختصة.
- بيانات العيار/النقاوة (§10) تحمل مصدرها إلزامياً: `Declared | Measured | Laboratory Reported | AI Estimated` — يُعرض في `AiAnalysisResult`.

### حوكمة النتائج (§25) — تطبق على `AiAnalysisResult`
كل نتيجة تحمل: `model/version + timestamp + input reference + confidence + result + explanation + human review status`. النتائج لا تُحذف (سجل تراكمي للتدقيق: `AiFraudLog` + `ErpAuditTrail`).

### Human-in-the-Loop (§26)
- AI → Recommendation → Human/Laboratory → Decision → ERP → Blockchain Evidence.
- التحقق الحساس (`verificationStatus`) بمبدأ موثق: `AssayLab/AssayRecord` (Lab stage) و`DigitalRegistrar` (Registrar stage) — فصل مهام.
- **تفعيل HITL (2026-09)**: نتائج AI تحمل `humanReviewStatus` (`PENDING→APPROVED|REJECTED|ESCALATED`) إلى جانب `reviewDecision` (`APPROVED|REJECTED|FLAGGED|BLOCKED|UNDER_INVESTIGATION|ESCALATED`)/`reviewedBy/reviewedAt/reviewNotes`. المنصّة (مستوى `compliance:review`) تعتمد صراحة:
  - `GET /ai/results?status=` · `GET /ai/results/:id` · `POST /ai/results/:id/review` — قرار بشري على نتائج التحليل.
  - `GET /ai/fraud` (طابور) · `POST /ai/fraud/:id/review` — قرار على سجلات الاحتيال (يُغلق/يُحقر حسب القرار).
  - كل قرار: `HITL_*_REVIEW` بدرجة **CRITICAL** في AuditLog + إثبات `BlockchainEvidence` بصفح القراءة `AI_DECISION_HITL`.

---

## 6. TRUST & VERIFICATION (§11–§12) — المطابقة مع الحالي

المستويات المعيارية الست (§12) خارطة تصاعدية مع نموذج `verificationLevel` (0–6f) و `Organization.trustLevel` و `TrustVerification`:

| معياري §12 | التمثيل الحالي |
|---|---|
| Level 0 Unverified | `verificationLevel=0` |
| Level 1 Registered | `isEmailVerified` / تسجيل |
| Level 2 Identity Verified | `verificationLevel=2` (KYC مرر) |
| Level 3 Document Verified | مرتبط بـ `UserVerification` نوع وثائقي |
| Level 4 Physical Data Verified | ✅ `TrustVerification.PHYSICAL_DATA` (يرفع `Organization.trustLevel=4`) |
| Level 5 Laboratory Result | ✅ `TrustVerification.LAB_RESULT` (يرفع `trustLevel=5`) |
| Level 6 Certification | ✅ `TrustVerification.CERTIFICATION` (يرفع `trustLevel=6`) |

> **مطابقة تراكمية**: النظام يعرض حالة التحقق الفعلية (وليس رقماً تسويقياً). `AuthorizeService` يقرر `ALLOW | REQUIRE_VERIFICATION | REQUIRE_REVIEW | BLOCK` من هذه الحالة فعلياً.
>
> **المستويات 4–6 (تفعيل §12 —جيوفمبر 2026)**: الترقية الصاعدة متسلسلة (لا قفز) وقائمة على العوامل:
> `POST /api/v1/trust/apply` (عضو) → `POST /api/v1/trust/:orgId/factors/:factor/approve|reject` (منصّة، `trust:evaluate` — وحدة compliance، SoD معزولة عن صلاحيات المؤسسة).
> بوابة السياق المؤسسي تمزج مستوى المستخدم بمستوى المؤسسة: `level = max(userLevel, orgTrustLevel)` في سياق org، فتُقيَّد المزايا الحساسة (`supplier:trustedNetwork` عند 4، `product:premiumCertified` عند 6) فعلياً حتى تتحقق عواملها.
> أدلة الفتحة: `GET /trust/status`، `GET /trust/entitlements/*` — وكل اعتماد يُدوَّن `TRUST_FACTOR_APPROVE` بدرجة CRITICAL.

---

## 7. BLOCKCHAIN — EVIDENCE & AUDIT LAYER (§13–§15، §31)

**القاعدة المثبتة**: Blockchain ≠ ERP وليست قاعدة البيانات الرئيسية. هي سجل الأدلة فقط.

المسار: `JOHAR ID → حدث التحقق → hash → BlockchainEvidence → timestamp`.
**التحقق من النزاهة**: `Integrity Check → Mismatch → Alert` (يوجد `CheckIntegrity` في `BlockchainBridgeService`).

**ممنوع صراحةً (لا نضع على البلوكشين)**: كلمات مرور، بيانات KYC تفصيلية، وثائق شخصية حساسة، أسرار تجارية — فقط `Hash/Reference/Proof`.

**التدفقات المتكاملة**:
- ERP→Blockchain (§31): ERP يكمل العملية الحساسة → Blockchain يثبّت حدثها → Audit يوثق `timestamp+actor+reference`.
- AI→Blockchain (§32): AI يولّد تقييماً → workflow مصرّح به يثبّت الحدث → يُثبّت المرجع (لا «AI writes truth to Blockchain»).

---

## 8. MARKETPLACE (§16، §29)

- Marketplace = **Commerce Engine** لا ERP.
- ERP يتغذى بالمنتج/المخزون/السعر/العميل، Marketplace يعرض ويتاجر (§29) — مثبت بالفراغ (فصل نماذج `GoldAsset`/`GoldErpInventory` عن `MarketplaceItem`).
- القنوات: B2C (`marketplace/*`)، B2B/B2G (`b2bRoutes` + `B2bController`)، C2C مؤجلة هنا لشروط النموذج.
- الحماية: كل عرض بيع يخضع لـ `listing:create` (مصفوفة) + التحقق التدريجي.

---

## 9. ONE ACCOUNT و BUSINESS PROFILE (§17–§18)

**مطبّق حرفياً**: حساب واحد (`User`) له Personal Profile + حساب أعمال عبر `accountType` + أدوار متعددة عبر `OrgMember.orgRole` + مؤسسات متعددة (`Organization`/`OrgMember`) مع **عضوية نشطة واحدة** وتبديل السياق (`/orgs/:id/switch`).

```
User (1) ──< Organization ⭢ (N)  مع OrgMember(role) — سياق نشط واحد
User (1) ── accountType (CUSTOMER..INSTITUTIONAL) — 17 نوعاً
صلاحيات تتغير بالسياق: platformRole ∩ orgRole ∩ accountType deltas
```

صلاحيات الاقتصاديين (§17 — الأدوار الـ16) تمثلها `AccountType` + `OrgRole`.

---

## 10. RBAC + ABAC (§19) → Matrix Mapping

- **RBAC**: `Role.permissions` (legacy) + `Permission`/`RolePermission` (جديد) + أدوار المنصة 9 + أدوار المؤسسة 9.
- **ABAC**: قواعد السمة في `AuthorizeService` — الشركة الصحيحة (`activeOrgId`)، نطاق المنتج، البلد المسموح، حالة المعاملة، دولة التحقق.
- **المرجع الكامل**: `JOHAR-PermissionMatrix-v1.md` (95 صلاحية + tiers + scope + risk + SoD).
- **القرار المركزي**: `authorize(ctx, code, opts)` → `ALLOW | REQUIRE_VERIFICATION | REQUIRE_REVIEW | BLOCK` + `toHttpStatus` (200/428/423/403).

---

## 11. SECURITY (§20) — الوضع مع الفجوات

| الضابط | الحالة |
|---|---|
| MFA (TOTP) | ✅ `mfaEnabled/mfaSecret` + مسارات `/auth/mfa/*` |
| كلمات المرور | ✅ bcrypt؛ اختيارياً Argon2id لاحقاً |
| Encryption | ✅ AES في `config` (ENCRYPTION_KEY)؛ تشفير NFC/Ownership |
| RBAC/ABAC | ✅ (القسم 10) |
| API Security + Rate Limiting | ✅ limit 100/دقيقة قابل للضبط + CORS + Helmet/CSP |
| Secrets Management | ✅ متغيرات بيئة عبر Netlify/`.env.production` مضمنة في اليدّ |
| Secure Logging + Audit | ✅ `AuditLog` (مرئي، محمي بـ `audit:read`) |
| SIEM | ✅ تصدير حيّ: `GET /audit/export/siem` (NDJSON/CEF، `audit:export`) |
| Backup / DR | ✅ سياسة معتمدة: PITR + نسخ دورية + خارج الموقع (`docs/SECURITY-OPERATIONS.md`) |
| Vulnerability/PT | ✅ برنامج نصف سنوي + حالات إلزامية + فتحة trust:evaluate كحالة مرجعية |
| Incident Response | ✅ Playbook بـ 7 خطوات + تشكيلة أدوار (`docs/SECURITY-OPERATIONS.md`) |

**مبادئ**: Security-by-Design (ضوابط من أول سطر)، Zero-Trust (قفل حساب + JWT + MFA)، لا تكشف أسراراً أبداً.

---

## 12. COMPLIANCE ENGINE (§21) — القرار المطابق

```
COUNTRY → PRODUCT CLASSIFICATION → ACTIVITY → LEGAL REQUIREMENTS
→ KYC/KYB → TRANSACTION RULES → DOCUMENTS → RISK → DECISION
DECISION: ALLOW | REVIEW | BLOCK
```

- الترميز الفعلي: `AMLComplianceService` + `KYCVerificationRouter` + دلتا المخاطرة (`risk` في السجل) + هدف `compliance:decide` للمراجعة الإنسانية.
- الآن: **Decision** هو ناتج `authorize()` (⚖️ ALLOW/REQUIRE_REVIEW/BLOCK) والـ AML مدمج في مسارات الحساسة.
- الفجوة: تقييم country-KYC الأوتوماتيكي التام للامتداد الجغرافي (§35) — مخصص للمرحلة 2.

---

## 13. DATA ARCHITECTURE (§22–§23) — ERD منطقي

43 موديلاً في مجموعات عمل:

```
IDENTITY         User, Role, Permission, RolePermission, Organization, OrgMember, ExternalEntity, EmailOtp
PRODUCT/JOHAR ID GoldAsset, DigitalIdentity, DigitalPassport, OwnershipKey, QR/NFC (في GoldAsset/NfcController)
ERP/INVENTORY    GoldErpInventory, Warehouse, AssayLab, AssayRecord, CustodyVault, ChainOfCustody, CustodyTransferRequest
HR               Worker, WorkerType, SalaryPayment
AI               AiAnalysisResult, AiFraudLog
EVIDENCE         BlockchainEvidence, ErpAuditTrail, AuditLog, AuditorWatchLog
MARKETPLACE      MarketplaceItem, EscrowLedger, EscrowEvent
LOGISTICS        LogisticsEvent
COMPLIANCE       UserVerification, NotaryAccount, NotaryRecord, DigitalRegistrar, DigitalRegistrarLog
CRM/COM         NewsletterSubscriber, Article, BuyerProgramRegistration, ContactMessage
API              ApiKey
```

تدفّق البيانات (§23): `USER → IDENTITY → AUTH → AUTHORIZATION → ERP/MARKETPLACE → PRODUCT → JOHAR ID → AI → VERIFICATION → COMPLIANCE → BLOCKCHAIN EVIDENCE → AUDIT` — مطابق لمسار الطلبات في `configureGlobalHandlers` وطبقة `authz` الوسطى.

---

## 14. API-FIRST (§24): المواصفة الحيّة + المسارات الفعلية

### ✅ العقد الحيّ (جيوفمبر 2026)

- **`GET /api/v1/openapi.json`** — مواصفة OpenAPI 3.0.3 مولّدة آلياً من شجرة مسارات Express الفعلية (introspection على `app._router`)؛ مصدر واحد للحقيقة بلا توزيع مزدوج بين الكود والوثيقة. كل نقطة تحمل:
  - `x-johar.permission` — الصلاحية المسندة من سجل الصلاحيات (code/module/minTier/risk/sensitive) + `x-johar.scope`
  - `x-johar.secured` — عام أو محمي بـ JWT (Bearer)
  - الاستجابات القياسية (400/401/403/404/409/428/429/500) فوق غلاف `{success, data, error}` الموحد
- **`GET /api/v1/docs`** — توثيق HTML ذاتي الاكتفاء (CSP-safe، بلا سكربتات خارجية) يعرض 181 نقطة مصنفة بالوسوم
- **`GET /api/v1`** — جذر الخدمة يعرض `contract` و `docs`

### الحالي (كلها `/api/v1`)
`auth` (register/login/otp/mfa/google) · `assets` (register/gold/verify/merge/split/status) · `ai` (analyze-jewellery/fraud-check) · `custody` (transfer/approve) · `erp` · `audit` · `vaults` · `marketplace` · `hr` · `financial` · `assay` · `digital-identity` · `compliance` · `system` · `ownership` · `logistics` · `contact` · `admin` · `stats` · `b2b` · `orgs` · `trust` (جديد).

> العدد الفعلي المُدرج في العقد الحيّ: **181 نقطة** عبر 24 وسماً (ERP 35، AUTH 11، PUBLIC 7، …) تُحدَّث تلقائياً عند كل إعادة نشر.

### مواصفة الحقول الناشئة (المرحلة 1 قياساً على §24)
```
POST /products                 (product:create)          — تسجيل أصل → نشوء JOHAR ID
GET  /products/{id}            (public / product:read)   — جواز التوأم الرقمي
POST /products/{id}/analyze    (product:classify)        — AI Assessment (§25/§9)
POST /products/{id}/verify     (identity:verify)         — Human/Lab verifier
GET  /products/{id}/identity   (joharid:read)            — هوية + تاريخ تحقق
POST /products/{id}/transfer   (joharid:transfer)        — نقل ملكية + Event Evidence
POST /orders                   (order:create)            — B2B/B2C
POST /inventory/movements      (inventory:update)        — حركات الجرد
POST /blockchain/evidence      (مقسوم per-event)         — تثبيت المرجع (§31)
POST /kyb/{orgId}/approve      (kyb:approve)             — تم ✓ في /orgs/:id/kyb/approve
```
الاتصال: `API Gateway` لاحقاً + `OAuth2/OIDC` (Google OAuth يعمل الآن) — لا Raw auth على المنتجات.

---

## 15. EVENT-DRIVEN (§34) — الأحداث المعيارية

ProductCreated · ProductRegistered · ProductVerified · AIAnalysisCompleted · DocumentUploaded · LaboratoryResultAdded · ListingPublished · OrderCreated · PaymentConfirmed · ShipmentCreated · OwnershipTransferred · ProductSuspended · ProductRetired

**الحالي**: أحداث موثقة عبر `AuditLog` + `BlockchainEvidence` + `ErpAuditTrail` (مسجّلة بالنوع والمرجع). **لاحقاً**: Event Bus (Redis Streams/Kafka) عند اللامركزية.

---

## 16. GLOBAL SCALABILITY (§35) والجديدة

- الآن: `ALGERIA` كسوق أول؛ البنية تدعم `preferredLanguage` (AR/FR/EN) + `preferredCurrency` (DZD/EUR/USD) + `registrationCountry` على كل مؤسسة.
- لكل سوق لاحق: `Country Compliance Layer` (قواعد قانونية معزولة) فوق `Global Core`.

---

## 17. MVP BACKLOG (§38–§42) — الحالة الفعلية

| بند MVP 1.0 | الحالة | ملاحظات |
|---|---|---|
| Identity (User/Business) | ✅ | User/Org/OrgMember/One-Account + switch |
| Product Registration + JOHAR ID + Serial + QR/NFC | ✅ | `GoldAsset` → `DigitalIdentity` → `DigitalPassport` + NfcController |
| Basic ERP | ✅ | سجل الحفظ، الجرد، الخزائن، الحيازة |
| Marketplace | ✅ | `MarketplaceItem` + escrow + b2b |
| AI Assessment | ✅ | المحركات الخمسة + قيود §9 |
| Verification Workflow | ✅ | KYC/KYB + `verificationLevel` + Trust لأنواع |
| Documents | ✅ جزئياً | جواز رقمي + مرفقات؛ فواتير عامة ⏳ |
| Audit Logs | ✅ | مركزي + فلترة/إحصاءات + SoD |
| Blockchain Evidence | ✅ | `BlockchainBridgeService`/`BlockchainEvidence` |
| Security Foundation | ✅ | جاهز لضوابط §11 |

**Phase 2** (ERP متقدم: Suppliers/Procurement/CRM كاملة + Logistics + B2B APIs + Lab integration) — **التالية الموصى بها**.  
**Phase 3** (Material Intelligence، Fraud، Document/Market Intelligence).  
**Phase 4** (Institutional: معامل، موفرو لوجستيك، Payments حسب التصريح، Compliance متقدم).  
**Phase 5** (Global: ALG→AFR→MENA→EU→Global + Country Layer).

---

## 18. ACCEPTANCE CRITERIA (معايير القبول للشريحات)

**ضابط رئيسي (NORTH STAR §37)**: VAA = Verified Active Assets (عدد الأصول النشطة ذات الهوية وحالة تحقق سليمة). ثانوياً: Verified Users/Operators، GMV، Countries، Verification Rate، Trust/Integrity Metrics.

> **مفعّل**: `GET /api/v1/stats/vaa` (audit:read، منصّة) يحسب: `vaa` (أصل نشط + هوية رقمية فعّالة + جواز غير ملغي) ÷ إجمالي الأصول + معدل التوثيق، المستخدمون الموثقون، المؤسسات الموثقة وتوزيع trustLevel، الدول، وحجم طابور HITL.

معايير قابلة للتحقق (Accept → Fail):

| معيار | طريقة التحقق |
|---|---|
| كل منتج مسجّل له JOHAR ID فريد وتوأم رقمي قابل للعرض | `GET /products/{id}/identity` → 200 مع جواز ممتلئ |
| كل عملية حساسة مقيدة بالمصفوفة (RBAC+ABAC) | استدعاء `authz` وسيط فعلي، إحصاء 403/428 على المنحة |
| منع اختراق SoD (لا يقرّر الموافق على طلبه) | اختبار: OWNER يحاول `kyb/approve` على مؤسسته → 403 |
| AI لا يصدر أحكام «مطلق» بدون شهادة | فحص سلسلة «certified/genuine» في مخرجات API |
| كل حدث حساس موثق على البلوكشين كـEvidence | فحص `BlockchainEvidence` لكل `transfer/approve/status` |
| سجل التدقيق لا يقبل الحذف (append-only) | اختبار محاولة تعديل → فشل/mismatch |
| لا توجد بيانات حساسة صريحة على البلوكشين | فحص نموذج `BlockchainEvidence` (hash/ref فقط) |
| الترقية التدريجية تفعل أولاً: seller لا يبيع قبل Tier 2 | طلب `listing:create` بمستوى دون → 428 REQUIRE_VERIFICATION |
| صلاحية واحدة مرجعية لكل ماهية (لا تعدد مصدر حقيقة) | `PermissionRegistry` مصدر وحيد + ليست كودات مبعثرة |
| قائمة MVP 1.0 بالكامل خضراء قبل إعلان GA | لوحة مؤشرات الحالة (جدول §17) |

---

## 19. RACI لفهم الكاتب (كل طرف يفهم وحده)

| القسم | المؤسس/CTO | Backend | AI | Blockchain | ERP | أمن | قانوني |
|---|---|---|---|---|---|---|---|
| §1–§3، §16، §43 | القاعدة الفنية | — | — | — | — | — | الرؤية |
| §4، §8، §11، §14، §29 | — | مدخلات البيانات والجداول/الواجهات | — | — | **الملكية** | — | — |
| §5، §7، §9، §10، §25–26، §30، §32 | — | دمج النتائج | **الملكية** | تثبيت | تدفق | — | قيود التعليل |
| §6، §12، §13–15، §31 | — | تحقق الهوية | — | **الملكية** | توثيق | نزاهة | حوكمة |
| §19، §10، §20، §26، §40 | قرارات الصلاحية | بوابة ABAC | — | — | SoD | **الملكية** | — |
| §21، §11، §35 | — | القرار الآلي | — | — | — | — | **الملكية** |
| §22–23، §24، §33، §34، §38–42 | تسليم الأولويات | **الملكية** للواجهات/الهجرة | L5 | L7 | L3 | L2 | L11 |

---

*وثيقة استنادية تُحدَّث عند كل شريحة. السجل المرجعي للصلاحيات: `JOHAR-PermissionMatrix-v1.md`، والشروط السلوكية: `JOHAR-Access-Permissions-Spec-v1.md`.*