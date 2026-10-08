// ============================================================================
// JOHAR — VAA (Verified Active Assets, NORTH STAR §37)
// ============================================================================
// المؤشر الضابط: عدد الأصول النشطة ذات الهوية الرقمية السليمة وجواز غير ملغي.
// ثانوياً: مستخدمون موثقون، مؤسسات موثقة، توزيع الثقة، الدول، معدل التوثيق.

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

/// GET /api/v1/stats/vaa — لوحة NORTH STAR (§37)
export async function getVaaReport(req: Request, res: Response) {
  try {
    const [totalAssets, verifiedActiveAssets, registeredUsers, verifiedUsers, totalOrgs, verifiedOrgs] =
      await Promise.all([
        prisma.goldAsset.count(),
        prisma.goldAsset.count({
          where: {
            status: { notIn: ['DECOMMISSIONED', 'RECYCLED'] as any },
            digitalIdentity: { is: { isActive: true } },
            digitalPassport: { is: { isRevoked: false } },
          },
        }),
        prisma.user.count(),
        prisma.user.count({ where: { verificationLevel: { gte: 2 } } }),
        prisma.organization.count(),
        prisma.organization.count({ where: { kybStatus: 'VERIFIED' } }),
      ]);

    const trustDistribution = await prisma.organization.groupBy({
      by: ['trustLevel'],
      _count: { _all: true },
    });

    const [entityCountries, supplierCountries, orgCountries] = await Promise.all([
      prisma.externalEntity.findMany({ where: { country: { not: '' } }, select: { country: true }, distinct: ['country'] }),
      prisma.supplier.findMany({ where: { country: { not: null } }, select: { country: true }, distinct: ['country'] }),
      prisma.organization.findMany({ where: { registrationCountry: { not: null } }, select: { registrationCountry: true }, distinct: ['registrationCountry'] }),
    ]);
    const countries = new Set<string>();
    entityCountries.forEach((c: any) => c.country && countries.add(String(c.country)));
    supplierCountries.forEach((s: any) => s.country && countries.add(String(s.country)));
    orgCountries.forEach((o: any) => o.registrationCountry && countries.add(String(o.registrationCountry)));

    const pendingHitl = await prisma.aiAnalysisResult.count({ where: { humanReviewStatus: 'PENDING' } });

    return res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        vaa: {
          verifiedActiveAssets,
          totalAssets,
          verificationRate: totalAssets ? Number(((verifiedActiveAssets / totalAssets) * 100).toFixed(2)) : 0,
        },
        users: { verified: verifiedUsers, registered: registeredUsers },
        organizations: {
          verified: verifiedOrgs,
          total: totalOrgs,
          trustDistribution: trustDistribution.map((t) => ({ trustLevel: t.trustLevel, count: t._count._all })),
        },
        countries: countries.size,
        hitlQueue: { pendingAiResults: pendingHitl },
      },
    });
  } catch (error: any) {
    logger.error('getVaaReport failed', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}