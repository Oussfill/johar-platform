CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  action TEXT,
  resource TEXT,
  status TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  ip_address TEXT,
  browser TEXT,
  location TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  subject TEXT,
  department TEXT,
  priority TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL ON TABLE audit_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE security_sessions TO anon, authenticated, service_role;
GRANT ALL ON TABLE support_tickets TO anon, authenticated, service_role;
