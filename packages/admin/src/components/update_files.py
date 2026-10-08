import os, re

file_table_map = {
    'AuctionsPage.tsx': ('auctions', 'fetchAuctions', 'auc', 'view_auction'),
    'CompliancePage.tsx': ('compliance_cases', 'fetchChecks', 'check', 'take_action'),
    'AmlPage.tsx': ('aml_checks', 'fetchAmlChecks', 'row', 'details'),
    'SanctionsPage.tsx': ('sanctions_list', 'fetchSanctions', 'row', 'sanctions_details'),
    'SecurityPage.tsx': ('security_logs', 'fetchLogs', 'ev', 'security_details'),
    'ContractsPage.tsx': ('contracts', 'fetchContracts', 'cnt', 'contracts_view'),
    'NotaryPage.tsx': ('notary_records', 'fetchData', 'doc', 'notary_review_btn'),
    'LegalPage.tsx': ('legal_cases', 'fetchData', 'leg', 'legal_view_btn'),
    'AiPricingPage.tsx': ('ai_pricing', 'fetchData', 'p', '')
}

base_dir = r'C:\trd\johar\packages\admin\src\components'

for fname, (table_name, fetch_func, row_var, view_key) in file_table_map.items():
    fpath = os.path.join(base_dir, fname)
    if not os.path.exists(fpath): continue
    
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    insert_str = f"""
  const handleDelete = async (id: any) => {{
    const {{ error }} = await supabase.from('{table_name}').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else {fetch_func}();
  }};

  const handleUpdateStatus = async (id: any, newStatus: string) => {{
    const {{ error }} = await supabase.from('{table_name}').update({{ status: newStatus }}).eq('id', id);
    if (error) alert("Error: " + error.message);
    else {fetch_func}();
  }};
"""
    
    if 'handleDelete = async' not in content:
        if 'const handleCreate = async () => {' in content:
            content = content.replace('const handleCreate = async () => {', insert_str + '\n  const handleCreate = async () => {')
        else:
            find_str = f'const {fetch_func} = async () => {{'
            content = content.replace(find_str, insert_str + '\n  ' + find_str)

    # Now we need to add the buttons if they don't exist
    btn_str = f"""
    <button className="btn-danger ml-2" onClick={{() => handleDelete({row_var}.id)}}>{{t('delete', 'حذف')}}</button>
    <button className="btn-primary ml-2" onClick={{() => {{
      const s = prompt(t('enter_status', 'أدخل الحالة الجديدة'));
      if(s) handleUpdateStatus({row_var}.id, s);
    }}}}>{{t('update_status', 'تحديث الحالة')}}</button>
    """
    
    # We will find the view button and insert our buttons after it
    # We can do this with regex
    if view_key and view_key in content:
        # Find the button tag containing view_key
        pattern = r'(<button[^>]*>{t\(\'' + view_key + r'\'.*?}</button>)'
        content = re.sub(pattern, r'\1' + btn_str, content)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Injected functions.')
