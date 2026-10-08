# JOHAR — PERMISSION MATRIX v1.0

**التوثيق التقني الموسّع الصادر عن «JOHAR User & Economic Operator Access & Permission Specification v1.0»**
**Output for Backend Developer: RBAC Database + API Authorization**

- النموذج المعتمد: `RBAC + ABAC + KYC/KYB + Risk + Compliance + Audit`
- المبدأ: **Account Type + Verification Status + Role + Permissions + Jurisdiction + Product Class + Risk Level**
- كل عملية: `ALLOW | REQUIRE VERIFICATION | REQUIRE REVIEW | BLOCK`

---

## 1. VERIFICATION TIERS (ما قبل الصلاحيات)

| Tier | Name | Entry condition | إجمالاً |
|------|------|-----------------|---------|
| T0 | Visitor | لا حساب | تصفح/بحث/verify عام |
| T1 | Registered | account منشأ وافعّل | ملف شخصي، مفضلة، تواصل، start purchase |
| T2 | Verified Individual | + Identity Verification + وسيلة توثيق | شراء، بيع مؤهل، Listings، نقل ملكية مؤهل |
| T3 | Economic Operator | + KYB + ترخيص/نشاط حسب النوع | B2B/B2C/B2G، فريق، مخزون، API |

قاعدة: `requesting tier ≥ permission.minTier` وإلا `REQUIRE VERIFICATION`.

---

## 2. PERMISSION REGISTRY (السجل الرئيسي)

العمود `Req` = أدنى Tier مطلوب؛ `Risk` = المستوى الافتراضي؛ `Sens` = عملية حساسة (MFA + Re-auth + Audit إلزامي).

