import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronRight, Fingerprint, Scale, Shield, Truck, Activity, BarChart, BadgeCheck, Gem } from "lucide-react";
import { Link } from "react-router-dom";

export default function GuestLandingPage({ onGoLogin }: { onGoLogin: () => void }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-johar-black text-johar-white font-sans selection:bg-johar-gold/30 selection:text-johar-gold" dir={i18n.language.startsWith("ar") ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-10 h-10 rounded-lg object-cover bg-white" />
            <span className="font-bold text-xl tracking-widest gold-text">JOHAR</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#services" className="text-johar-gray-light hover:text-johar-white transition-colors">{t("landing.navServices", "خدماتنا")}</a>
            <a href="#security" className="text-johar-gray-light hover:text-johar-white transition-colors">{t("landing.navSecurity", "الأمان")}</a>
            <a href="#about" className="text-johar-gray-light hover:text-johar-white transition-colors">{t("landing.navAbout", "عن جوهر")}</a>
          </nav>
          <div className="flex items-center gap-4">
            <select 
              className="bg-transparent border border-johar-gray-dark rounded text-sm px-2 py-1 text-johar-gray-light hover:text-johar-white cursor-pointer focus:outline-none focus:border-johar-gold transition-colors appearance-none"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              value={i18n.language.substring(0, 2)}
              onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                document.documentElement.dir = e.target.value === 'ar' ? 'rtl' : 'ltr';
              }}
            >
              <option value="ar" className="bg-johar-black text-white">العربية</option>
              <option value="en" className="bg-johar-black text-white">English</option>
              <option value="fr" className="bg-johar-black text-white">Français</option>
            </select>
            <button onClick={onGoLogin} className="btn-primary px-6">
              {t("landing.loginBtn", "تسجيل الدخول")}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-johar-gold/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-johar-gold/30 bg-johar-gold/10 text-johar-gold text-xs font-semibold mb-8">
              <span className="w-2 h-2 rounded-full bg-johar-gold animate-pulse"></span>
              {t("landing.badge", "منصة التداول المؤسسي")}
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              {t("landing.heroTitle1", "مستقبل تداول")} <br/>
              <span className="gold-text">{t("landing.heroTitle2", "الذهب والمجوهرات")}</span>
            </h1>
            <p className="text-lg md:text-xl text-johar-gray-light mb-10 max-w-3xl leading-relaxed">
              {t("landing.heroSubtitle", "منظومة رقمية متكاملة لرقمنة، تداول، وحفظ الذهب والمجوهرات بمعايير مؤسسية وأمنية فائقة. نجمع بين الأسواق، المختبرات، والخدمات اللوجستية في منصة واحدة.")}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button onClick={onGoLogin} className="btn-primary w-full sm:w-auto text-lg px-8 py-4 shadow-lg shadow-yellow-900/20">
                {t("landing.explore", "الدخول للمنصة")}
              </button>
              <button className="w-full sm:w-auto px-8 py-4 text-white font-semibold flex items-center justify-center gap-2 group hover:text-johar-gold transition-colors">
                {t("landing.learnMore", "اكتشف المزيد")} <ChevronRight className={`w-4 h-4 transition-transform ${isRTL ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"}`} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Services Grid */}
      <section id="services" className="py-20 bg-johar-black-lighter/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.unifiedPlatform", "خدمات أعمال متكاملة")}</h2>
            <p className="text-johar-gray-light max-w-2xl mx-auto">{t("landing.unifiedDesc", "بنية تحتية رقمية شاملة لدورة حياة الأصول، من الفحص المخبري وحتى التسليم النهائي.")}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Fingerprint, title: t("landing.srvIdentity", "الهوية الرقمية"), desc: t("landing.srvIdentityDesc", "إصدار جوازات سفر رقمية وشهادات ملكية موثقة وغير قابلة للتزوير لكل أصل ذهبي.") },
              { icon: Scale, title: t("landing.srvMarketplace", "السوق والمزادات"), desc: t("landing.srvMarketplaceDesc", "تداول آمن بين الشركات (B2B)، تقديم عروض، وتنظيم مزادات حية موثقة.") },
              { icon: Shield, title: t("landing.srvCompliance", "الامتثال والمخاطر"), desc: t("landing.srvComplianceDesc", "نظام متقدم للتحقق من الهويات (KYC) وفحص العقوبات لضمان بيئة تداول آمنة.") },
              { icon: Truck, title: t("landing.srvLogistics", "الخدمات اللوجستية"), desc: t("landing.srvLogisticsDesc", "إدارة آمنة لحركة النقل، نقل العهدة، والتخزين الموثق في الخزائن المعتمدة.") },
              { icon: Activity, title: t("landing.srvLab", "ربط المختبرات"), desc: t("landing.srvLabDesc", "تسجيل نتائج الفحص المخبري والعيارات بشكل مباشر وموثوق من قبل مختبرات معتمدة.") },
              { icon: BarChart, title: t("landing.srvFinance", "الإدارة المالية"), desc: t("landing.srvFinanceDesc", "إدارة متكاملة للفواتير، المدفوعات، وتسويات العقود مع تقارير أداء لحظية.") }
            ].map((s, i) => (
              <div key={i} className="card-hover bg-[#0a0a0a] border border-white/5 p-8 group rounded-2xl">
                <s.icon className="w-10 h-10 text-johar-gray-dark group-hover:text-johar-gold transition-colors mb-6" />
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-sm text-johar-gray-light leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section id="security" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">{t("landing.securityTitle1", "مبنية على أسس")} <br/><span className="gold-text">{t("landing.securityTitle2", "الثقة والأمان المطلق")}</span></h2>
              <p className="text-johar-gray-light mb-8 leading-relaxed">
                {t("landing.securityDesc", "الأمان هو جوهر عملنا. نطبق أقصى معايير العزل وحماية البيانات لضمان خصوصية مطلقة لمعلومات شركتك وأصولك التجارية.")}
              </p>
              <div className="space-y-6">
                {[
                  { title: t("landing.secIsolation", "عزل تام للبيانات"), desc: t("landing.secIsolationDesc", "خصوصية مطلقة لبيانات كل شركة أو كيان تجاري دون أي تداخل.") },
                  { title: t("landing.secRbac", "تحكم دقيق بالصلاحيات"), desc: t("landing.secRbacDesc", "نظام أدوار متقدم يضمن وصول كل موظف وشريك لما يخصه فقط.") },
                  { title: t("landing.secAudit", "سجل تدقيق شامل"), desc: t("landing.secAuditDesc", "توثيق دقيق لكل حركة أو تغيير في النظام لضمان الشفافية والمساءلة.") }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="mt-1"><BadgeCheck className="w-6 h-6 text-johar-gold" /></div>
                    <div>
                      <h4 className="font-bold text-white">{item.title}</h4>
                      <p className="text-sm text-johar-gray-light mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-johar-gold/10 blur-3xl -z-10 rounded-full"></div>
              <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-2xl relative">
                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{t("landing.certTitle", "أعلى معايير الاعتماد")}</h3>
                    <p className="text-xs text-johar-gray-light">{t("landing.certSubtitle", "درجة أمان مؤسسية")}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/50 p-4 rounded-lg">
                    <span className="text-sm text-gray-400">{t("landing.techEncryption", "التشفير")}</span>
                    <span className="text-sm font-bold text-johar-gold">{t("landing.techEncryptionVal", "معايير بنكية متقدمة")}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/50 p-4 rounded-lg">
                    <span className="text-sm text-gray-400">{t("landing.techAuth", "المصادقة")}</span>
                    <span className="text-sm font-bold text-johar-gold">{t("landing.techAuthVal", "تحقق أمني صارم")}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/50 p-4 rounded-lg">
                    <span className="text-sm text-gray-400">{t("landing.techAudit", "المراقبة")}</span>
                    <span className="text-sm font-bold text-johar-gold">{t("landing.techAuditVal", "أنظمة تدقيق مستمرة 24/7")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/5 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-yellow-900/10 via-black to-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">{t("landing.ctaTitle", "هل أنت مستعد لرقمنة أعمالك؟")}</h2>
          <p className="text-xl text-johar-gray-light mb-10">{t("landing.ctaSubtitle", "انضم إلى المعيار الجديد في إدارة وتداول الذهب والمجوهرات عالمياً.")}</p>
          <button onClick={onGoLogin} className="btn-primary text-xl px-12 py-5 shadow-lg shadow-yellow-900/20">
            {t("landing.enterPlatform", "ابدأ الآن مع جوهر")}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050505] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-md object-cover bg-white" />
            <span className="font-bold text-xl tracking-tight gold-text">JOHAR</span>
          </div>
          <p className="text-sm text-johar-gray-light"> {new Date().getFullYear()} {t("landing.copyright", "منصة جوهر. جميع الحقوق محفوظة.")}</p>
          <div className="flex items-center gap-6 text-sm text-johar-gray-light">
            <a href="#" className="hover:text-johar-gold transition-colors">{t("landing.privacy", "الخصوصية")}</a>
            <a href="#" className="hover:text-johar-gold transition-colors">{t("landing.terms", "الشروط")}</a>
            <a href="#" className="hover:text-johar-gold transition-colors">{t("landing.compliancePolicy", "الامتثال")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
