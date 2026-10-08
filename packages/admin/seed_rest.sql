ALTER TABLE marketplace_offers ADD COLUMN IF NOT EXISTS price NUMERIC;

-- Finance
INSERT INTO invoices (id, invoice_number, client, service, amount, currency, status) VALUES
(gen_random_uuid(), 'INV-1001', 'شركة الذهب المتقدمة', 'تحليل مختبري', 1500, 'USD', 'PENDING'),
(gen_random_uuid(), 'INV-1002', 'مؤسسة الرياض للسبائك', 'رسوم تخزين', 450, 'USD', 'PAID'),
(gen_random_uuid(), 'INV-1003', 'عبدالله محمد', 'نقل وشحن', 1200, 'SAR', 'OVERDUE');

INSERT INTO payments (id, invoice_ref, client, amount, status, payment_method) VALUES
(gen_random_uuid(), 'INV-1002', 'مؤسسة الرياض للسبائك', 450, 'COMPLETED', 'SWIFT'),
(gen_random_uuid(), 'INV-1001', 'شركة الذهب المتقدمة', 1500, 'PROCESSING', 'Credit Card');

-- Lab
INSERT INTO lab_tests (id, asset_code, client, type, status, passed) VALUES
(gen_random_uuid(), 'AST-8821', 'شركة الذهب المتقدمة', 'Fire Assay', 'COMPLETED', true),
(gen_random_uuid(), 'AST-8822', 'مؤسسة الرياض للسبائك', 'X-Ray Fluorescence', 'IN_PROGRESS', false),
(gen_random_uuid(), 'AST-8823', 'خالد عبدالله', 'Ultrasonic', 'PENDING', false);

INSERT INTO equipment (id, name, type, status, last_maintenance) VALUES
(gen_random_uuid(), 'XRF Spectrometer X-100', 'XRF', 'ACTIVE', '2023-09-01'),
(gen_random_uuid(), 'Fire Assay Furnace', 'Furnace', 'NEEDS_MAINTENANCE', '2023-01-15');

-- Marketplace
INSERT INTO marketplace_offers (id, offer_code, asset_name, seller, price, currency, status) VALUES
(gen_random_uuid(), 'OFF-501', 'سبيكة ذهب 1 كجم PAMP', 'شركة الذهب المتقدمة', 62000, 'USD', 'ACTIVE'),
(gen_random_uuid(), 'OFF-502', 'سبيكة 100 جرام', 'مؤسسة الرياض للسبائك', 6250, 'USD', 'NEGOTIATION');

INSERT INTO negotiations (id, seller, buyer, proposed_price, status, current_round) VALUES
(gen_random_uuid(), 'شركة الذهب المتقدمة', 'خالد عبدالله', 61500, 'ACTIVE', 2);

INSERT INTO auctions (id, item_name, start_price, highest_bid, status) VALUES
(gen_random_uuid(), 'سبيكة نادرة 500 جرام', 30000, 31500, 'ACTIVE');

-- Compliance
INSERT INTO aml_checks (id, entity, entity_type, risk_score, status) VALUES
(gen_random_uuid(), 'شركة التعدين العالمية', 'COMPANY', 15, 'CLEAN'),
(gen_random_uuid(), 'حساب مجهول 992', 'INDIVIDUAL', 85, 'INVESTIGATING');

INSERT INTO sanctions_list (id, entity_name, country) VALUES
(gen_random_uuid(), 'شركة محظورة تيك', 'دولة وهمية');

-- Legal
INSERT INTO contracts (id, contract_type, party_a_name, party_b_name, status) VALUES
(gen_random_uuid(), 'SALE_AGREEMENT', 'شركة الذهب المتقدمة', 'جوهر ماركت', 'ACTIVE'),
(gen_random_uuid(), 'CUSTODY_AGREEMENT', 'مؤسسة الرياض للسبائك', 'خزائن برينكس', 'PENDING_SIGNATURE');

INSERT INTO notary_records (id, document_type, parties) VALUES
(gen_random_uuid(), 'شهادة منشأ', 'شركة التعدين العالمية'),
(gen_random_uuid(), 'نقل ملكية', 'خالد عبدالله -> مؤسسة الرياض');