| Code | Module | Action | Req | Risk | Sens |
|------|--------|--------|-----|------|------|
| account:create | account | إنشاء حساب | T1 | LOW | – |
| account:read | account | عرض بيانات حسابه | T1 | LOW | – |
| account:update | account | تعديل بيانات الحساب | T2 | MED | ✓ |
| account:deactivate | account | إلغاء/تعطيل حسابه | T2 | MED | ✓ |
| account:mfa | account | إدارة MFA | T1 | LOW | ✓ |
| account:sessions | account | إدارة الأجهزة والجلسات | T1 | MED | ✓ |
| profile:view | profile | عرض ملفه | T1 | LOW | – |
| profile:update | profile | تعديل الملف | T1 | LOW | – |
| identity:submit | identity | إرسال وثائق هوية | T2 | MED | – |
| identity:verify | identity | تفعيل تحقق الهوية (سير عمل) | T3+ | HIGH | ✓ |
| identity:badge | identity | عرض حالة التحقق | T1 | LOW | – |
| organization:create | organization | إنشاء مؤسسة/حساب أعمال | T2 | MED | ✓ |
| organization:read | organization | عرض سجل المؤسسة | T2 | LOW | – |
| organization:update | organization | تعديل بيانات المؤسسة | T3 | HIGH | ✓ |
| organization:deactivate | organization | تعطيل المؤسسة | T3 | HIGH | ✓ |
| team:invite | team | دعوة مستخدم للمؤسسة | T3 | MED | ✓ |
| team:assignrole | team | تعيين دور | T3 | HIGH | ✓ |
| team:suspend | team | تعليق عضو | T3 | HIGH | ✓ |
| team:remove | team | إزالة عضو | T3 | HIGH | ✓ |
| product:create | product | إنشاء منتج/خدمة | T2 | MED | – |
| product:read | product | قراءة بيانات منتج (ضمن scope) | T1 | LOW | – |
| product:update | product | تعديل منتج مملوك | T2 | MED | ✓ |
| product:archive | product | أرشفة/إلغاء منتج | T2 | MED | ✓ |
| product:classify | product | تصنيف منتج (new/used/refurbished…) | T2 | MED | – |
| joharid:create | joharid | إنشاء JOHAR ID | T2 | MED | ✓ |
| joharid:read | joharid | قراءة JOHAR ID عام | T0 | LOW | – |
| joharid:verify | joharid | Verify منتج (Scan QR/NFC) | T0 | LOW | – |
| joharid:associate | joharid | ربط JOHAR ID بمنتج | T2 | MED | ✓ |
| joharid:transfer | joharid | نقل ملكية JOHAR ID | T2 | HIGH | ✓ |
| qrnfc:generate | qrnfc | توليد QR/NFC | T2 | MED | – |
| qrnfc:associate | qrnfc | ربط QR/NFC بمنتج | T2 | MED | ✓ |
| qrnfc:read | qrnfc | قراءة بيانات QR/NFC | T0 | LOW | – |
| qrnfc:revoke | qrnfc | إلغاء/تعطيل QR/NFC | T2 | HIGH | ✓ |
| inventory:create | inventory | إدخال مخزون | T3 | MED | – |
| inventory:read | inventory | عرض المخزون (ضمن scope) | T3 | LOW | – |
| inventory:update | inventory | تحديث مخزون | T3 | MED | ✓ |
| inventory:adjust | inventory | تسوية جرد | T3 | HIGH | ✓ |
| listing:create | listing | إنشاء Listing | T2 | MED | – |
| listing:read | listing | قراءة Listing | T0 | LOW | – |
| listing:update | listing | تعديل Listing | T2 | MED | ✓ |
| listing:publish | listing | نشر Listing | T2 | MED | – |
| listing:unpublish | listing | إيقاف Listing | T2 | MED | ✓ |
| order:create | order | إنشاء طلب/شراء | T1 | MED | – |
| order:read | order | متابعة طلباته | T1 | LOW | – |
| order:update | order | تعديل طلب (ضمن قواعد) | T1 | MED | ✓ |
| order:cancel | order | إلغاء طلب وفق الشروط | T1 | MED | ✓ |
| order:return | order | طلب إرجاع وفق الشروط | T2 | MED | ✓ |
| order:fulfill | order | تنفيذ طلب (بائع) | T2 | MED | ✓ |
| transaction:view | transaction | عرض معاملاته | T2 | LOW | – |
| transaction:create | transaction | فتح معاملة مؤهلة | T2 | MED | ✓ |
| transaction:confirm | transaction | تأكيد/إتمام معاملة | T2 | HIGH | ✓ |
| transaction:dispute | transaction | فتح نزاع | T2 | MED | ✓ |
| document:upload | document | رفع وثيقة | T1 | LOW | – |
| document:view | document | عرض وثيقة (ضمن scope) | T1 | LOW | – |
| document:download | document | تنزيل وثيقة | T1 | LOW | – |
| document:verify | document | التحقق من وثيقة | T0 | LOW | – |
| document:revoke | document | إبطال وثيقة | T3 | HIGH | ✓ |
| message:send | message | إرسال استفسار/تواصل | T1 | LOW | – |
| message:read | message | قراءة رسائله | T1 | LOW | – |
| notification:read | notification | قراءة إشعاراته | T1 | LOW | – |
| logistics:create | logistics | إنشاء شحنة | T3 | MED | – |
| logistics:read | logistics | تتبع شحنة | T1 | LOW | – |
| logistics:update | logistics | تحديث حالة شحنة | T3 | MED | ✓ |
| escrow:view | escrow | عرض حساب الضمان | T2 | LOW | – |
| escrow:create | escrow | فتح ضمان لمعاملة | T2 | HIGH | ✓ |
| escrow:confirm | escrow | تحرير الضمان | T2 | HIGH | ✓ |
| finance:invoice:create | finance | إصدار فاتورة/وثيقة تجارية | T3 | MED | ✓ |
| finance:invoice:read | finance | قراءة فواتيره | T2 | LOW | – |
| report:view | report | عرض تقاريره/لوحته | T2 | LOW | – |
| report:export | report | تصدير تقرير | T2 | MED | – |
| api:keys:manage | api | إدارة مفاتيح API | T3 | HIGH | ✓ |
| api:read | api | قراءة API | T3 | LOW | – |
| api:write | api | كتابة API | T3 | MED | – |

### Platform / Internal زوايا (إدارة المنصة — اختبارات مختبر، اعتماد، تدقيق)

