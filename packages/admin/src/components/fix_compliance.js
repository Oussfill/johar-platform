const fs = require('fs');
const path = require('path');

const file = 'C:\\trd\\johar\\packages\\admin\\src\\components\\CompliancePage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /onClick=\{\(\) => handleAction\(t\('escalate_case', 'تصعيد الحالة'\)\)\}/g,
    "onClick={() => handleUpdateStatus(selectedCheck.id, t('escalated', 'مصعد'))}"
);

content = content.replace(
    /onClick=\{\(\) => handleAction\(t\('request_more_info', 'طلب مزيد من المعلومات'\)\)\}/g,
    "onClick={() => handleUpdateStatus(selectedCheck.id, t('info_requested', 'مطلوب معلومات'))}"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed CompliancePage.tsx modals');
