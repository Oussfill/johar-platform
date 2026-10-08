-- Warehouses
INSERT INTO warehouses (id, name, location, capacity_kg, security_level) VALUES
(gen_random_uuid(), 'مستودع دبي الرئيسي', 'دبي، الإمارات', 5000, 'L3'),
(gen_random_uuid(), 'الخزنة الآمنة', 'الرياض، السعودية', 2000, 'L2'),
(gen_random_uuid(), 'مستودع جنيف السويسري', 'جنيف، سويسرا', 10000, 'L3');

-- Shipments
INSERT INTO shipments (id, shipment_code, source, destination, carrier, tracking_number, status, insured_value) VALUES
(gen_random_uuid(), 'SHP-10029', 'دبي', 'الرياض', 'Brinks', 'TRK-9921', 'PENDING', 250000),
(gen_random_uuid(), 'SHP-10030', 'الرياض', 'جدة', 'G4S', 'TRK-9934', 'IN_TRANSIT', 150000),
(gen_random_uuid(), 'SHP-10031', 'جنيف', 'دبي', 'Loomis', 'TRK-9945', 'DELIVERED', 1000000);

-- Custody Records
INSERT INTO custody_records (id, custodian, signature_hash) VALUES
(gen_random_uuid(), 'أحمد مدير الخزنة', '0xabc123...'),
(gen_random_uuid(), 'شركة Brinks للنقل', '0xdef456...');