| Code | Module | Action | Req | Risk | Sens |
|------|--------|--------|-----|------|------|
| assay:write | assay | إدخال/تعديل نتيجة تحليل | مختبر معتمد | HIGH | ✓ |
| custody:approve | custody | اعتماد نقل حيازة | Security | HIGH | ✓ |
| notary:record | notary | توثيق صفقة | موثّق | HIGH | ✓ |
| registrar:issue | registrar | إصدار/تحديث الرقم المسجل | DeveloperRegistrar | HIGH | ✓ |
| lab:approve | lab | اعتماد مختبر/نتيجة مختبر | Compliance | HIGH | ✓ |
| kyc:approve | kyc | اعتماد KYC | Compliance | HIGH | ✓ |
| kyb:approve | kyb | اعتماد مؤسسة (KYB) | Compliance | HIGH | ✓ |
| cert:approve | cert | اعتماد شهادة (جهة اعتماد مستقلة) | Certification | HIGH | ✓ |
| compliance:read | compliance | قراءة حالة امتثال | Compliance | LOW | – |
| compliance:review | compliance | مراجعة حالة | Compliance | HIGH | ✓ |
| compliance:decide | compliance | قرار حالة | Compliance | CRITICAL | ✓ |
| audit:read | audit | قراءة سجل تدقيق | Auditor | HIGH | – |
| audit:export | audit | تصدير سجل تدقيق | Auditor | HIGH | ✓ |
| admin:users | admin | إدارة مستخدمي المنصة | Admin | HIGH | ✓ |
| admin:roles | admin | إدارة الأدوار/الصلاحيات | Admin | CRITICAL | ✓ |
| admin:settings | admin | إعدادات المنصة | Admin | HIGH | ✓ |
| admin:products | admin | إدارة منتجات/قوائم | Admin | HIGH | ✓ |
| admin:blockchain | admin | إدارة بلوكتشين/أدلة | Admin | HIGH | ✓ |
| admin:nfc | admin | إدارة صلات NFC | Admin | HIGH | ✓ |
| admin:b2b | admin | إدارة B2B | Admin | HIGH | ✓ |
| admin:workers | admin | إدارة الموظفين | Admin | HIGH | ✓ |
| admin:payments | admin | إدارة الدفعات/الفوترة | Admin | HIGH | ✓ |

---

## 3. TIER → BASE PERMISSIONS (ممنوح تلقائياً)

| Tier | Granted permission codes |
|------|--------------------------|
| T0 | `joharid:read`, `joharid:verify`, `qrnfc:read`, `listing:read`, `document:verify` |
| T1 | T0 + `account:create/read`, `account:mfa`, `account:sessions`, `profile:view/update`, `identity:badge`, `product:read`, `joharid:badge`, `order:create/read/update/cancel`, `document:upload/view/download`, `message:send/read`, `notification:read`, `logistics:read` |
| T2 | T1 + `account:update/deactivate`, `identity:submit`, `organization:create/read`, `product:create/update/archive/classify`, `joharid:create/associate/transfer`, `qrnfc:generate/associate/revoke`, `listing:create/update/publish/unpublish`, `order:return`, `order:fulfill`, `transaction:view/create/confirm/dispute`, `escrow:view/create/confirm`, `report:view/export` |
| T3 | T2 + `identity:verify*(only for org-verifier roles)`, `organization:update/deactivate`, `team:invite/assignrole/suspend/remove`, `inventory:*`, `finance:invoice:*`, `logistics:create/update`, `api:*` |

> `*` صلاحيات «ينطبق عليها الدور» لا «المستوى وحده» — راجع §5.

---

## 4. ACCOUNT-TYPE CAPABILITY PROFILES (إضافات النوع على القاعدة)

| Type | Extra capability | Notes |
|------|------------------|-------|
| A Customer | — (base T2) | |
| B Individual Seller | كامل T2 (بيع مؤهل) | يتطلب Identity + منتج مؤهل للتداول |
| C Professional Operator | T3 فردي (بدون فريق) | KYB فردي + ترخيص |
| D Company | T3 + فريق كامل | KYB شركة |
| E Manufacturer | `inventory:*`, `product:classify`, إصدار بيانات إنتاج | جهة موثقة |
| F Artisan | `product:create` مؤهل + `joharid:associate` (تعريف حرفة) | |
| G Trader | `listing:*`,`inventory:*` أكثر من T2 | ترخيص تاجر عند الطلب |
| H Importer/Exporter | `finance:invoice:*`, `logistics:*` + مستندات استيراد | B2B دولي |
| I Supplier | `inventory:*`, `finance:invoice:*` | |
| J Distributor/Wholesaler | `inventory:*`, `listing:*` واسع | |
| K Laboratory | `assay:write`, `labresult:publish`, `document:verify` | **باشتراط اعتماد مختبر** (ABAC) |
| L Logistics | `logistics:*` واسع | ترخيص نقل |
| M Service Provider | `service:create` (نطاق خدمة) | Scope of Service |
| N Technology | `api:*`, `service:create` (حلول رقمية) | |
| O Mining | `product:classify` مواد خام + وثائق | ترخيص تعدين |
| P Industrial | `inventory:*`, `product:classify`, `finance:*` | |
| Q Institutional | حسب الاتفاق الفردي (`B2G`) | Institutional verification |

