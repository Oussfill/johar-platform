import re

with open('src/components/CustomerDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add table field to mapped orders
market_map = "m => ({ table: 'marketplace_offers', dbId: m.id, id: m.offer_code || m.id, type: m.type === 'SELL' ? 'عرض بيع' : 'عرض شراء', detail: السعر: $, status: m.status, date: m.created_at, tone: 'warning' })"
lab_map = "l => ({ table: 'lab_tests', dbId: l.id, id: l.asset_code || l.id, type: 'طلب فحص', detail: نوع الفحص: , status: l.status, date: l.created_at, tone: 'info' })"
ship_map = "s => ({ table: 'shipments', dbId: s.id, id: s.shipment_code || s.id, type: 'نقل آمن', detail: إلى: , status: s.status, date: s.created_at, tone: 'success' })"

content = re.sub(r"m => \(\{[^\}]*m\.type === 'SELL'.*?\}\)", market_map, content)
content = re.sub(r"l => \(\{[^\}]*l\.test_type.*?\}\)", lab_map, content)
content = re.sub(r"s => \(\{[^\}]*s\.destination.*?\}\)", ship_map, content)

# Add cancelOrder and deleteAsset functions
insert_funcs = """
  const cancelOrder = async (table: string, id: string) => {
    if (!window.confirm("هل أنت متأكد من إلغاء هذه العملية؟")) return;
    const { error } = await supabase!.from(table).delete().eq('id', id);
    if (error) alert("خطأ في الإلغاء: " + error.message);
    else fetchData();
  };

  const deleteAsset = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الأصل من المحفظة؟")) return;
    const { error } = await supabase!.from('assets').delete().eq('id', id);
    if (error) alert("خطأ في الحذف: " + error.message);
    else fetchData();
  };
"""
if "cancelOrder = async" not in content:
    content = content.replace("const handleCreateAsset", insert_funcs + "\n  const handleCreateAsset")

# Update Lab Modal open logic
content = content.replace("onClick={() => setIsLabModalOpen(true)}", "onClick={() => { setLabForm({...labForm, test_type: 'AUTHENTICITY'}); setIsLabModalOpen(true); }}", 1)
content = content.replace("onClick={() => setIsLabModalOpen(true)}", "onClick={() => { setLabForm({...labForm, test_type: 'PURITY'}); setIsLabModalOpen(true); }}", 1)

# Add Actions column to Holdings table
if "إجراءات" not in content:
    content = content.replace('<th className="text-start pb-2 font-medium">الحالة</th>', '<th className="text-start pb-2 font-medium">الحالة</th>\n                  <th className="text-start pb-2 font-medium">إجراءات</th>')
    content = content.replace('<td colSpan={5}', '<td colSpan={6}')

    row_actions = """<td className="py-3 px-3">
                        <button onClick={() => deleteAsset(h.id)} className="text-red-400 hover:text-red-300 transition-colors text-xs border border-red-500/30 px-2 py-1 rounded bg-red-500/10">سحب/حذف</button>
                      </td>"""
    content = content.replace('>{h.status}</span></td>\n                  </tr>', '>{h.status}</span></td>\n                    ' + row_actions + '\n                  </tr>')

# Add Cancel button to Orders list
order_cancel = """
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs font-mono text-johar-gray-mid" dir="ltr">{o.id}</p>
                    <button onClick={() => cancelOrder(o.table, o.dbId)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors">إلغاء العملية</button>
                  </div>
"""
if "إلغاء العملية" not in content:
    content = re.sub(r'<p className="text-xs font-mono text-johar-gray-mid mt-1".*?</p>', order_cancel, content)

with open('src/components/CustomerDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
