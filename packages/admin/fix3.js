const fs = require("fs");
let content = fs.readFileSync("src/components/CustomerDashboard.tsx", "utf-8");

const badCombinedStart = "const combined = [";
const badCombinedEnd = "setOrders(combined);";

const startIdx = content.indexOf(badCombinedStart);
const endIdx = content.indexOf(badCombinedEnd) + badCombinedEnd.length;

const goodCombined = `
    const combined = [
      ...(marketData || []).map(m => ({ table: 'marketplace_offers', dbId: m.id, id: m.offer_code || m.id, type: m.type === 'SELL' ? 'عرض بيع' : 'عرض شراء', detail: \`السعر: $\${m.asking_price}\`, status: m.status, date: m.created_at, tone: 'warning' })),
      ...(labData || []).map(l => ({ table: 'lab_tests', dbId: l.id, id: l.asset_code || l.id, type: 'طلب فحص', detail: \`نوع الفحص: \${l.test_type}\`, status: l.status, date: l.created_at, tone: 'info' })),
      ...(shipData || []).map(s => ({ table: 'shipments', dbId: s.id, id: s.shipment_code || s.id, type: 'نقل آمن', detail: \`إلى: \${s.destination}\`, status: s.status, date: s.created_at, tone: 'success' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5); // top 5

    setOrders(combined);
`;

content = content.substring(0, startIdx) + goodCombined + content.substring(endIdx);

fs.writeFileSync("src/components/CustomerDashboard.tsx", content, "utf-8");
