// ============================================================================
// GOLD PLATFORM — PRISMA SEED DATA
// ============================================================================
// بيانات أولية للنظام: الأدوار + المستخدم\Admin + المخزن الافتراضي + مختبر افتراضي
// تشغيل: npx prisma db seed

import { PrismaClient, Language, Currency, ListingType, Visibility, ItemCondition } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding GOLD Platform database...\n');

  // ============================================================================
  // 1. إنشاء الأدوار (RBAC Matrix)
  // ============================================================================

  console.log('Creating roles...');

  const roles = [
    {
      roleCode: 'SUPER_ADMIN',
      nameEn: 'Super Administrator',
      nameAr: 'مدير النظام الأعلى',
      nameFr: 'Super Administrateur',
      description: 'Full system access with all permissions',
      permissions: [
        'assets:register', 'assets:read', 'assets:update', 'assets:delete',
        'assay:write', 'assay:read',
        'ai:analyze', 'ai:fraud-check',
        'custody:transfer', 'custody:approve', 'custody:read',
        'erp:dashboard', 'erp:reconciliation', 'erp:fraud-alerts',
        'marketplace:manage', 'marketplace:read',
        'audit:read', 'audit:export',
        'users:manage', 'roles:manage', 'settings:manage',
      ],
      hierarchy: 10,
    },
    {
      roleCode: 'ADMIN',
      nameEn: 'Administrator',
      nameAr: 'مدير',
      nameFr: 'Administrateur',
      description: 'System administration with most permissions',
      permissions: [
        'assets:register', 'assets:read', 'assets:update',
        'assay:write', 'assay:read',
        'ai:analyze', 'ai:fraud-check',
        'custody:transfer', 'custody:approve', 'custody:read',
        'erp:dashboard', 'erp:reconciliation', 'erp:fraud-alerts',
        'marketplace:manage', 'marketplace:read',
        'audit:read',
        'users:manage',
      ],
      hierarchy: 8,
    },
    {
      roleCode: 'CUSTODY_MANAGER',
      nameEn: 'Custody Manager',
      nameAr: 'مدير الخزائن',
      nameFr: 'Gestionnaire de Conservation',
      description: 'Custody and vault operations management',
      permissions: [
        'assets:read',
        'custody:transfer', 'custody:approve', 'custody:read',
        'erp:dashboard', 'erp:reconciliation',
        'audit:read',
      ],
      hierarchy: 6,
    },
    {
      roleCode: 'LAB_DIRECTOR',
      nameEn: 'Laboratory Director',
      nameAr: 'مدير المختبر',
      nameFr: 'Directeur de Laboratoire',
      description: 'Assay lab management and certification authority',
      permissions: [
        'assets:read',
        'assay:write', 'assay:read',
        'ai:analyze',
        'audit:read',
      ],
      hierarchy: 5,
    },
    {
      roleCode: 'LAB_TECHNICIAN',
      nameEn: 'Laboratory Technician',
      nameAr: 'فني المختبر',
      nameFr: 'Technicien de Laboratoire',
      description: 'Execute laboratory tests and record results',
      permissions: [
        'assets:read',
        'assay:write', 'assay:read',
      ],
      hierarchy: 3,
    },
    {
      roleCode: 'CUSTODIAN',
      nameEn: 'Custodian',
      nameAr: 'أمين الخزينة',
      nameFr: 'Gardien',
      description: 'Physical custody and asset handling',
      permissions: [
        'assets:read',
        'custody:read',
      ],
      hierarchy: 2,
    },
    {
      roleCode: 'AUDITOR',
      nameEn: 'Auditor',
      nameAr: 'مدقق',
      nameFr: 'Auditeur',
      description: 'Read-only access for compliance auditing',
      permissions: [
        'assets:read',
        'assay:read',
        'custody:read',
        'erp:dashboard', 'erp:reconciliation',
        'audit:read',
      ],
      hierarchy: 4,
    },
    {
      roleCode: 'MARKETPLACE_SELLER',
      nameEn: 'Marketplace Seller',
      nameAr: 'بائع في السوق',
      nameFr: 'Vendeur sur le Marché',
      description: 'List and sell items on the marketplace',
      permissions: [
        'assets:read',
        'marketplace:manage', 'marketplace:read',
      ],
      hierarchy: 2,
    },
    {
      roleCode: 'VIEWER',
      nameEn: 'Viewer',
      nameAr: 'مشاهد',
      nameFr: 'Observateur',
      description: 'Read-only access to public data',
      permissions: [
        'assets:read',
      ],
      hierarchy: 1,
    },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { roleCode: roleData.roleCode },
      update: {},
      create: roleData,
    });
    console.log(`  ✓ Role: ${roleData.roleCode}`);
  }

  // ============================================================================
  // 2. إنشاء المستخدم Admin الافتراضي
  // ============================================================================

  console.log('\nCreating admin user...');

  const adminRole = await prisma.role.findFirst({
    where: { roleCode: 'SUPER_ADMIN' },
  });

  if (!adminRole) {
    throw new Error('SUPER_ADMIN role not found');
  }

  const adminPasswordHash = await bcrypt.hash('GOLD@Admin2024!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gold-platform.com' },
    update: {},
    create: {
      email: 'admin@gold-platform.com',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+213-XXX-XXXX',
      roleId: adminRole.id,
      preferredLanguage: Language.EN,
      preferredCurrency: Currency.USD,
      mfaEnabled: false,
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(),
    },
  });

  console.log(`  ✓ Admin user: ${adminUser.email}`);

  // ============================================================================
  // 3. إنشاء المخزن الافتراضي
  // ============================================================================

  console.log('\nCreating default warehouse...');

  const warehouse = await prisma.warehouse.upsert({
    where: { warehouseCode: 'WH-ALGIERS-001' },
    update: {},
    create: {
      warehouseCode: 'WH-ALGIERS-001',
      name: 'GOLD Primary Secure Vault — Algiers',
      nameAr: 'خزينة GOLD الآمنة الرئيسية — الجزائر',
      nameFr: 'Coffre-fort principal GOLD — Alger',
      location: {
        country: 'DZ',
        city: 'Algiers',
        address: '123 Rue Didouche Mourad, Algiers',
        lat: 36.7538,
        lng: 3.0588,
      },
      facilityType: 'SECURE_VAULT',
      securityLevel: 'HIGH_SECURITY',
    },
  });

  console.log(`  ✓ Warehouse: ${warehouse.warehouseCode}`);

  // ============================================================================
  // 4. إنشاء الخزينة الافتراضية
  // ============================================================================

  console.log('Creating default vault...');

  const vault = await prisma.custodyVault.upsert({
    where: { vaultCode: 'VAULT-001' },
    update: {},
    create: {
      vaultCode: 'VAULT-001',
      name: 'Primary Gold Vault',
      warehouseId: warehouse.id,
      securityGrade: 'HIGH_SECURITY',
      capacityKg: 500,
      currentOccupancyKg: 0,
      temperatureControl: true,
      humidityControl: true,
      fireSupression: true,
      cctvMonitoring: true,
      accessControl: 'BIOMETRIC',
      isActive: true,
    },
  });

  console.log(`  ✓ Vault: ${vault.vaultCode}`);

  // ============================================================================
  // 5. إنشاء مختبر افتراضي (ISO 17025)
  // ============================================================================

  console.log('Creating default assay lab...');

  const labEntity = await prisma.externalEntity.upsert({
    where: { entityCode: 'ALGIERS-ASSAY-001' },
    update: {},
    create: {
      entityCode: 'ALGIERS-ASSAY-001',
      entityType: 'ASSAY_LAB',
      name: 'Algerian National Assay Laboratory',
      nameAr: 'مختبر التحليل الوطني الجزائري',
      nameFr: 'Laboratoire National d\'Essais Algérien',
      country: 'DZ',
      city: 'Algiers',
      address: {
        country: 'DZ',
        city: 'Algiers',
        address: '45 Rue Abane Ramdane, Algiers',
      },
      registrationNumber: 'REG-DZ-LAB-001',
      licenseNumber: 'ISO17025-DZ-001',
      licenseExpiry: new Date('2027-12-31'),
      contactEmail: 'lab@gold-platform.com',
      contactPhone: '+213-XXX-XXXX',
      isActive: true,
      isVerified: true,
      verificationDate: new Date(),
    },
  });

  // إنشاء سجل المختبر
  await prisma.assayLab.upsert({
    where: { entityId: labEntity.id },
    update: {},
    create: {
      entityId: labEntity.id,
      iso17025CertNumber: 'ISO17025-DZ-2024-001',
      iso17025Expiry: new Date('2027-12-31'),
      accreditationScope: ['XRF', 'FIRE_ASSAY', 'ULTRASONIC', 'EDDY_CURRENT', 'OPTICAL'],
      availableMethods: ['XRF', 'FIRE_ASSAY', 'ULTRASONIC', 'EDDY_CURRENT', 'OPTICAL', 'DENSITY'],
      maxDailyCapacity: 100,
    },
  });

  console.log(`  ✓ Assay Lab: ${labEntity.entityCode}`);

  // ============================================================================
  // 6. إنشاء جهة صناعة افتراضية
  // ============================================================================

  console.log('Creating default manufacturer...');

  await prisma.externalEntity.upsert({
    where: { entityCode: 'MFG-REFINERY-001' },
    update: {},
    create: {
      entityCode: 'MFG-REFINERY-001',
      entityType: 'REFINERY',
      name: 'GOLD Certified Refinery',
      nameAr: 'مصنع GOLD المعتمد للتنقية',
      nameFr: 'Raffinerie Certifiée GOLD',
      country: 'DZ',
      city: 'Oran',
      registrationNumber: 'REG-DZ-REF-001',
      contactEmail: 'refinery@gold-platform.com',
      isActive: true,
      isVerified: true,
      verificationDate: new Date(),
    },
  });

  console.log('  ✓ Refinery: MFG-REFINERY-001');

  // ============================================================================
  // 7. إنشاء أصول ذهبية وهمية (Sample Gold Assets)
  // ============================================================================

  console.log('\nCreating sample gold assets...');

  // Fetch refinery entity id once
  const refineryEntity = await prisma.externalEntity.findFirst({ where: { entityCode: 'MFG-REFINERY-001' } });
  const refineryId = refineryEntity?.id || null;

  const sampleAssets = [
    {
      goldId: 'GOLD-2024-001',
      serialNumber: 'SN-GOLD-001-2024',
      productType: 'BAR',
      metalType: 'GOLD',
      karat: 24,
      weightGross: 1000,
      weightNet: 999.9,
      measuredPurity: 99.99,
      status: 'CERTIFIED',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-001-2024',
      ndefLockStatus: 'LOCKED',
      nameTranslations: {
        en: '1 kg Gold Bar',
        ar: 'سبيكة ذهب 1 كجم',
        fr: 'Lingot d\'or 1 kg'
      }
    },
    {
      goldId: 'GOLD-2024-002',
      serialNumber: 'SN-GOLD-002-2024',
      productType: 'BAR',
      metalType: 'GOLD',
      karat: 24,
      weightGross: 500,
      weightNet: 499.95,
      measuredPurity: 99.99,
      status: 'CERTIFIED',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-002-2024',
      ndefLockStatus: 'LOCKED',
      nameTranslations: {
        en: '500g Gold Bar',
        ar: 'سبيكة ذهب 500 جرام',
        fr: 'Lingot d\'or 500g'
      }
    },
    {
      goldId: 'GOLD-2024-003',
      serialNumber: 'SN-GOLD-003-2024',
      productType: 'COIN',
      metalType: 'GOLD',
      karat: 22,
      weightGross: 31.1,
      weightNet: 31.1,
      measuredPurity: 91.67,
      status: 'CERTIFIED',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-003-2024',
      ndefLockStatus: 'LOCKED',
      nameTranslations: {
        en: '1 oz Gold Coin (Krugerrand)',
        ar: 'عملة ذهب 1 أونصة (كروجراند)',
        fr: 'Pièce d\'or 1 once (Krugerrand)'
      }
    },
    {
      goldId: 'GOLD-2024-004',
      serialNumber: 'SN-GOLD-004-2024',
      productType: 'BAR',
      metalType: 'SILVER',
      karat: 0,
      weightGross: 1000,
      weightNet: 999.9,
      measuredPurity: 99.99,
      status: 'ASSAYED',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-004-2024',
      ndefLockStatus: 'UNLOCKED',
      nameTranslations: {
        en: '1 kg Silver Bar',
        ar: 'سبيكة فضة 1 كجم',
        fr: 'Lingot d\'argent 1 kg'
      }
    },
    {
      goldId: 'GOLD-2024-005',
      serialNumber: 'SN-GOLD-005-2024',
      productType: 'BAR',
      metalType: 'PLATINUM',
      karat: 0,
      weightGross: 100,
      weightNet: 99.95,
      measuredPurity: 99.95,
      status: 'ASSAYED',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-005-2024',
      ndefLockStatus: 'UNLOCKED',
      nameTranslations: {
        en: '100g Platinum Bar',
        ar: 'سبيكة بلاتين 100 جرام',
        fr: 'Lingot de platine 100g'
      }
    },
    {
      goldId: 'GOLD-2024-006',
      serialNumber: 'SN-GOLD-006-2024',
      productType: 'BAR',
      metalType: 'GOLD',
      karat: 18,
      weightGross: 100,
      weightNet: 99.9,
      measuredPurity: 75.0,
      status: 'CERTIFIED',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-006-2024',
      ndefLockStatus: 'UNLOCKED',
      nameTranslations: {
        en: '100g 18K Gold Bar',
        ar: 'سبيكة ذهب عيار 18 100 جرام',
        fr: 'Lingot d\'or 18K 100g'
      }
    },
    {
      goldId: 'GOLD-2024-007',
      serialNumber: 'SN-GOLD-007-2024',
      productType: 'COIN',
      metalType: 'GOLD',
      karat: 22,
      weightGross: 15.55,
      weightNet: 15.55,
      measuredPurity: 91.67,
      status: 'CERTIFIED',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-007-2024',
      ndefLockStatus: 'LOCKED',
      nameTranslations: {
        en: '1/2 oz Gold Coin (Eagle)',
        ar: 'نصف أونصة ذهب (إيجل)',
        fr: '1/2 once d\'or (Aigle)'
      }
    },
    {
      goldId: 'GOLD-2024-008',
      serialNumber: 'SN-GOLD-008-2024',
      productType: 'BAR',
      metalType: 'GOLD',
      karat: 24,
      weightGross: 250,
      weightNet: 249.97,
      measuredPurity: 99.99,
      status: 'RAW_MATERIAL',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-008-2024',
      ndefLockStatus: 'UNLOCKED',
      nameTranslations: {
        en: '250g Gold Bar (Raw)',
        ar: 'سبيكة ذهب 250 جرام (خام)',
        fr: 'Lingot d\'or 250g (Brut)'
      }
    },
    {
      goldId: 'GOLD-2024-009',
      serialNumber: 'SN-GOLD-009-2024',
      productType: 'BAR',
      metalType: 'GOLD',
      karat: 22,
      weightGross: 50,
      weightNet: 49.95,
      measuredPurity: 91.67,
      status: 'ASSAYED',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-009-2024',
      ndefLockStatus: 'UNLOCKED',
      nameTranslations: {
        en: '50g 22K Gold Bar',
        ar: 'سبيكة ذهب عيار 22 50 جرام',
        fr: 'Lingot d\'or 22K 50g'
      }
    },
    {
      goldId: 'GOLD-2024-010',
      serialNumber: 'SN-GOLD-010-2024',
      productType: 'JEWELLERY',
      metalType: 'GOLD',
      karat: 18,
      weightGross: 25,
      weightNet: 24.9,
      measuredPurity: 75.0,
      status: 'CERTIFIED',
      originEntityId: refineryId,
      nfcUidHash: 'NFC-010-2024',
      ndefLockStatus: 'LOCKED',
      nameTranslations: {
        en: '18K Gold Necklace',
        ar: 'قلادة ذهب عيار 18',
        fr: 'Collier en or 18K'
      }
    }
  ];

  for (const assetData of sampleAssets) {
    // Check if asset already exists
    const exists = await prisma.goldAsset.findFirst({
      where: { goldId: assetData.goldId }
    });
    if (!exists) {
      await prisma.goldAsset.create({
        data: assetData as any, // cast to any to bypass strict type check for nameTranslations
      });
      console.log(`  ✓ Asset: ${assetData.goldId} - ${(assetData.nameTranslations as any).en}`);
    } else {
      console.log(`  ℹ Asset already exists: ${assetData.goldId}`);
    }
  }

  // ============================================================================
  // 8. إنشاء قوائم السوق (Marketplace Listings)
  // ============================================================================

  console.log('\nCreating marketplace listings...');

  const assetIds = await prisma.goldAsset.findMany({
    where: {
      status: { in: ['CERTIFIED', 'ASSAYED'] }
    },
    select: { id: true, goldId: true, nameTranslations: true, weightGross: true, metalType: true, karat: true }
  });

  // Helper to safely get translation
  const getTranslation = (obj: any, lang: string) => {
    if (obj && typeof obj === 'object' && obj[lang]) return obj[lang];
    return '';
  };

  const listingsData = [
    {
      assetId: assetIds[0]?.id || '',
      listingType: 'FIXED_PRICE',
      visibility: 'PUBLIC',
      basePrice: 85000,
      priceCurrency: 'USD',
      titleTranslations: {
        en: getTranslation(assetIds[0]?.nameTranslations, 'en') || 'Gold Bar',
        ar: getTranslation(assetIds[0]?.nameTranslations, 'ar') || 'سبيكة ذهب',
        fr: getTranslation(assetIds[0]?.nameTranslations, 'fr') || 'Lingot d\'or'
      },
      descriptionTranslations: {
        en: 'Certified 24K gold bar with assay certificate.',
        ar: 'سبيكة ذهب عيار 24 مع شهادة تحليل.',
        fr: 'Lingot d\'or 24K certifié avec certificat d\'essai.'
      },
      condition: 'NEW',
      status: 'ACTIVE'
    },
    {
      assetId: assetIds[1]?.id || '',
      listingType: 'FIXED_PRICE',
      visibility: 'PUBLIC',
      basePrice: 42500,
      priceCurrency: 'USD',
      titleTranslations: {
        en: getTranslation(assetIds[1]?.nameTranslations, 'en') || '500g Gold Bar',
        ar: getTranslation(assetIds[1]?.nameTranslations, 'ar') || 'سبيكة ذهب 500 جرام',
        fr: getTranslation(assetIds[1]?.nameTranslations, 'fr') || 'Lingot d\'or 500g'
      },
      descriptionTranslations: {
        en: '500g 24K gold bar from certified refinery.',
        ar: 'سبيكة ذهب 500 جرام عيار 24 من مصفاة معتمدة.',
        fr: 'Lingot d\'or 500g 24K de raffinerie certifiée.'
      },
      condition: 'NEW',
      status: 'ACTIVE'
    },
    {
      assetId: assetIds[2]?.id || '',
      listingType: 'FIXED_PRICE',
      visibility: 'PUBLIC',
      basePrice: 2800,
      priceCurrency: 'USD',
      titleTranslations: {
        en: getTranslation(assetIds[2]?.nameTranslations, 'en') || '1 oz Gold Coin',
        ar: getTranslation(assetIds[2]?.nameTranslations, 'ar') || 'عملة ذهب 1 أونصة',
        fr: getTranslation(assetIds[2]?.nameTranslations, 'fr') || 'Pièce d\'or 1 once'
      },
      descriptionTranslations: {
        en: '1 oz Krugerrand gold coin, certified.',
        ar: 'عملة ذهب كروجراند 1 أونصة، معتمدة.',
        fr: 'Pièce d\'or Krugerrand 1 once, certifiée.'
      },
      condition: 'NEW',
      status: 'ACTIVE'
    },
    {
      assetId: assetIds[3]?.id || '',
      listingType: 'FIXED_PRICE',
      visibility: 'PUBLIC',
      basePrice: 1200,
      priceCurrency: 'USD',
      titleTranslations: {
        en: getTranslation(assetIds[3]?.nameTranslations, 'en') || '1 kg Silver Bar',
        ar: getTranslation(assetIds[3]?.nameTranslations, 'ar') || 'سبيكة فضة 1 كجم',
        fr: getTranslation(assetIds[3]?.nameTranslations, 'fr') || 'Lingot d\'argent 1 kg'
      },
      descriptionTranslations: {
        en: '1 kg 999.9 fine silver bar.',
        ar: 'سبيكة فضة نقاء 999.9 وزن 1 كجم.',
        fr: 'Lingot d\'argent 999.9 de 1 kg.'
      },
      condition: 'NEW',
      status: 'ACTIVE'
    },
    {
      assetId: assetIds[4]?.id || '',
      listingType: 'FIXED_PRICE',
      visibility: 'PUBLIC',
      basePrice: 4500,
      priceCurrency: 'USD',
      titleTranslations: {
        en: getTranslation(assetIds[4]?.nameTranslations, 'en') || '100g Platinum Bar',
        ar: getTranslation(assetIds[4]?.nameTranslations, 'ar') || 'سبيكة بلاتين 100 جرام',
        fr: getTranslation(assetIds[4]?.nameTranslations, 'fr') || 'Lingot de platine 100g'
      },
      descriptionTranslations: {
        en: '100g 999.5 platinum bar.',
        ar: 'سبيكة بلاتين نقاء 999.5 وزن 100 جرام.',
        fr: 'Lingot de platine 999.5 de 100g.'
      },
      condition: 'NEW',
      status: 'ACTIVE'
    },
    {
      assetId: assetIds[5]?.id || '',
      listingType: 'FIXED_PRICE',
      visibility: 'PUBLIC',
      basePrice: 850,
      priceCurrency: 'USD',
      titleTranslations: {
        en: getTranslation(assetIds[5]?.nameTranslations, 'en') || '100g 18K Gold Bar',
        ar: getTranslation(assetIds[5]?.nameTranslations, 'ar') || 'سبيكة ذهب عيار 18 100 جرام',
        fr: getTranslation(assetIds[5]?.nameTranslations, 'fr') || 'Lingot d\'or 18K 100g'
      },
      descriptionTranslations: {
        en: '100g 18K gold bar, 75% purity.',
        ar: 'سبيكة ذهب عيار 18 وزن 100 جرام، نقاء 75%.',
        fr: 'Lingot d\'or 18K 100g, pureté 75%.'
      },
      condition: 'NEW',
      status: 'ACTIVE'
    }
  ];

  const sellerEntity = await prisma.externalEntity.findFirst({ where: { entityCode: 'MFG-REFINERY-001' } });
  const sellerEntityId = sellerEntity?.id || '';
  const generateListingId = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ML-${ts}-${rand}`;
  };

  for (const listingData of listingsData) {
    if (listingData.assetId && sellerEntityId) {
      const exists = await prisma.marketplaceItem.findFirst({
        where: { assetId: listingData.assetId }
      });
      if (!exists) {
        const basePrice = listingData.basePrice || 0;
        await prisma.marketplaceItem.create({
          data: {
            listingId: generateListingId(),
            assetId: listingData.assetId,
            sellerEntityId: sellerEntityId,
            listingType: (listingData.listingType as ListingType) || ListingType.FIXED_PRICE,
            visibility: (listingData.visibility as Visibility) || Visibility.PUBLIC,
            basePrice: basePrice,
            priceCurrency: (listingData.priceCurrency as Currency) || Currency.USD,
            metalValue: basePrice * 0.85,
            manufacturingValue: basePrice * 0.05,
            gemstoneValue: 0,
            certificationValue: basePrice * 0.02,
            insuranceValue: basePrice * 0.01,
            logisticsValue: basePrice * 0.02,
            marketplaceFee: basePrice * 0.03,
            taxAmount: basePrice * 0.05,
            finalPrice: basePrice * 1.05,
            titleTranslations: listingData.titleTranslations || {},
            descriptionTranslations: listingData.descriptionTranslations || {},
            condition: (listingData.condition as ItemCondition) || ItemCondition.NEW,
            status: 'ACTIVE',
            authenticityGuaranteed: true,
          },
        });
        const asset = assetIds.find(a => a.id === listingData.assetId);
        console.log(`  ✓ Listing created for asset: ${asset?.goldId || listingData.assetId}`);
      } else {
        const asset = assetIds.find(a => a.id === listingData.assetId);
        console.log(`  ℹ Listing already exists for asset: ${asset?.goldId || listingData.assetId}`);
      }
    }
  }

  // ============================================================================
  // ملخص
  // ============================================================================

  console.log('\n========================================');
  console.log('GOLD Platform seed completed successfully!');
  console.log('========================================');
  console.log(`  Roles:          ${roles.length}`);
  console.log('  Admin User:     admin@gold-platform.com');
  console.log('  Password:       GOLD@Admin2024!');
  console.log(`  Warehouse:      ${warehouse.warehouseCode}`);
  console.log(`  Vault:          ${vault.vaultCode}`);
  console.log(`  Assay Lab:      ${labEntity.entityCode}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
