INSERT INTO kyc_requests (id, name, status) VALUES ('11111111-1111-1111-1111-111111111111', 'Test', 'under_review');
UPDATE kyc_requests SET status = 'completed' WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT id, name, status FROM kyc_requests WHERE id = '11111111-1111-1111-1111-111111111111';
