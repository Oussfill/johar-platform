const fs = require('fs');
const path = require('path');

const map = {
    'AuctionsPage.tsx': ['auctions', 'fetchAuctions', 'auc', "t('view_auction'"],
    'CompliancePage.tsx': ['compliance_cases', 'fetchChecks', 'check', "t('take_action'"],
    'AmlPage.tsx': ['aml_checks', 'fetchAmlChecks', 'row', "t('details'"],
    'SanctionsPage.tsx': ['sanctions_list', 'fetchSanctions', 'row', "t('sanctions_details'"],
    'SecurityPage.tsx': ['security_logs', 'fetchLogs', 'ev', "t('security_details'"],
    'ContractsPage.tsx': ['contracts', 'fetchContracts', 'cnt', "t('contracts_view'"],
    'NotaryPage.tsx': ['notary_records', 'fetchData', 'doc', "t('notary_review_btn'"],
    'LegalPage.tsx': ['legal_cases', 'fetchData', 'leg', "t('legal_view_btn'"],
    'AiPricingPage.tsx': ['ai_pricing', 'fetchData', 'p', '']
};

const dir = 'C:\\trd\\johar\\packages\\admin\\src\\components';

for (const [fname, [table, fetchFunc, rowVar, viewKey]] of Object.entries(map)) {
    const fpath = path.join(dir, fname);
    if (!fs.existsSync(fpath)) continue;
    let content = fs.readFileSync(fpath, 'utf8');

    // Only add buttons if they aren't already there
    if (!content.includes('t(\'delete\', \'حذف\')')) {
        const btnStr = `
    <button className="btn-danger ml-2" onClick={() => handleDelete(${rowVar}.id)}>{t('delete', 'حذف')}</button>
    <button className="btn-primary ml-2" onClick={() => {
      const s = prompt(t('enter_status', 'أدخل الحالة الجديدة'));
      if(s) handleUpdateStatus(${rowVar}.id, s);
    }}>{t('update_status', 'تحديث الحالة')}</button>`;

        if (viewKey) {
            // Find the view button
            const parts = content.split('<button');
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].includes(viewKey) && parts[i].includes('</button>')) {
                    parts[i] = parts[i].replace('</button>', '</button>' + btnStr);
                    break; 
                }
            }
            content = parts.join('<button');
        } else {
            if (fname === 'AiPricingPage.tsx') {
               const svgEnd = '</svg>\n            </div>';
               content = content.replace(svgEnd, svgEnd + btnStr);
            }
        }
    }

    if (fname === 'CompliancePage.tsx') {
        content = content.replace(/handleAction\('إغلاق القضية'\)/g, "handleUpdateStatus(selectedCheck.id, t('closed', 'مغلق'))");
    }

    fs.writeFileSync(fpath, content, 'utf8');
}
console.log("Done");
