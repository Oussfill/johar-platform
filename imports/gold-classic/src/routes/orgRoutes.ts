// ============================================================================
// JOHAR — ORGANIZATION ROUTES (الشريحة 2 من المصفوفة)
// ============================================================================
// كل عملية إدارية تمر عبر authz() وتحمل سجل تدقيق. الحماية السياقية (ABAC)
// عبر فحص العضوية النشطة في المضابط.

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authz } from '../middleware/authorize';
import {
  createOrg,
  listMyOrgs,
  updateOrg,
  listMembers,
  assignRole,
  switchOrg,
  startKyb,
  approveKyb,
} from '../controllers/OrgController';

const router = Router();

// إنشاء حساب أعمال — يتطلب تحقق المستوى 2 (organization:create)
router.post('/', authenticateToken, authz('organization:create', { scope: 'own' }), createOrg);

// قائمة عضوية المستخدم (داخلية غير حسّاسة)
router.get('/', authenticateToken, listMyOrgs);

// تحديث بيانات المؤسسة — owner/admin فقط (organization:update)
router.patch('/:orgId', authenticateToken, authz('organization:update', { scope: 'org' }), updateOrg);

// أعضاء الفريق (organization:read)
router.get('/:orgId/members', authenticateToken, authz('organization:read', { scope: 'org' }), listMembers);

// تعيين دور لعضو — owner/admin (team:assignrole)
router.post('/:orgId/team', authenticateToken, authz('team:assignrole', { scope: 'org' }), assignRole);

// تبديل سياق العمل إلى المؤسسة
router.post('/:orgId/switch', authenticateToken, switchOrg);

// إرسال KYB — owner فقط
router.post('/:orgId/kyb', authenticateToken, authz('organization:update', { scope: 'org' }), startKyb);

// اعتماد KYB — أهلية منصة فقط (kyb:approve) — خطوة ترفع المؤسس إلى Tier 3
router.post('/:orgId/kyb/approve', authenticateToken, authz('kyb:approve', { scope: 'platform' }), approveKyb);

export default router;