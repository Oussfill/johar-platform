# JOHAR — USER & ECONOMIC OPERATOR ROLES AND PERMISSIONS SPECIFICATION

**Version 1.0 — Functional Specification for Development**

- Platform: JOHAR
- Parent Ecosystem: AFZOM
- Scope: Customers, Economic Operators, Professionals, Companies and Institutional Users
- Architecture: Role-Based Access Control (RBAC) + Attribute-Based Access Control (ABAC) where required.

---

## 1. OBJECTIVE

يجب أن تسمح منصة JOHAR لأي مستخدم بالدخول والتعامل بسهولة، مع المحافظة على مستوى عالٍ من:

- الهوية الرقمية
- حماية البيانات
- KYC/KYB عند انطباقها
- الثقة والتحقق
- إدارة البيع والشراء
- إدارة المنتجات والخدمات
- التجارة B2C / C2C / B2B / B2G
- التجارة المحلية والدولية وفق المتطلبات القانونية
- تتبع المعاملات
- إدارة الوثائق
- الأمن السيبراني
- الامتثال

المبدأ الأساسي:

**«Simple Entry — Progressive Verification — Controlled Access — Full Auditability»**

دخول سهل → تحقق تدريجي → صلاحيات حسب الدور → رقابة وتدقيق كامل.

---

## 2. USER ACCOUNT TYPES

يدعم النظام على الأقل الأنواع التالية:

| # | Account Type | Description |
|---|--------------|-------------|
| A | Individual / Customer | المستخدم الفردي / الزبون |
| B | Individual Seller | فرد يبيع منتجاً أو أصلاً مؤهلاً وفق القواعد القانونية |
| C | Professional / Independent Operator | متعامل اقتصادي فردي / مهني مستقل |
| D | Company / Organization | شركة أو مؤسسة |
| E | Manufacturer | مصنع / منتج |
| F | Artisan / Craftsman | حرفي / صائغ / صانع |
| G | Trader | تاجر |
| H | Importer / Exporter | مستورد / مصدر |
| I | Supplier | مورد |
| J | Distributor / Wholesaler | موزع / تاجر جملة |
| K | Laboratory / Testing Entity | جهة فحص أو مختبر وفق الصلاحيات القانونية والتقنية |
| L | Logistics Operator | متعامل في النقل واللوجستيك |
| M | Service Provider | مقدم خدمات |
| N | Technology / Digital Operator | شركة أو مهني في الرقمنة والتكنولوجيا |
| O | Mining / Raw Materials Operator | متعامل في التعدين أو المواد الأولية |
| P | Industrial Operator | متعامل صناعي |
| Q | Institutional / Government User | مستخدم مؤسساتي / حكومي وفق اتفاق وصلاحيات محددة |

---

## 3. IMPORTANT ARCHITECTURAL PRINCIPLE

لا يجب أن تكون المهنة وحدها هي التي تحدد الصلاحيات.

مثلاً:
- "Manufacturer" ≠ Automatically Verified Manufacturer
- "Laboratory" ≠ Automatically Accredited Laboratory
- "Trader" ≠ Automatically Authorized Trader

الحساب في النظام وفق:

**«ACCOUNT TYPE + VERIFICATION STATUS + ROLE + PERMISSIONS + JURISDICTION + PRODUCT CLASS + RISK LEVEL»**

---

## 4. USER REGISTRATION

Step 1 — Basic Registration:

- Mobile Number / Email
- Password / Passkey
- Country
- Language
- Consent
- Terms & Privacy

ثم إنشاء: **JOHAR Account ID**

---

## 5. PROGRESSIVE VERIFICATION

لا نطلب من المستخدم منذ البداية جميع الوثائق إذا لم تكن ضرورية.

### Level 0 — Visitor

يمكن:
- تصفح المنصة، البحث، مشاهدة المنتجات العامة
- استعمال Verify العام عندما يكون متاحاً
- الاطلاع على المعلومات العامة

لا يمكن:
- البيع، تنفيذ عمليات شراء مقيدة، الوصول إلى البيانات الحساسة

### Level 1 — Registered User

