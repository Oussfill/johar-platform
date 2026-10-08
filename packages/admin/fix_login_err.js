const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');

code = code.replace(
  /setError\(\n\s*err instanceof Error\n\s*\? err\.message\n\s*: t\("login\.defaultError", "[^"]+"\)\n\s*\);/,
  `let msg = err instanceof Error ? err.message : t("login.defaultError", "حدث خطأ غير متوقع");
        if (msg.includes("device clock for skew") || msg.includes("issued in the future")) {
          msg = "فشل التحقق من الجلسة بسبب اختلاف الوقت. يرجى ضبط ساعة جهازك (الوقت والتاريخ) وتحديث الصفحة.";
        }
        if (msg.includes("Invalid login credentials")) {
          msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        }
        setError(msg);`
);

fs.writeFileSync('src/components/LoginPage.tsx', code);
