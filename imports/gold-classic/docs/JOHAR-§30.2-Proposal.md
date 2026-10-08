# JOHAR — Offer & Trade Proposal (§30.2/§12/§14 in BRD)

> **الحالة: اقتراح معزول — لم يُنفَّذ schema حي، ولا migration، ولا جدول إنتاجي.**
> الوثيقة مرجعية (As-Reference) مبنية حرفياً على BRD؛ التفعيل النهائي يتطلب
> موافقة صريحة على `prisma migrate dev` في قاعدة الإنتاج (Neon).
> المسودة الكاملة: `docs/JOHAR-Enterprise-BRD.md` (§30.2 §31.3 §29 §12 §14).

---

## 1. الخلفية

BRD قدّم في §30.2 نماذج Prisma مقترحة لمرحلة P2 (السلاسل التجارية): `Offer`,
`OfferSummary`, `ComplianceCase`, `KybEvidence`, `KybDocument` — في انتظار
الموافقة على الحقول الدقيقة + مصفوفة الصلاحيات. هذا الملف يوثّق الاقتراح بلا
أي لمسة لقاعدة الإنتاج.

## 2. النماذج المطابقة

ترد النماذج الخمسة كما في BRD §30.2 مع الحفاظ على كل قاعدة.

### (أ) `JoharAssetId` — المعرف المؤسسي (قسم 6)

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

### (ب) `AssetPassportLifecycle` — دورة حياة الجواز

```prisma
model AssetPassportLifecycle {
  id           String   @id @default(uuid())
  assetId      String   @unique
  passportId   String   @unique                      // DigitalPassport.id
  issuedAt     DateTime @default(now())
  status       String   @default("ISSUED")           // ISSUED|UPDATED|REVOKED|EXPIRED
  eventType    String                                // PASSPORT_ISSUE|PASSPORT_UPDATE|...
  actorId      String
  evidenceHash String?
  createdAt    DateTime @default(now())
}
```

### (ج) `Offer` — عرض/تفاوض (قسم 12)

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

### (د) `ComplianceCase` — ملف امتثال ملون (قسم 14)

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

### (هـ) `KybEvidence` — أدلة الاعتماد المؤسسي

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

---

## 3. مصفوفة الصلاحيات المقترحة

| إذن | المبدأ | النطاق |
|---|---|---|
| `offer:create/respond/cancel` | §12 | platform/org |
| `offer:read` | §12 | أي عرض ظاهر للجهة |
| `order:create/read/finalize` | §31.3 | org |
| `order:invoice/pay` | §31.2 | org |
| `procurement:*` | §31.3 | org |
| `compliance:*` | §14 | platform/org |

---

## 4. مواضع اللمس عند التفعيل (تحتاج إذناً صريحاً)

1. `prisma/schema.prisma` — إلحاق النماذج §30.2.
2. `prisma migrate dev --name johar_offer_trade` على اتصال Neon (مصادقة إنتاجية).
3. مولّد خلفي `routes/controlCenter.ts` (+ `app.ts`) — إضافة `GET /trade-overview`.
4. واجهة `controlCenterPage.tsx` — بطاقة Trade.

> لم يُنفَّذ أي مما سبق على قاعدة الإنتاج. النماذج حاضرة هنا كمرجع فقط.
