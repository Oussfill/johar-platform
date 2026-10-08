CREATE TABLE IF NOT EXISTS labs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT,
    location TEXT,
    acc TEXT,
    expiry TEXT,
    requests INTEGER,
    rating NUMERIC
);

INSERT INTO labs (name, status, location, acc, expiry, requests, rating) VALUES
('مختبر دبي المركزي للذهب', 'معتمد', 'دبي، الإمارات', 'ACC-AE-1001', '2027-12-31', 45, 4.8),
('مختبر سويسرا للمعادن', 'معتمد', 'جنيف، سويسرا', 'ACC-CH-9922', '2028-05-15', 12, 5.0),
('مختبر الرياض الوطني', 'قيد التجديد', 'الرياض، السعودية', 'ACC-SA-0044', '2025-01-10', 8, 4.2),
('مختبر الأناضول للفحص', 'موقوف', 'إسطنبول، تركيا', 'ACC-TR-7711', '2023-11-20', 0, 3.1);
