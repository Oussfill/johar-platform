const fs = require("fs");

function fixAudit() {
  let content = fs.readFileSync("src/components/AuditPage.tsx", "utf-8");
  content = content.replace(/const mockLogs = Array\.from.*?\}\)\);/s, `
  const [mockLogs, setMockLogs] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).then(({data}) => {
      if (data) setMockLogs(data);
    });
  }, []);
  `);
  if(!content.includes("import { supabase }")) {
    content = "import { supabase } from '../supabase';\n" + content;
  }
  if(!content.includes("useEffect")) {
    content = content.replace("import { useState }", "import { useState, useEffect }");
  }
  fs.writeFileSync("src/components/AuditPage.tsx", content);
}

function fixSecurity() {
  let content = fs.readFileSync("src/components/SecurityPage.tsx", "utf-8");
  content = content.replace(/const mockSessions = Array\.from.*?\}\)\);/s, `
  const [mockSessions, setMockSessions] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('security_sessions').select('*').order('login_time', { ascending: false }).then(({data}) => {
      if (data) setMockSessions(data);
    });
  }, []);
  `);
  if(!content.includes("import { supabase }")) {
    content = "import { supabase } from '../supabase';\n" + content;
  }
  if(!content.includes("useEffect")) {
    content = content.replace("import { useState }", "import { useState, useEffect }");
  }
  fs.writeFileSync("src/components/SecurityPage.tsx", content);
}

function fixSupport() {
  let content = fs.readFileSync("src/components/SupportPage.tsx", "utf-8");
  content = content.replace(/const mockKB = Array\.from.*?\}\)\);/s, "const mockKB: any[] = []; // Replaced by real support docs later");
  fs.writeFileSync("src/components/SupportPage.tsx", content);
}

fixAudit();
fixSecurity();
fixSupport();
