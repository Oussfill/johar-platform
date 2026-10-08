import os
import re

files_info = {
    'JoharIDPage.tsx': ('assets', 'joharIds', 'setJoharIds'),
    'PassportsPage.tsx': ('johar_passports', 'passports', 'setPassports'),
    'InventoryPage.tsx': ('inventory', 'inventory', 'setInventory'),
    'AssayPage.tsx': ('assay_results', 'assays', 'setAssays'),
    'EquipmentPage.tsx': ('equipment', 'equipment', 'setEquipment'),
    'CustodyPage.tsx': ('custody_records', 'custodyRecords', 'setCustodyRecords'),
    'WarehousesPage.tsx': ('warehouses', 'warehouses', 'setWarehouses'),
    'FinancePage.tsx': ('finance_transactions', 'invoices', 'setInvoices'),
    'InvoicesPage.tsx': ('invoices', 'mockInvoices', 'setMockInvoices')
}

base_dir = r'C:\trd\johar\packages\admin\src\components'

for fname, (table, state_var, set_state_var) in files_info.items():
    filepath = os.path.join(base_dir, fname)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'import { supabase }' not in content:
        content = re.sub(r'(import .*?;?\n)(?!import )', r'\1import { supabase } from \'../supabase\';\n', content, count=1)
    
    if fname == 'InvoicesPage.tsx':
        replacement = f'const [{state_var}, {set_state_var}] = useState<any[]>([]);\n  useEffect(() => {{\n    supabase.from(\'{table}\').select(\'*\').then(({{ data }}) => {{\n      if (data) {set_state_var}(data);\n    }});\n  }}, []);'
        content = re.sub(r'const mockInvoices = Array\.from.*?\}\)\);', replacement, content, flags=re.DOTALL)
    elif fname == 'FinancePage.tsx':
        replacement = f'const [{state_var}, {set_state_var}] = useState<any[]>([]);\n  useEffect(() => {{\n    supabase.from(\'{table}\').select(\'*\').then(({{ data }}) => {{\n      if (data) {set_state_var}(data);\n    }});\n  }}, []);'
        content = re.sub(r'const \[invoices, setInvoices\] = useState\(\[.*?\]\);', replacement, content, flags=re.DOTALL)
    else:
        replacement = f'const [{state_var}, {set_state_var}] = useState<any[]>([]);\n  useEffect(() => {{\n    supabase.from(\'{table}\').select(\'*\').then(({{ data }}) => {{\n      if (data) {set_state_var}(data);\n    }});\n  }}, []);'
        content = re.sub(r'const ' + state_var + r' = \[\s*(?:\{.*?\},\s*)*\{.*?\}\s*\];', replacement, content, flags=re.DOTALL)
    
    if fname == 'FinancePage.tsx':
        new_handle = f'''const handleSaveInv = async () => {{
    const inv = {{
      id: `INV-2026-${{Math.floor(Math.random() * 1000)}}`,
      client: newInv.client,
      service: newInv.service,
      amount: newInv.amount,
      currency: newInv.currency,
      dueDate: newInv.dueDate,
      status: t('pending_payment', 'بانتظار الدفع')
    }};
    await supabase.from('{table}').insert([inv]);
    const {{ data }} = await supabase.from('{table}').select('*');
    if (data) {set_state_var}(data);
    setNewInvOpen(false);
    setNewInv({{ client: '', service: '', amount: '', currency: 'USD', dueDate: '', notes: '' }});
  }};'''
        content = re.sub(r'const handleSaveInv = \(\) => \{.*?\n  \};', new_handle, content, flags=re.DOTALL)
        
    elif fname == 'InvoicesPage.tsx':
        new_modal = f'''const [newInvoiceData, setNewInvoiceData] = useState({{ client: '', amount: '' }});
  const handleSaveInvoice = async () => {{
    await supabase.from('{table}').insert([{{
      client: newInvoiceData.client,
      amount: newInvoiceData.amount,
      service: t('gold_purchase', 'شراء ذهب'),
      currency: 'USD',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: t('unpaid', 'غير مدفوعة')
    }}]);
    const {{ data }} = await supabase.from('{table}').select('*');
    if (data) {set_state_var}(data);
    setIsNewModalOpen(false);
  }};'''
        content = content.replace('const [page, setPage] = useState(1);', f'const [page, setPage] = useState(1);\n  {new_modal}')
        content = content.replace('input className="input w-full" placeholder={t(\'client_name\', \'اسم العميل\')}', 'input className="input w-full" placeholder={t(\'client_name\', \'اسم العميل\')} value={newInvoiceData.client} onChange={e => setNewInvoiceData({...newInvoiceData, client: e.target.value})}')
        content = content.replace('input className="input w-full" placeholder={t(\'amount\', \'المبلغ\')} type="number"', 'input className="input w-full" placeholder={t(\'amount\', \'المبلغ\')} type="number" value={newInvoiceData.amount} onChange={e => setNewInvoiceData({...newInvoiceData, amount: e.target.value})}')
        content = content.replace('onClick={() => setIsNewModalOpen(false)}>{t(\'save_invoice\'', 'onClick={handleSaveInvoice}>{t(\'save_invoice\'')

    if 'useEffect' not in content and 'useState' in content:
        content = content.replace('import { useState }', 'import { useState, useEffect }')
    elif 'useEffect' not in content:
        content = content.replace('import { useTranslation', 'import { useEffect } from \'react\';\nimport { useTranslation')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