---

## 5. ORGANIZATION TEAM ROLES (الصلاحيات داخل المؤسسة)

| Team Role | Granted |
|-----------|---------|
| OWNER | كل صلاحيات المؤسسة + `team:*` + `organization:*` |
| ADMIN | `team:invite/assignrole/suspend/remove`, `organization:update`, كل operations بلا `organization:deactivate` |
| SALES | `product:*` (في نطاق المؤسسة), `listing:*`, `order:*`, `customer:*` |
| PROCUREMENT | `supplier:read/create`, `purchase_order:*`, `order:create` |
| INVENTORY | `inventory:*`, `product:update` (نطاق المؤسسة) |
| LOGISTICS | `logistics:*` |
| FINANCE | `finance:invoice:*`, `escrow:view`, `report:*` |
| COMPLIANCE | `document:*`, `compliance:read/review` (لا decide), `kyc/kyb:submit` |
| VIEWER | `*:read` فقط داخل نطاق المؤسسة |

---

## 6. PLATFORM ROLES (المنصة نفسها — تبقى متوافقة مع الحالي)

| Role | Codes as-is | التوجيه وفق المواصفة §28 |
|------|-------------|---------------------------|
| SUPER_ADMIN | كل `admin:*` + كل شيء | لا يمس نتائج المختبر/الشهادات المستقلة؛ override مركزي مسجل |
| ADMIN | `admin:*` (قلل من sensitive) | |
| AUDITOR | `audit:read/export`, `compliance:read` | قراءة فقط، لا كتابة |
| CUSTODY_MANAGER | `custody:approve`, `custody:*` | |
| LAB_DIRECTOR | `lab:approve`, `assay:*` داخل مختبره | |
| MODERATOR | `listing:unpublish`, `compliance:review` | |

---

## 7. ABAC — SCOPE & ATTRIBUTE RULES

| Rule | Value | القيد |
|------|-------|-------|
| scope | `own` / `org` / `all` | product:update عليه `own` أو `org` فقط |
| operationScope | حسابات `ACTIVE_ORG <user>` | صلاحيات المؤسسة تعمل فقط عند نشاط المنظمة الحالية |
| jurisdiction | ISO country + regulation | B2G ومبيعات معينة مشروطة بها |
| productClass | new/existing/pre-owned/refurbished/secondary | بعض الصفوف مشروطة بالمنتج المؤهل |
| riskLevel | LOW/MED/HIGH/BLOCKED | يحدد مسار العملية (انظر §9) |
| verification | identityVerified / businessVerified / productEligible | بوابة لكل tier |
| separation (SoD) | على أدوار المنصة | labResult ← مختبر، cert ← جهة اعتماد، admin لا يعدّل الخارجية |

**القاعدة الذهبية لكل طلب:**
`allow = hasPermission(role, action) ∧ scopeMatches(object) ∧ tierSatisfied ∧ productEligible ∧ jurisdictionOk ∧ (riskGate passed)` وإلا `REQUIRE_VERIFICATION | REQUIRE_REVIEW | BLOCK`.

---

## 8. SENSITIVE OPERATIONS (MFA + Re-auth + Audit إلزامي)

من §21 بالكودات: `account:update`, `account:deactivate`, `account:mfa`, `account:sessions`, `organization:update/deactivate`, `team:invite/assignrole/suspend/remove`, `product:update/archive`, `joharid:create/transfer`, `qrnfc:associate/revoke`, `inventory:update/adjust`, `listing:update/unpublish`, `order:update/cancel/return`, `transaction:create/confirm`, `escrow:create/confirm`, `finance:invoice:create`, `api:keys:manage`, `admin:*`, `*:approve/decide`, `audit:export`.

---

