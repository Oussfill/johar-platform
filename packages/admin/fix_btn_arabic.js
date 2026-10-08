const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');

// The base64 for "لديك حساب بالفعل؟ تسجيل الدخول"
const haveAcc = Buffer.from('2YTYr9mK2YMg2K3Ys9in2Kgg2KjYp9mE2YHYudmE2J8g2KrYs9is2YrZhCDYp9mE2K/YrtmI2YQ=', 'base64').toString('utf8');
// The base64 for "ليس لديك حساب؟ إنشاء حساب جديد"
const noAcc = Buffer.from('2YTZitOhINmE2K/ZitmDINit2LPYp9io2J8g2KXZhti02KfYoSDYrdiz2KfYqCDYrdiv2YrYrw==', 'base64').toString('utf8');

const buttonAdd = `<button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="mt-4 w-full text-center text-sm text-johar-gold hover:text-johar-white transition-colors"
          >
            {isRegister ? "${haveAcc}" : "${noAcc}"}
          </button>

          <button
            onClick={onGoGuest}`;

code = code.replace(/<button\s+type="button"\s+onClick=\{\(\) => setIsRegister\(!isRegister\)\}[\s\S]*?<button\s+onClick=\{onGoGuest\}/m, buttonAdd);

fs.writeFileSync('src/components/LoginPage.tsx', code);