يمكن:
- إنشاء حساب، إدارة الملف الشخصي، حفظ المنتجات
- إنشاء قوائم المفضلة، طلب معلومات، التواصل وفق النظام
- بدء عملية شراء وفق القواعد، متابعة الطلبات

### Level 2 — Verified Individual

بعد التحقق المطلوب:
- شراء، بيع المنتجات المسموح بها، إنشاء Listings وفق السياسة
- إدارة المعاملات، التحويلات المسموح بها
- تحميل الوثائق المطلوبة، استعمال JOHAR ID المرتبط بالمنتجات

### Level 3 — Verified Economic Operator

للمؤسسات والمتعاملين الاقتصاديين:
- Company Profile، KYB، Authorized Representatives
- Products، Inventory، Orders
- B2B، B2C، B2G حيث يسمح النظام
- Import/Export workflows
- Documents، Invoices / commercial documents where applicable
- Logistics، API access according to subscription/authorization

---

## 6. CUSTOMER PERMISSIONS

**Account:** إنشاء الحساب، تسجيل الدخول، تعديل الملف الشخصي، إدارة الأجهزة والجلسات، MFA، تغيير كلمة المرور، إدارة الخصوصية

**Discovery:** البحث، تصفية المنتجات، مقارنة المنتجات، مشاهدة بيانات المنتج العامة، مشاهدة حالة JOHAR ID المتاحة للعامة

**Purchase:** إضافة إلى السلة، إنشاء طلب، اختيار وسيلة التسليم المتاحة، متابعة الطلب، إلغاء الطلب وفق الشروط، طلب الإرجاع وفق الشروط، تقييم المنتج/الخدمة وفق السياسة

**Verification:** Scan QR، NFC interaction، Verify JOHAR ID، مشاهدة نتيجة التحقق العامة

**Communication:** إرسال استفسار، التواصل مع البائع عبر النظام، استقبال الإشعارات

---

## 7. CUSTOMER DOES NOT HAVE

الزبون العادي لا يستطيع:
- تعديل بيانات منتج يملكه بائع آخر
- تعديل شهادة مختبر / سجل تدقيق
- تغيير JOHAR ID / Serial Number
- اعتماد منتج / مختبر / شركة
- الوصول إلى بيانات KYC/KYB الخاصة بغيره / البيانات الحساسة
- تنفيذ وظائف إدارية، إصدار شهادة رسمية باسم JOHAR
- تغيير حالة منتج إلى VERIFIED من تلقاء نفسه

---

## 8. ECONOMIC OPERATOR — GENERAL MODEL

Business Profile يتضمن حسب نوع النشاط: Legal Name، Trade Name، Legal Form، Registration Information، Country، Address، Contact Information، Authorized Representatives، Business Activity، Licenses، Tax/Commercial Information، Verification Status، Documents، Compliance Status

---

## 9. ECONOMIC OPERATOR CAPABILITIES

**Products:** إنشاء/تعديل مسموح، إدارة الصور والمواصفات، ربط JOHAR ID، Serial Number management، QR/NFC association، إدارة الوثائق

**Inventory:** إضافة/تحديث/تتبع المخزون، معرفة الحالة، منتجات قديمة وجديدة

**Sales:** إنشاء Listing، البيع، إدارة الطلبات وعروض الأسعار، B2B/C2C حيث يسمح النموذج، B2G حيث يسمح القانون

**Purchasing:** البحث عن الموردين، طلب عروض، الشراء، إدارة أوامر الشراء، متابعة التوريد

**Transactions:** إدارة المعاملات ومتابعة الحالة، الوثائق، الشحن، الفواتير/المستندات

---

## 10. TRANSACTION MODELS

| Model | Meaning | Activation |
|-------|---------|------------|
| B2C | Business → Customer | قياسية |
| C2C | Customer → Customer | فقط للمنتجات والأنشطة التي يسمح بها الإطار القانوني |
| B2B | Business → Business | قياسية بين معتمَدين |
| B2G | Business → Government/Institution | يحتاج Institutional verification + Authorized users + Tender/RFQ/procurement workflow + Audit trail + Compliance، ويُفعّل وفق الإطار القانوني |
| G2B / G2C | Official services | مستقبلاً عبر تكاملات رسمية مصرح بها |

