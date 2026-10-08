-- Insert Dummy Data for KYC
INSERT INTO kyc_requests (id, name, type, level, status, country, submitted, risk, docs) VALUES
(gen_random_uuid(), 'مؤسسة الذهب الملكية', 'شركة', 'L2', 'مكتمل', 'الإمارات', '2026-09-12', 'منخفض', 4),
(gen_random_uuid(), 'محمد أحمد صالح', 'فرد', 'L1', 'قيد المراجعة', 'السعودية', '2026-09-14', 'منخفض', 2),
(gen_random_uuid(), 'Gold Vault Ltd', 'شركة', 'L3', 'مكتمل', 'المملكة المتحدة', '2026-09-10', 'منخفض', 6),
(gen_random_uuid(), 'سارة الحربي', 'فرد', 'L2', 'بحاجة لمستندات', 'السعودية', '2026-09-13', 'متوسط', 1),
(gen_random_uuid(), 'معرض الألماس', 'شركة', 'L2', 'قيد المراجعة', 'الإمارات', '2026-09-11', 'منخفض', 3),
(gen_random_uuid(), 'NYC Gold Trading', 'شركة', 'L3', 'مرفوض', 'الولايات المتحدة', '2026-09-08', 'عالي', 2);

-- Insert Dummy Data for KYB
INSERT INTO kyb_requests (id, company, type, level, country, status, submitted) VALUES
(gen_random_uuid(), 'مؤسسة الذهب الملكية', 'تجارة تجزئة', 'L2', 'الإمارات', 'مكتمل', '2026-09-12'),
(gen_random_uuid(), 'Gold Vault Ltd', 'تخزين آمن', 'L3', 'المملكة المتحدة', 'قيد المراجعة', '2026-09-10'),
(gen_random_uuid(), 'معرض الألماس', 'تجارة تجزئة', 'L2', 'الإمارات', 'مكتمل', '2026-09-11'),
(gen_random_uuid(), 'NYC Gold Trading', 'تداول دولي', 'L3', 'الولايات المتحدة', 'مرفوض', '2026-09-08');

-- Insert Dummy Data for UBO
INSERT INTO ubo_details (id, name, nationality, ownership, company, status) VALUES
(gen_random_uuid(), 'أحمد عبد الله', 'إماراتي', '60%', 'مؤسسة الذهب الملكية', 'مُحقق'),
(gen_random_uuid(), 'John Smith', 'بريطاني', '100%', 'Gold Vault Ltd', 'قيد التحقق'),
(gen_random_uuid(), 'خالد محمد', 'سعودي', '40%', 'مؤسسة الذهب الملكية', 'مُحقق'),
(gen_random_uuid(), 'Michael Chen', 'أمريكي', '80%', 'NYC Gold Trading', 'محتمل مشبوه');
