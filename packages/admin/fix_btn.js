const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');

const buttonAdd = `<button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="mt-4 w-full text-center text-sm text-johar-gold hover:text-johar-white transition-colors"
          >
            {isRegister ? "لديك حساب بالفعل؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
          </button>

          <button
            onClick={onGoGuest}`;

code = code.replace(/<button\s+onClick=\{onGoGuest\}/, buttonAdd);

fs.writeFileSync('src/components/LoginPage.tsx', code);