---

## 11. OLD / NEW PRODUCTS

يدعم النظام: NEW، EXISTING، PRE-OWNED، REFURBISHED / RESTORED، SECONDARY MARKET — حسب القانون والسياسة.

لا ينشئ انتقال الملكية هوية رقمية جديدة للمنتج إذا كانت الهوية الأصلية مستمرة:

**«ONE PRODUCT ID → MULTIPLE VERIFIED EVENTS»**

---

## 12. PRODUCT OWNERSHIP

الفصل بين: Product Identity / Ownership / Listing / Transaction.

مثال: `JOHAR ID: JH-XXXXX` ينتقل بين Owner A → Owner B → Owner C مع سجل تدقيق مناسب وحماية بيانات المالكين.

---

## 13. SERVICE PROVIDERS

JOHAR ليست للسلع فقط — تقبل مقدمي الخدمات: Technology، Digitalization، ERP، Consulting، Logistics، Maintenance، Design، Engineering، Professional Services، Testing Services، Industry Services. لكل خدمة: Service Category + Provider Profile + Verification Status + Scope of Service.

---

## 14. SECTOR-NEUTRAL ARCHITECTURE

الهيكل الأساسي: **«USER → ORGANIZATION → ROLE → ACTIVITY → PRODUCT/SERVICE → TRANSACTION»**

يمكن مستقبلاً: Gold، Jewelry، Gems، Precious Metals، Mining، Manufacturing، Industry، Digitalization، Technology، Logistics، Professional Services، International Trade — مع بقاء JOHAR متخصصة في نطاقها الأساسي.

---

## 15. ROLE SYSTEM

الفصل بين: USER (من هو؟)، ORGANIZATION (لمن يعمل؟)، ROLE (ما دوره؟)، PERMISSION (ماذا يستطيع؟)، SCOPE (على ماذا؟).

مثال: User A → Organization X → Role Sales Manager → Permission Create Listing → Scope: Organization X Products فقط.

---

## 16. MULTI-ROLE

المستخدم يحمل أكثر من دور حسب Active Organization + Active Role.

---

## 17. ORGANIZATION TEAM

Owner / Administrator / Manager / Sales / Procurement / Finance / Logistics / Compliance / Inventory / Viewer — بصلاحيات مستقلة.

---

## 18. EXAMPLE — COMPANY PERMISSIONS

- **OWNER**: صلاحيات كاملة داخل المؤسسة
- **ADMIN**: إدارة المستخدمين والعمليات المسموح بها
- **SALES**: Products, Listings, Orders, Customers
- **PROCUREMENT**: Suppliers, Purchase Orders, Procurement
- **INVENTORY**: Stock, Product status, Warehouse
- **LOGISTICS**: Shipments, Delivery status
- **COMPLIANCE**: Documents, Verification, Compliance cases
- **VIEWER**: قراءة فقط

---

## 19. PERMISSION CATEGORIES

Permission Matrix مركزية بالكودات:
ACCOUNT، PROFILE، PRODUCTS، JOHAR ID، QR/NFC، INVENTORY، MARKETPLACE، ORDERS، TRANSACTIONS، DOCUMENTS، USERS، REPORTS، API — كل فئة بأفعال: CREATE / READ / UPDATE / DELETE / DEACTIVATE / ARCHIVE / VERIFY / ASSOCIATE / TRANSFER / GENERATE / REVOKE / ADJUST / LISTING / PUBLISH / UNPUBLISH / CANCEL / RETURN / DISPUTE / UPLOAD / DOWNLOAD / INVITE / ASSIGN ROLE / SUSPEND / REMOVE / EXPORT / MANAGE KEYS.

---

## 20. RISK-BASED ACCESS

LOW RISK → normal workflow، MEDIUM RISK → additional verification، HIGH RISK → manual review، BLOCKED → transaction blocked.

---

## 21. SENSITIVE OPERATIONS

