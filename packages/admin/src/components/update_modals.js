const fs = require('fs');
const path = require('path');

const dir = 'C:\\trd\\johar\\packages\\admin\\src\\components';

const replacements = {
    'AmlPage.tsx': [
        [
            /onClick=\{\(\) => alert\(t\('case_opened', 'تم فتح قضية'\)\)\}/g,
            "onClick={() => { handleUpdateStatus(selectedRecord.id, t('suspicious', 'مشبوه')); setIsDetailModalOpen(false); }}"
        ],
        [
            /onClick=\{\(\) => alert\(t\('closed_as_clean', 'تم الإغلاق كنظيف'\)\)\}/g,
            "onClick={() => { handleUpdateStatus(selectedRecord.id, t('clean', 'نظيف')); setIsDetailModalOpen(false); }}"
        ]
    ],
    'SanctionsPage.tsx': [
        [
            /onClick=\{\(\) => alert\(t\('sanctions_blocked_alert', 'تم الحظر'\)\)\}/g,
            "onClick={() => { handleUpdateStatus(selectedRecord.id, t('sanctions_confirmed', 'مؤكد')); setIsDetailModalOpen(false); }}"
        ],
        [
            /onClick=\{\(\) => alert\(t\('sanctions_ignored_alert', 'تم تجاوز التحذير'\)\)\}/g,
            "onClick={() => { handleUpdateStatus(selectedRecord.id, t('sanctions_clean', 'نظيف')); setIsDetailModalOpen(false); }}"
        ]
    ],
    'NotaryPage.tsx': [
        [
            /onClick=\{\(\) => alert\(t\('notary_approved_alert', 'تمت الموافقة والتوثيق'\)\)\}/g,
            "onClick={() => { handleUpdateStatus(selectedDoc.id, t('notary_status_notarized', 'موثق')); setIsModalOpen(false); }}"
        ],
        [
            /onClick=\{\(\) => alert\(t\('notary_rejected_alert', 'تم الرفض'\)\)\}/g,
            "onClick={() => { handleUpdateStatus(selectedDoc.id, t('notary_status_rejected', 'مرفوض')); setIsModalOpen(false); }}"
        ]
    ]
};

for (const [fname, reps] of Object.entries(replacements)) {
    const fpath = path.join(dir, fname);
    if (!fs.existsSync(fpath)) continue;
    let content = fs.readFileSync(fpath, 'utf8');
    for (const [find, replace] of reps) {
        content = content.replace(find, replace);
    }
    fs.writeFileSync(fpath, content, 'utf8');
}
console.log("Done updating modals");
