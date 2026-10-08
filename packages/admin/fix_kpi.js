const fs = require('fs');
let code = fs.readFileSync('src/components/KPIPage.tsx', 'utf8');

// The file was mangled, I will just rewrite the `useEffect` block securely.
const newEffect = `
  useEffect(() => {
    supabase.from('kpi_metrics').select('*').then(({ data }) => {
      setStats(data || []);
    });
    supabase.from('alerts').select('*').then(({ data }) => {
      setAlerts(data || []);
    });
  }, []);
`;

// Replace everything inside the useEffect 
code = code.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/m, newEffect);
fs.writeFileSync('src/components/KPIPage.tsx', code);