تتطلب MFA + Re-authentication + Authorization check + Audit Log: تغيير بيانات حساسة، نقل ملكية، تعديل وثائق أساسية، تغيير بيانات شركة، API key management، تغيير صلاحيات المستخدمين، عمليات مالية/تجارية حساسة، إلغاء/تعليق منتج مؤهل.

---

## 22–23. DASHBOARDS

**Customer:** My Profile, Orders, Purchases, Favorites, Verified Products, Transactions, Messages, Notifications, Security, Privacy.

**Economic Operator:** Business Profile, Verification, Products, JOHAR IDs, Inventory, Listings, Orders, Sales, Purchases, Customers, Suppliers, Documents, Logistics, Compliance, Analytics, Team, API, Security.

---

## 24. EASY ENTRY PRINCIPLE

الصفحة الأولى: «What are you here to do?» → Buy / Sell / Verify / Manage my Business / Offer Services / Trade Internationally → ثم يحدد النظام المسار المناسب.

---

## 25. SMART ONBOARDING

اختيار "I want to Buy" → Individual Account؛ واختيار "I want to Sell" لاحقاً يطلب الترقية إلى Seller / Economic Operator Verification بدلاً من إعادة إنشاء الحساب.

---

## 26. ONE ACCOUNT — MULTIPLE ACTIVITIES

«ONE JOHAR ACCOUNT» يحوي Personal Profile + Business Profiles + Roles + Products + Transactions + Digital Assets، مع فصل كامل للصلاحيات والبيانات.

---

## 27. VERIFICATION BADGES

حالات واضحة وليست شعارات توحي باعتماد رسمي غير موجود: Registered، Identity Verified، Business Verified، Document Verified، Product Verified، Laboratory Result Available، Certification Document Available — مع بيان الجهة التي تحققت.

---

## 28. ADMINISTRATIVE PRINCIPLE

«Separation of Duties»: Laboratory Result ← مختبر مصرح، Platform Verification ← سير عمل JOHAR، Certification ← جهة اعتماد، Platform Administration ← مسؤول JOHAR.

---

## 29. AUDITABILITY

كل عملية مهمة تسجل: User ID، Organization ID، Role، Action، Object، Timestamp، IP/Device، Previous State، New State، Result، Risk/Compliance reference — مع حماية سجلات التدقيق من التعديل غير المصرح به.

---

## 30. CORE ACCESS MODEL

«RBAC + ABAC + KYC/KYB + Risk + Compliance + Audit» وليس فقط «Username + Password».

---

## 31. DEVELOPER REQUIREMENT

بناء الصلاحيات مركزياً في Authorization Service. Architecture:

`USER → AUTHENTICATION → IDENTITY → ORGANIZATION → ROLE → PERMISSION → ATTRIBUTE/SCOPE → RISK & COMPLIANCE → AUTHORIZATION → ACTION → AUDIT LOG`

---

## 32. GOLDEN RULE

أي عملية تسأل: WHO? ON BEHALF OF WHOM? WHAT ROLE? WHAT ACTION? ON WHICH OBJECT? UNDER WHICH JURISDICTION? IS USER VERIFIED? IS ORGANIZATION VERIFIED? IS PRODUCT ELIGIBLE? IS TRANSACTION ALLOWED? ADDITIONAL REVIEW?

ثم: **ALLOW / REQUIRE VERIFICATION / REQUIRE REVIEW / BLOCK**

---

## 33. FINAL DEVELOPMENT PRINCIPLE

JOHAR: Easy to Enter، Easy to Use، Difficult to Abuse، Easy to Verify، Fully Auditable، Scalable Globally — مع احترام قوانين كل سوق.

---

## 34. MASTER USER FORMULA

«ONE ACCOUNT → MULTIPLE ROLES → MULTIPLE ORGANIZATIONS → CONTROLLED PERMISSIONS → PROGRESSIVE VERIFICATION → SECURE TRANSACTIONS → FULL AUDIT TRAIL»

> This specification is intended to be used as a functional baseline for the JOHAR PRD/SRS, RBAC/ABAC design, database model, API authorization model and UX onboarding flows.