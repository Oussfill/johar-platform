-- ============================================================
-- JOHAR DATABASE MOCK DATA SEEDING
-- ============================================================

-- Insert KPIs
INSERT INTO kpi_metrics (metric_name, metric_value, trend) VALUES 
('إجمالي الأصول', 154000, '+5%'),
('حجم التداول اليومي', 2500000, '+12%'),
('المستخدمين النشطين', 1250, '+3%');

-- Insert Alerts
INSERT INTO alerts (title, description, severity) VALUES 
('محاولة تسجيل دخول مشبوهة', 'تم رصد محاولة دخول من IP غير معروف.', 'HIGH'),
('تحديث النظام', 'سيتم تحديث النظام غداً الساعة 2 صباحاً.', 'INFO');

-- Insert Warehouses
INSERT INTO warehouses (name, location, capacity_kg, security_level) VALUES 
('خزينة دبي المركزية', 'الإمارات - دبي', 5000, 'LEVEL_5'),
('مستودع الرياض', 'السعودية - الرياض', 3000, 'LEVEL_4');

-- Insert Companies
INSERT INTO companies (name, registration_number, industry) VALUES 
('مجموعة الذهب العربية', 'CR-99281', 'تعدين وتجارة الذهب'),
('مجوهرات الألماس الملكية', 'CR-11293', 'صياغة المجوهرات');

-- Insert Auctions
INSERT INTO auctions (start_price, highest_bid, status) VALUES 
(50000, 52000, 'LIVE'),
(120000, 135000, 'LIVE');

-- Insert Contracts
INSERT INTO contracts (contract_type, status) VALUES 
('AGREEMENT_STORAGE', 'SIGNED'),
('AGREEMENT_TRADE', 'PENDING_SIGNATURE');

-- Insert AI Pricing
INSERT INTO ai_pricing (asset_type, predicted_price, confidence) VALUES 
('GOLD_24K', 75.50, 0.98),
('SILVER_999', 0.92, 0.95);

-- Insert Support Tickets
INSERT INTO support_tickets (subject, message, status) VALUES 
('مشكلة في توثيق الحساب', 'الرجاء مساعدتي في رفع المرفقات بشكل صحيح.', 'OPEN'),
('تأخر وصول الشحنة', 'الشحنة رقم 1928 متأخرة عن موعدها.', 'IN_PROGRESS');

-- NOTE: This script populates the newly created tables with realistic test data.
