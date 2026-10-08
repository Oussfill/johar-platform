import React from 'react';
import ReactDOM from 'react-dom/client';
import GoldApp from '../components/GoldApp';

// استخراج جلسة Google SSO من رابط المعاودة (hash يحمل session=) قبل تشغيل التطبيق
// المعاودة تنقلك إلى: /#/auth/sso?session=<JSON> — هنا نقرأها ونخزّنها ونمسح الرابط
(function extractSsoSession(): void {
  try {
    const hash = window.location.hash || '';
    const m = hash.match(/[?&]session=([^&]+)/);
    if (m) {
      const session = JSON.parse(decodeURIComponent(m[1]));
      if (session && session.token) {
        localStorage.setItem('gold-token', session.token);
        if (session.user) {
          localStorage.setItem('gold-user', JSON.stringify(session.user));
        }
      }
      if (window.history.replaceState) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search,
        );
      }
    }
  } catch (_) {
    /* لا شيء — المعاودة غير كاملة، يُرفع المستخدم لصفحة الدخول */
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoldApp />
  </React.StrictMode>,
);