## 9. RISK GATE (تنفيذ إلزامي قبل أي عملية Sensitive)

| Risk | Route |
|------|-------|
| LOW | normal workflow |
| MEDIUM | + verification إضافية (شيء تعرفه/تملكه) |
| HIGH | manual review (قائمة انتظار) |
| CRITICAL | ثنائي الموافقة (dual approval) |
| BLOCKED | reject قبل أي معالجة |

---

## 10. AUDIT REQUIREMENTS

لكل DENY/ALLOW للعمليات الحساسة، يُسجل: actor ID، org ID، role، action، object، timestamp، IP/UA، previous/new state، result، riskRef. سجل التدقيق append-only.

---

## 11. IMPLEMENTATION MAPPING (DB + API)

### Prisma / DB — إضافات على النموذج الحالي

```prisma
// جديدة — الملف التنفيذي الفعلي في الخطوة 2
model Organization {
  id String @id @default(cuid())
  legalName String?
  tradeName String
  legalForm String?
  registrationCountry String?
  address Json?
  licenseNumber String?
  verificationStatus String @default("UNVERIFIED") // UNVERIFIED/PENDING/VERIFIED
  kybStatus String @default("NOT_STARTED")
  ownerId String
  createdAt DateTime @default(now())
  members OrgMember[]
}

model OrgMember {
  id String @id @default(cuid())
  orgId String
  userId String
  orgRole String // OWNER/ADMIN/SALES/PROCUREMENT/INVENTORY/LOGISTICS/FINANCE/COMPLIANCE/VIEWER
  isActive Boolean @default(true)
  @@unique([orgId, userId])
}

// على User: accountType + فعال + organizationId نشط
// accountType: CUSTOMER | INDIVIDUAL_SELLER | PROFESSIONAL | COMPANY | MANUFACTURER | ARTISAN | TRADER |
//               IMPORTER_EXPORTER | SUPPLIER | DISTRIBUTOR_WHOLESALER | LABORATORY | LOGISTICS |
//               SERVICE_PROVIDER | TECHNOLOGY | MINING | INDUSTRIAL | INSTITUTIONAL
// verificationLevel: 0..3 (معطى من kycStatus + kybStatus + productEligible)

// Permission — يُفضَّل جدول مقنن بدل Json بعد الترحيل:
model Permission { id String @id @default(cuid()); code String; module String; action String; minTier Int; risk String; @@unique([code]) }
model RolePermission { roleId String; permissionId String; @@unique([roleId, permissionId]) }
```

### Authorization Service (API)

```ts
// src/services/authorization/AuthorizeService.ts — تنفيذ §31
authorize(req): Decision {
  who        = identity from JWT (+ activeOrg member check)
  role       = platformRole ∨ orgRole(activeOrg)
  permissions= resolvePermissions(role, accountType, tier)
  scope      = objectScope(object)                    // own/org/all
  gates      = tierGate(minTier) && scopeMatch && productEligible && jurisdiction && riskGate
  decision   = has(permission) && gates
  audit(decision)
  return ALLOW | REQUIRE_VERIFICATION | REQUIRE_REVIEW | BLOCK
}
```

Middleware: `authz('product:update', { scope: 'org' })` يُنفَّذ في كل مسار بدل فحص الصلاحيات المبعثر (المواصفة §31: لا perm عشوائي داخل الشاشات).

---

## 12. CHECKLIST — CROSS-TIER GUARANTEES

- [ ] الزبون لا يملك أي كود من §2-Platform ولا `*:approve/decide/*`
- [ ] انتقال الملكية لا يغيّر JOHAR ID (`joharid:transfer` يترك identity مستمرة)
- [ ] كل عملية list في §8 تسجل audit قبل الرد
- [ ] `admin` لا يعدّل نتائج مختبر/شهادات خارجية (SoD)
- [ ] B2G فقط لمنظمة Institutional verified
- [ ] المختبر يكتب `assay:write` ولا يقرأ `admin:*`
- [ ] الفريق ضمن مؤسسة لا يصل لمنتجات مؤسسة أخرى (scope org)

---

*هذه الوثيقة ستعتمد كقاعدة التنفيذ الفني للخطوة 2 (RBAC Database + API Authorization) وكل ما تلاها بموجب مبدأ «المصفوفة أولاً ثم التنفيذ».*