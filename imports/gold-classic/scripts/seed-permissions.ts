// ============================================================================
// JOHAR — SEED PERMISSION REGISTRY (الخطوة 1 من تنفيذ المصفوفة)
// ============================================================================
//  1) إدراج سجل الصلاحيات المقننة (Permission) من PermissionRegistry
//  2) ربط الأدوار الحالية بالموجودة في السجل عبر RolePermission (مع بقاء Json القديم)
//  3) تهيئة User: accountType/verificationLevel للإعدادات الافتراضية (لا تُمس النشطة)
//
// التشغيل:
//   $env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"Node"}'
//   npx ts-node scripts/seed-permissions.ts

import { PrismaClient } from '@prisma/client';
import {
  PERMISSION_REGISTRY,
  LEGACY_CODE_MAP,
  PLATFORM_MODULES,
} from '../src/services/authorization/PermissionRegistry';

const prisma = new PrismaClient();

/// أمنية أدوار موظفي المنصة الداخلية (محكومة بفصل المهام — لا ترقية عسكري)
const INTERNAL_ROLE_PREFIXES = ['ASSET', 'CUSTODY', 'ERP', 'AI', 'AUDIT', 'ASSAY', 'LAB'];

async function main() {
  console.log(`Registry size: ${PERMISSION_REGISTRY.length} permissions`);

  // 1) upsert السجل
  let created = 0;
  for (const p of PERMISSION_REGISTRY) {
    const existing = await prisma.permission.findUnique({ where: { code: p.code } });
    if (!existing) {
      await prisma.permission.create({
        data: {
          code: p.code,
          module: p.module,
          action: p.action,
          minTier: p.minTier,
          risk: p.risk,
          isSensitive: Boolean(p.sensitive),
        },
      });
      created++;
    }
  }
  console.log(`Permission rows: ${created} created, ${PERMISSION_REGISTRY.length - created} already present`);

  // 2) ربط أدوار المنصة الحالية بالأكواد المسجلة
  const roles = await prisma.role.findMany({
    select: { id: true, roleCode: true, permissions: true },
  });

  let linked = 0;
  for (const role of roles) {
    const legacy = ((role.permissions as string[]) || []).filter(
      (c) => typeof c === 'string' && (c === '*' || c.includes(':')),
    );
    const codes = new Set<string>(legacy);

    for (const code of codes) {
      if (code === '*') continue; // البرية تبقى معالجة في middleware (SUPER_ADMIN)
      // الأكواد المسجلة مباشرة
      const permission = await prisma.permission.findUnique({ where: { code } });
      if (permission) {
        const exists = await prisma.rolePermission.findFirst({
          where: { roleId: role.id, permissionId: permission.id },
        });
        if (!exists) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: permission.id },
          });
          linked++;
        }
      }
      // الأكواد القديمة → نظيرها المقنن عبر خريطة التوافق
      const mapped = LEGACY_CODE_MAP[code] || [];
      for (const mappedCode of mapped) {
        if (mappedCode === code) continue; // رُبط أعلاه
        const mappedPermission = await prisma.permission.findUnique({
          where: { code: mappedCode },
        });
        if (!mappedPermission) continue;
        const exists = await prisma.rolePermission.findFirst({
          where: { roleId: role.id, permissionId: mappedPermission.id },
        });
        if (!exists) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: mappedPermission.id },
          });
          linked++;
        }
      }
    }
  }
  console.log(`RolePermission links added: ${linked}`);

  // 2b) تسيير ذاتي أساسي لدور التسجيل الافتراضي (VIEWER):
  //     يمنح الأعمال الرقمية القاعدية بمستوى تحقق 2+ دون الحاجة لدور منصة خاص —
  //     إنشاء حساب أعمال، معرّف هوية، ملف شخصي (المصفوفة القسم 5 "self-service").
  const BASE_SELF_SERVICE = [
    'profile:view', 'profile:update',
    'identity:submit', 'identity:badge',
    'organization:create',
    'product:read', 'listing:read', 'order:read',
  ];
  const viewerRole = await prisma.role.findFirst({
    where: { roleCode: 'VIEWER', isActive: true },
  });
  if (viewerRole) {
    let selfLinked = 0;
    for (const code of BASE_SELF_SERVICE) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      if (!permission) continue;
      const exists = await prisma.rolePermission.findFirst({
        where: { roleId: viewerRole.id, permissionId: permission.id },
      });
      if (!exists) {
        await prisma.rolePermission.create({
          data: { roleId: viewerRole.id, permissionId: permission.id },
        });
        selfLinked++;
      }
    }
    console.log(`VIEWER base self-service links added: ${selfLinked}`);
  } else {
    console.log('VIEWER role not found — skipping base self-service grants');
  }

  // 3) تهيئة قيم افتراضية على المستخدمين بلا قيم صريحة
  const users = await prisma.user.updateMany({
    where: { verificationLevel: { not: { in: [0, 1, 2, 3] } } },
    data: { verificationLevel: 1 },
  });
  console.log(`Users normalized verificationLevel: ${users.count}`);

  // 3b) موظفو المنصة الداخلية — دورهم الموثق بالأصل يرتقي بهم تلقائياً إلى Tier 3
  //      (لا ببوا ب الترقية العسكهرية للعميل؛ بوابة المخاطرة تبقى على عملياتهم).
  const internalRoleIds = roles
    .filter((role) => {
      if (role.roleCode === 'SUPER_ADMIN') return true;
      if (INTERNAL_ROLE_PREFIXES.some((p) => role.roleCode.startsWith(p))) return true;
      const legacy = (role.permissions as string[]) || [];
      return legacy.some((c) => typeof c === 'string' && PLATFORM_MODULES.has(c.split(':')[0]));
    })
    .map((role) => role.id);

  if (internalRoleIds.length > 0) {
    const bumped = await prisma.user.updateMany({
      where: { roleId: { in: internalRoleIds }, verificationLevel: { lt: 3 } },
      data: { verificationLevel: 3 },
    });
    console.log(`Internal staff users bumped to verificationLevel=3: ${bumped.count}`);
  } else {
    console.log('No internal platform roles found — skipping staff bump');
  }

  console.log('Seed permissions done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });