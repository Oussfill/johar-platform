import React, { useState } from 'react';
import { useFetch, Card, GoldButton, TextField, Loading, fmtMoney } from './UiKit';
import type { Language, Currency } from './UiKit';
import { LoginPage } from './LoginPage';
import {
  ExhibitorsSection,
  AcademySection,
  HowSection,
  FaqSection,
  ContactSection,
  ServicesSection,
  NewsletterBox,
} from './PublicSections';
import type { SectionId } from './PublicSections';

interface Product {
  listingId: string;
  title: string;
  description?: string;
  asset: {
    goldId: string;
    metalType: string;
    karat: number;
    weightGross: number;
    productType: string;
    name: string;
  };
  pricing: {
    basePrice: number;
    finalPrice: number;
    currency: Currency;
  };
  seller: {
    name: string;
  };
  imageUrl?: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function productPlaceholderImage(p: Product): string {
  const name = escapeXml((p.title || p.asset?.name || 'JOHAR').slice(0, 24));
  const metal = escapeXml(p.asset?.metalType || '—');
  const karat = escapeXml(p.asset?.karat != null ? `${p.asset.karat}K` : '—');
  const weight = escapeXml(p.asset?.weightGross != null ? `${p.asset.weightGross}g` : '—');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <defs>
    <radialGradient id="bgGlow" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#1b1626"/>
      <stop offset="0.6" stop-color="#100e18"/>
      <stop offset="1" stop-color="#0a0a0f"/>
    </radialGradient>
    <linearGradient id="ingotTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff3c4"/>
      <stop offset="0.18" stop-color="#f6df8a"/>
      <stop offset="0.5" stop-color="#d4af37"/>
      <stop offset="0.82" stop-color="#b0882a"/>
      <stop offset="1" stop-color="#8e6a1e"/>
    </linearGradient>
    <linearGradient id="ingotSide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a8862b"/>
      <stop offset="1" stop-color="#6f5317"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,0.9)"/>
      <stop offset="0.4" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <rect width="300" height="200" fill="url(#bgGlow)"/>
  <text x="20" y="26" fill="#c6a969" font-family="Georgia, serif" font-size="11" letter-spacing="3" font-weight="bold">JOHAR</text>
  <ellipse cx="150" cy="148" rx="64" ry="9" fill="#000" opacity="0.5"/>
  <ellipse cx="150" cy="147" rx="52" ry="6.5" fill="#000" opacity="0.35"/>
  <path d="M106 80 h88 l11 28 h-110 z" fill="url(#ingotSide)"/>
  <rect x="106" y="62" width="88" height="18" rx="2.5" fill="url(#ingotTop)"/>
  <rect x="112" y="66" width="30" height="5" rx="2.5" fill="url(#shine)" opacity="0.85"/>
  <rect x="150" y="66" width="34" height="5" rx="2.5" fill="#8e6a1e" opacity="0.5"/>
  <text x="150" y="99" fill="#3c2c08" font-family="Georgia, serif" font-size="12" font-weight="bold" letter-spacing="1.5" text-anchor="middle">JOHAR</text>
  <text x="150" y="173" fill="#e0d5c1" font-family="Verdana, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">${name}</text>
  <text x="150" y="189" fill="#8a8a9a" font-family="Verdana, sans-serif" font-size="10" text-anchor="middle">${metal} • ${karat} • ${weight}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface PublicLandingPageProps {
  language: Language;
  currency: Currency;
  onLanguageChange: (lang: Language) => void;
  onCurrencyChange: (cur: Currency) => void;
}

export function PublicLandingPage({
  language,
  currency,
  onLanguageChange,
  onCurrencyChange,
}: PublicLandingPageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [section, setSection] = useState<SectionId>('home');

  const { data: listings, loading } = useFetch<Product[]>('/api/v1/marketplace?limit=6');

  const t = (key: string): string => {
    const map: Record<string, Record<Language, string>> = {
      heroTitle: { AR: 'منصة جوهر الرقمية للذهب والأصول الذكية', FR: 'Plateforme JOHAR pour l\'or et les actifs intelligents', EN: 'JOHAR Platform for Gold & Smart Assets' },
      heroSub: { AR: 'تداول، توثيق، وتمليك الأصول الذهبية بثقة وشفافية', FR: 'Commerce, certification et propriété des actifs dorés en toute confiance', EN: 'Trade, certify, and own gold assets with trust and transparency' },
      heroCta: { AR: 'ابدأ الآن', FR: 'Commencer', EN: 'Get Started' },
      heroLogin: { AR: 'تسجيل الدخول', FR: 'Connexion', EN: 'Sign In' },
      productsTitle: { AR: 'منتجاتنا', FR: 'Nos Produits', EN: 'Our Products' },
      productsSub: { AR: 'سبائك ذهبية معتمدة ومختبرة بأعلى معايير الجودة', FR: 'Lingots d\'or certifiés et testés selon les normes de qualité les plus élevées', EN: 'Certified and tested gold bars to the highest quality standards' },
      name: { AR: 'الاسم', FR: 'Nom', EN: 'Name' },
      email: { AR: 'البريد الإلكتروني', FR: 'E-mail', EN: 'Email' },
      message: { AR: 'الرسالة', FR: 'Message', EN: 'Message' },
      send: { AR: 'إرسال', FR: 'Envoyer', EN: 'Send' },
      sending: { AR: 'جاري الإرسال...', FR: 'Envoi en cours...', EN: 'Sending...' },
      success: { AR: 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً.', FR: 'Votre demande a été envoyée avec succès. Nous vous contacterons bientôt.', EN: 'Your request has been sent successfully. We will contact you soon.' },
      error: { AR: 'حدث خطأ. يرجى المحاولة مرة أخرى.', FR: 'Une erreur s\'est produite. Veuillez réessayer.', EN: 'An error occurred. Please try again.' },
      price: { AR: 'السعر', FR: 'Prix', EN: 'Price' },
      weight: { AR: 'الوزن', FR: 'Poids', EN: 'Weight' },
      karat: { AR: 'القيراط', FR: 'Karat', EN: 'Karat' },
      metal: { AR: 'المعدن', FR: 'Métal', EN: 'Metal' },
      footer: { AR: '© 2026 منصة جوهر. جميع الحقوق محفوظة.', FR: '© 2026 Plateforme JOHAR. Tous droits réservés.', EN: '© 2026 JOHAR Platform. All rights reserved.' },
      close: { AR: 'إغلاق', FR: 'Fermer', EN: 'Close' },
      requestProduct: { AR: 'طلب المنتج', FR: 'Demander le produit', EN: 'Request Product' },
      // Navigation
      navHome: { AR: 'الرئيسية', FR: 'Accueil', EN: 'Home' },
      navProducts: { AR: 'المنتجات', FR: 'Produits', EN: 'Products' },
      navServices: { AR: 'خدماتنا', FR: 'Services', EN: 'Services' },
      navExhibitors: { AR: 'العارضون', FR: 'Exposants', EN: 'Exhibitors' },
      navAcademy: { AR: 'الأكاديمية', FR: 'Académie', EN: 'Academy' },
      navHow: { AR: 'كيف نعمل', FR: 'Comment ça marche', EN: 'How it works' },
      navFaq: { AR: 'الأسئلة الشائعة', FR: 'FAQ', EN: 'FAQ' },
      navContact: { AR: 'تواصل معنا', FR: 'Contact', EN: 'Contact' },
      // Exhibitors
      exhibitorsTitle: { AR: 'العارضون الموثوقون', FR: 'Exposants vérifiés', EN: 'Verified Exhibitors' },
      exhibitorsSub: { AR: 'مصنّعون وتجار ذهب معتمدون داخل منصة جوهر', FR: 'Fabricants et négociants en or certifiés sur JOHAR', EN: 'Certified gold manufacturers and traders on JOHAR' },
      verified: { AR: 'موثّق', FR: 'Vérifié', EN: 'Verified' },
      activeListings: { AR: 'منتجات نشطة', FR: 'Annonces actives', EN: 'Active listings' },
      joinFairTitle: { AR: 'انضم إلى المعرض', FR: 'Rejoignez le salon', EN: 'Join the fair' },
      joinFairSub: { AR: 'احجز جناحك واعرض منتجاتك أمام مشترين عالميين', FR: 'Réservez votre stand et présentez vos produits aux acheteurs internationaux', EN: 'Book your stand and showcase your products to global buyers' },
      bookStand: { AR: 'احجز جناحاً الآن', FR: 'Réserver un stand', EN: 'Book a stand' },
      noResults: { AR: 'لا توجد نتائج حالياً', FR: 'Aucun résultat pour le moment', EN: 'No results yet' },
      // Academy
      academyTitle: { AR: 'الأكاديمية والمدونة', FR: 'Académie & Blog', EN: 'Academy & Blog' },
      academySub: { AR: 'مقالات وورش عمل ودورات عن الذهب والاستثمار والشهادات', FR: 'Articles, ateliers et formations sur l\'or, l\'investissement et la certification', EN: 'Articles, workshops and courses on gold, investing and certification' },
      // How it works
      howTitle: { AR: 'كيف نعمل', FR: 'Comment ça marche', EN: 'How it works' },
      howSub: { AR: 'أربع خطوات أبسط من أي وقت مضى من التسجيل حتى الاستلام', FR: 'Quatre étapes simples de l\'enregistrement à la livraison', EN: 'Four simple steps from registration to delivery' },
      howStep1Title: { AR: 'التسجيل', FR: 'Inscription', EN: 'Register' },
      howStep1Desc: { AR: 'أنشئ حسابك الموثق خلال دقائق', FR: 'Créez votre compte vérifié en quelques minutes', EN: 'Create your verified account in minutes' },
      howStep2Title: { AR: 'التحقق والتوثيق', FR: 'Vérification', EN: 'Verification' },
      howStep2Desc: { AR: 'فحص الأصول في مختبرات معتمدة وفق ISO/IEC 17025', FR: 'Inspection des actifs dans des laboratoires accrédités ISO/IEC 17025', EN: 'Assets inspected in ISO/IEC 17025 accredited labs' },
      howStep3Title: { AR: 'التداول الآمن', FR: 'Transaction sécurisée', EN: 'Secure trade' },
      howStep3Desc: { AR: 'تداول عبر سوق موثوق مع ضمان مالي وتمليك رقمي', FR: 'Négociez sur un marché de confiance avec garantie et propriété numérique', EN: 'Trade on a trusted marketplace with escrow and digital ownership' },
      howStep4Title: { AR: 'الاستلام أو الحفظ', FR: 'Livraison ou conservation', EN: 'Delivery or custody' },
      howStep4Desc: { AR: 'استلم شحنتك المؤمّنة أو احفظها في خزائن آمنة', FR: 'Recevez votre envoi assuré ou conservez-le dans des coffres sécurisés', EN: 'Receive your insured shipment or store it in secure vaults' },
      buyerProgramTitle: { AR: 'برنامج المشترين', FR: 'Programme Acheteurs', EN: 'Buyer Program' },
      buyerProgramSub: { AR: 'سجّل بياناتك ليصلك دليل المشترين ويخصص لك مستشار تداول', FR: 'Enregistrez-vous pour recevoir le guide des acheteurs et un conseiller dédié', EN: 'Register to receive the buyers guide and a dedicated advisor' },
      companyName: { AR: 'اسم الشركة', FR: 'Nom de l\'entreprise', EN: 'Company name' },
      contactName: { AR: 'اسم المسؤول', FR: 'Nom du contact', EN: 'Contact name' },
      phone: { AR: 'الهاتف', FR: 'Téléphone', EN: 'Phone' },
      country: { AR: 'الدولة', FR: 'Pays', EN: 'Country' },
      companyType: { AR: 'نوع الشركة', FR: 'Type de société', EN: 'Company type' },
      interestGOLD_BULLION: { AR: 'سبائك ذهب', FR: 'Lingots d\'or', EN: 'Gold bullion' },
      interestJEWELLERY: { AR: 'مجوهرات', FR: 'Bijoux', EN: 'Jewellery' },
      interestINVESTMENT: { AR: 'استثمار', FR: 'Investissement', EN: 'Investment' },
      interestWHOLESALE: { AR: 'جملة وتوريد', FR: 'Gros et approvisionnement', EN: 'Wholesale & supply' },
      applyBuyerProgram: { AR: 'تقديم الطلب', FR: 'Soumettre la demande', EN: 'Apply now' },
      buyerProgramDone: { AR: 'تم استلام طلبك. سيقوم فريقنا بالتواصل معك خلال 48 ساعة.', FR: 'Votre demande a été reçue. Notre équipe vous contactera sous 48 h.', EN: 'Your application was received. Our team will contact you within 48 hours.' },
      // FAQ
      faqTitle: { AR: 'الأسئلة الشائعة', FR: 'Questions fréquentes', EN: 'Frequently asked questions' },
      faqSub: { AR: 'إجابات مباشرة عن أكثر ما يُسأل عنه', FR: 'Des réponses directes aux questions les plus courantes', EN: 'Straight answers to the most common questions' },
      faq1Q: { AR: 'هل الذهب في جوهر موثّق ومعتمد؟', FR: 'L\'or de JOHAR est-il certifié ?', EN: 'Is JOHAR gold certified?' },
      faq1A: { AR: 'نعم، كل سبيكة تُفحص في مختبر معتمد وفق ISO/IEC 17025 وتُمنح شهادة جودة رقمية ورخصة تداول.', FR: 'Oui, chaque lingot est inspecté en laboratoire accrédité ISO/IEC 17025 et reçoit un certificat de qualité numérique.', EN: 'Yes, every bar is inspected in an ISO/IEC 17025 accredited lab and gets a digital quality certificate.' },
      faq2Q: { AR: 'كيف أتعامل مع السوق؟', FR: 'Comment trader sur la plateforme ?', EN: 'How do I trade?' },
      faq2A: { AR: 'سجّل، تحقق من هويتك، تصفح المنتجات الموثقة، وادفع عبر ضمان مالي لحين التحقق من الأصول.', FR: 'Inscrivez-vous, vérifiez votre identité, parcourez les produits certifiés et payez via un compte séquestre.', EN: 'Register, verify your identity, browse certified products, and pay through escrow until assets are verified.' },
      faq3Q: { AR: 'هل يمكنني حفظ الذهب المشترى؟', FR: 'Puis-je stocker l\'or acheté ?', EN: 'Can I store purchased gold?' },
      faq3A: { AR: 'نعم، نوفر خزائن آمنة ومخازن مرخصة مع سلسلة حيازة كاملة في كل خطوة.', FR: 'Oui, nous offrons des coffres sécurisés et des entrepôts agréés avec une chaîne de garde complète.', EN: 'Yes, we offer secure vaults and licensed warehouses with full chain of custody.' },
      faq4Q: { AR: 'ما هي وسائل الدفع المتاحة؟', FR: 'Quels modes de paiement ?', EN: 'What payment methods?' },
      faq4A: { AR: 'تحويل بنكي، بطاقات، وعملات رقمية عبر بوابات دفع مشفرة ومسجلة.', FR: 'Virement bancaire, cartes et crypto via des passerelles chiffrées.', EN: 'Bank transfer, cards and crypto via encrypted payment gateways.' },
      faq5Q: { AR: 'كيف أستفيد من برنامج المشترين؟', FR: 'Comment profiter du Programme Acheteurs ?', EN: 'How can I benefit from the Buyer Program?' },
      faq5A: { AR: 'سجّل شركتك وستحصل على دليل المشترين، وأسعار تفضيلية، ومستشار مخصص للاستيراد والتصدير.', FR: 'Enregistrez votre société pour obtenir le guide des acheteurs, des prix préférentiels et un conseiller dédié.', EN: 'Register your company for the buyers guide, preferred pricing and a dedicated import/export advisor.' },
      faq6Q: { AR: 'هل المعرض الافتراضي متاح للجميع؟', FR: 'Le salon virtuel est-il ouvert à tous ?', EN: 'Is the virtual fair open to everyone?' },
      faq6A: { AR: 'نعم، التصفح مفتوح للجميع والمشاركة بجناح تتطلب حساباً موثقاً وموافقة الفريق.', FR: 'Oui, la navigation est ouverte à tous, mais un stand requiert un compte vérifié et une approbation.', EN: 'Yes, browsing is open to everyone, but a stand requires a verified account and approval.' },
      // Contact
      contactTitle: { AR: 'تواصل معنا', FR: 'Contactez-nous', EN: 'Contact us' },
      contactSub: { AR: 'فريقنا جاهز للإجابة عن أسئلتك على مدار الساعة', FR: 'Notre équipe répond à vos questions à toute heure', EN: 'Our team answers your questions around the clock' },
      productSubject: { AR: 'الموضوع / المنتج', FR: 'Sujet / Produit', EN: 'Subject / Product' },
      // Newsletter
      newsletterTitle: { AR: 'النشرة البريدية', FR: 'Newsletter', EN: 'Newsletter' },
      newsletterSub: { AR: 'آخر أخبار الذهب، المعارض، والعروض الحصرية', FR: 'Actualités de l\'or, salons et offres exclusives', EN: 'Latest gold news, fairs and exclusive offers' },
      newsletterCta: { AR: 'اشترك', FR: 'S\'abonner', EN: 'Subscribe' },
      newsletterDone: { AR: 'تم الاشتراك بنجاح!', FR: 'Inscription réussie !', EN: 'Subscribed successfully!' },
      // Services
      svcSystemBadge: { AR: 'نظام التكامل الواحد · Al-Takamul Wahid', FR: 'Système d\'intégration unifiée · Al-Takamul Wahid', EN: 'Unified Integration System · Al-Takamul Wahid' },
      svcTitle1: { AR: 'إدارة الأصول المادية والرقمية: بنية رياضية محكمة للتتبع والأمان', FR: 'Gestion des actifs physiques & numériques : une structure mathématique rigoureuse pour le suivi et la sécurité', EN: 'Physical & Digital Asset Management: A Rigorous Mathematical Structure for Tracking & Security' },
      svcSub1: { AR: 'نعتمد على بنية رياضية بديهية شكلية (Axiomatic Formal Structure) تربط الأصول الملموسة — مثل السبائك الذكية والأصول الثمينة — بالبيانات الرقمية بأسلوب منطقي يمنع التلاعب أو ضياع السجلات. يوفر نظامنا دقة متناهية في تتبع دورة حياة الأصل من لحظة إنشائه وحتى تداوله.', FR: 'Nous nous appuyons sur une structure mathématique axiomatique (Axiomatic Formal Structure) reliant les actifs tangibles — lingots intelligents et actifs précieux — aux données numériques de façon logique, empêchant toute manipulation ou perte d\'enregistrements. Notre système offre une précision extrême dans le suivi du cycle de vie d\'un actif, de sa création à sa circulation.', EN: 'We rely on an Axiomatic Formal Structure that links tangible assets — smart bars and precious assets — to digital data in a logical manner that prevents tampering or record loss. Our system provides extreme fidelity in tracking an asset\'s lifecycle from creation to circulation.' },
      svcConservationBoxTitle: { AR: 'نظرية الحفظ الثلاثي — المعادلة المغلقة', FR: 'Théorème de conservation triple — équation fermée', EN: 'Triple Conservation Theorem — closed equation' },
      svcConservationBoxSub: { AR: 'التاريخ التراكمي L(t) يساوي الحيازة الراهنة C(t) زائد رصيد المخزون S(t) في أي لحظة زمنية — كل حركة أصل تُسجل تلقائياً دون أي خلل في المجموع الكلي.', FR: 'L\'historique cumulé L(t) est égal à la possession courante C(t) plus le solde de stock S(t) à tout instant — chaque mouvement est enregistré automatiquement sans jamais altérer le total.', EN: 'The cumulative history L(t) equals current holdings C(t) plus inventory balance S(t) at any moment — every asset movement is recorded automatically without ever breaking the total.' },
      svcConservationTitle: { AR: 'نظرية الحفظ الثلاثي', FR: 'Théorème de conservation triple', EN: 'Triple Conservation Theorem' },
      svcConservationDesc1: { AR: 'تضمن التوازن التام لحالة الأصول في أي لحظة زمنية عبر المعادلة المغلقة:', FR: 'Garantit l\'équilibre parfait de l\'état des actifs à tout instant via l\'équation fermée :', EN: 'Guarantees perfect asset balance at any instant through the closed equation:' },
      svcConservationDesc2: { AR: 'أي حركة أصل تُسجل تلقائياً دون أي خلل في المجموع الكلي.', FR: 'Tout mouvement est automatiquement enregistré sans jamais altérer le total.', EN: 'Every asset movement is recorded automatically without ever breaking the total.' },
      svcClosedOpsTitle: { AR: 'إدارة العمليات المغلقة والثبات', FR: 'Opérations fermées et invariance', EN: 'Closed Operations & Invariance' },
      svcClosedOpsDesc1: { AR: 'دعم عمليات الدمج، الانقسام، وإعادة التوزيع للأصول دون تغيير القيمة الكلية أو فقدان البيانات — تبقى القيمة الرياضية', FR: 'Fusion, division et redistribution des actifs sans changer la valeur globale ni perdre de données — la valeur mathématique', EN: 'Merge, split and redistribute assets without changing the total value or losing data — the mathematical value' },
      svcClosedOpsDesc2: { AR: 'ثابتة عند كل عملية، دون أي انحراف (Data Drift).', FR: 'reste invariante à chaque opération, sans aucune dérive (Data Drift).', EN: 'stays constant at every operation, without data drift.' },
      svcAuditTitle: { AR: 'سجل التدقيق التاريخي', FR: 'Piste d\'audit historique', EN: 'Historical Audit Trail' },
      svcAuditDesc: { AR: 'تتبع بصمي غير قابل للتراجع: بمجرد تفعيل حقل الأصول أو تداولها يُنشأ سجل تاريخي دائم يُمنع تعديله، لتوفير أعلى مستويات الحماية للأصول الرقمية والمادية.', FR: 'Traçabilité immuable et irréversible : dès qu\'un champ est activé ou un actif négocié, un enregistrement historique permanent est créé et ne peut être modifié, offrant la plus haute protection des actifs numériques et physiques.', EN: 'Immutable, irreversible tracking: once an asset field is activated or an asset is traded, a permanent record is created that cannot be modified — the highest protection for digital and physical assets.' },
      svcSmartTitle: { AR: 'التطبيق العملي: السبائك والأصول الذكية', FR: 'Application pratique : lingots et actifs intelligents', EN: 'Practical Application: Smart Bars & Assets' },
      svcSmartDesc: { AR: 'ربط القطع والسبائك المادية بهويات رقمية موثوقة تتيح التحقق الفوري من ملكية الأصل، رصيده، وحالته الحالية في أي وقت.', FR: 'Les pièces et lingots physiques sont liés à des identités numériques fiables permettant la vérification instantanée de la propriété, du solde et de l\'état actuel de l\'actif.', EN: 'Bind physical pieces and bars to trusted digital identities for instant verification of an asset\'s ownership, balance and current status.' },
      svcInvariantTitle: { AR: 'اختبارات الاتساق الإلزامية', FR: 'Tests d\'invariance obligatoires', EN: 'Mandatory Invariant Tests' },
      svcInvariantDesc: { AR: 'توجيهات برمجية تضمن مطابقة التنفيذ البرمجي للنظرية الرياضية وتمنع انحراف البيانات (Data Drift) عبر فحوصات مستمرة.', FR: 'Directives logicielles garantissant la conformité de l\'implémentation à la théorie mathématique et prévenant la dérive des données (Data Drift) par des contrôles continus.', EN: 'Engineering directives that keep the implementation true to the mathematical theory and prevent data drift through continuous checks.' },
      svcCta1: { AR: 'استكشف الحلول التقنية لإدارة الأصول', FR: 'Découvrir nos solutions techniques de gestion d\'actifs', EN: 'Explore Technical Asset Management Solutions' },
      svcStatsBadge: { AR: 'أدوات الإحصاء المتقدم · SPSS', FR: 'Outils de statistiques avancées · SPSS', EN: 'Advanced Statistical Tools · SPSS' },
      svcTitle2: { AR: 'تحليل البيانات والبحوث باستخدام برنامج SPSS', FR: 'Analyse de données et recherche avec SPSS', EN: 'Data Analysis & Research with SPSS' },
      svcSub2: { AR: 'نقدم أدوات وتطبيقات الإحصاء المتقدم لتحليل بيانات الاستبيانات والبحوث العلمية، ودعم اتخاذ القرارات، وحساب النتائج بدقة عالية.', FR: 'Nous fournissons des outils et applications de statistiques avancées pour analyser les données d\'enquêtes et de recherches scientifiques, soutenir la prise de décision et calculer les résultats avec une haute précision.', EN: 'We provide advanced statistical tools and applications to analyze survey and research data, support decision-making and compute results with high accuracy.' },
      svcDescriptiveTitle: { AR: 'الإحصاء الوصفي', FR: 'Statistiques descriptives', EN: 'Descriptive Statistics' },
      svcDescriptiveDesc: { AR: 'استخراج المتوسطات الحسابية، الانحراف المعياري، التكرارات، والنسب المئوية لوصف طبائع العينة بدقة.', FR: 'Extraction des moyennes, écart-types, fréquences et pourcentages pour décrire précisément les caractéristiques de l\'échantillon.', EN: 'Mean, standard deviation, frequencies and percentages to precisely describe sample characteristics.' },
      svcHypothesisTitle: { AR: 'اختبار الفرضيات', FR: 'Test d\'hypothèses', EN: 'Hypothesis Testing' },
      svcHypothesisDesc: { AR: 'التحقق العلمي من صحة الفروض الصفرية والبديلة للبحوث وفق مناهج البحث المعتمدة.', FR: 'Vérification scientifique des hypothèses nulles et alternatives selon les méthodologies de recherche approuvées.', EN: 'Scientific verification of null and alternative hypotheses per approved research methodology.' },
      svcCorrTitle: { AR: 'الارتباط والانحدار', FR: 'Corrélation et régression', EN: 'Correlation & Regression' },
      svcCorrDesc: { AR: 'قياس قوة ونوع العلاقات بين المتغيرات، والتنبؤ بالنتائج المستقبلية عبر نماذج الانحدار.', FR: 'Mesure de la force et de la nature des relations entre variables et prédiction des résultats futurs via des modèles de régression.', EN: 'Measures the strength and nature of relationships between variables and predicts future outcomes via regression models.' },
      svcTtestTitle: { AR: 'اختبار T واختبار ANOVA', FR: 'Test T et ANOVA', EN: 'T-Test & ANOVA' },
      svcTtestDesc: { AR: 'مقارنة متوسطات المجموعات: مجموعتين عبر T-Test، وثلاث مجموعات فأكثر عبر ANOVA.', FR: 'Comparaison des moyennes de groupes : deux groupes via le T-Test, trois groupes ou plus via l\'ANOVA.', EN: 'Compare group means: two groups via T-Test, three or more via ANOVA.' },
      svcReliabilityTitle: { AR: 'تحليل وثبات الاستبيانات', FR: 'Analyse et fiabilité des questionnaires', EN: 'Survey Analysis & Reliability' },
      svcReliabilityDesc: { AR: 'قياس صدق وثبات أدوات الدراسة قبل التحليل النهائي عبر استخراج معامل ألفا كرونباخ (Cronbach\'s Alpha).', FR: 'Mesure de la validité et de la fiabilité des instruments d\'étude avant l\'analyse finale via le coefficient alpha de Cronbach.', EN: 'Measures validity and reliability of study instruments before final analysis via Cronbach\'s Alpha.' },
      svcCta2: { AR: 'اطلب خدمة التحليل الإحصائي', FR: 'Demander un service d\'analyse statistique', EN: 'Request Statistical Analysis' },
    };
    return map[key]?.[language] || key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const productName = selectedProduct?.title || selectedProduct?.asset?.name || '';
const payload = {
        ...form,
        product: productName,
      };
      const res = await fetch('/api/v1/contact/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitResult({ ok: true, message: t('success') });
        setForm({ name: '', email: '', message: '' });
        setSelectedProduct(null);
      } else {
        setSubmitResult({ ok: false, message: json.error?.message || t('error') });
      }
    } catch {
      setSubmitResult({ ok: false, message: t('error') });
    }
    setSubmitting(false);
  };

  if (showLogin) {
    return (
      <LoginPage
        language={language}
        currency={currency}
        onLanguageChange={onLanguageChange}
        onCurrencyChange={onCurrencyChange}
        onBack={() => setShowLogin(false)}
      />
    );
  }

  const products = listings || [];
  const featured = products.slice(0, 6);

  return (
    <div dir={language === 'AR' ? 'rtl' : 'ltr'} style={{ background: '#0a0a0f', color: '#e0d5c1', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid rgba(198,169,105,0.12)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/johar-logo.jpeg" alt="جوهر" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ color: '#c6a969', fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>{language === 'AR' ? 'جوهر' : 'JOHAR'}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={language} onChange={(e) => onLanguageChange(e.target.value as Language)} style={{ background: 'transparent', color: '#8a8a9a', border: '1px solid rgba(198,169,105,0.15)', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>
            <option value="AR">العربية</option>
            <option value="FR">Français</option>
            <option value="EN">English</option>
          </select>
          <GoldButton onClick={() => setShowLogin(true)} style={{ padding: '6px 18px', fontSize: 13 }}>{t('heroLogin')}</GoldButton>
          <GoldButton onClick={() => setShowLogin(true)} style={{ padding: '6px 18px', fontSize: 13 }}>{t('heroCta')}</GoldButton>
        </div>
      </header>

      {/* Section navigation */}
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(198,169,105,0.08)', background: 'rgba(26,26,36,0.6)' }}>
        {(
          [
            ['home', 'navHome'],
            ['products', 'navProducts'],
            ['services', 'navServices'],
            ['exhibitors', 'navExhibitors'],
            ['academy', 'navAcademy'],
            ['how', 'navHow'],
            ['faq', 'navFaq'],
            ['contact', 'navContact'],
          ] as [SectionId, string][]
        ).map(([id, key]) => (
          <button
            key={id}
            onClick={() => {
              setSection(id);
              window.scrollTo({ top: 0 });
            }}
            style={{
              background: section === id ? 'rgba(198,169,105,0.18)' : 'transparent',
              color: section === id ? '#c6a969' : '#8a8a9a',
              border: section === id ? '1px solid rgba(198,169,105,0.6)' : '1px solid transparent',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {t(key)}
          </button>
        ))}
      </nav>

      {/* Hero */}
      {section === 'home' && (
        <section style={{ padding: '40px 28px', textAlign: 'center', maxWidth: 800, margin: '0 auto', flexShrink: 0 }}>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#c6a969', margin: 0, lineHeight: 1.2 }}>{t('heroTitle')}</h1>
          <p style={{ fontSize: 18, color: '#8a8a9a', marginTop: 16 }}>{t('heroSub')}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32 }}>
            <GoldButton onClick={() => setShowLogin(true)} style={{ padding: '12px 32px', fontSize: 16 }}>{t('heroCta')}</GoldButton>
          </div>
        </section>
      )}

      {/* Products */}
      {(section === 'home' || section === 'products') && (
        <section style={{ padding: '40px 28px', maxWidth: 1400, margin: '0 auto', width: '100%', flex: '1 1 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, color: '#c6a969' }}>{t('productsTitle')}</h2>
          <p style={{ textAlign: 'center', color: '#8a8a9a', marginBottom: 32 }}>{t('productsSub')}</p>
          {loading ? (
            <Loading />
          ) : featured.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8a8a9a', padding: 40 }}>No products available</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {featured.map((p) => {
                const asset = p.asset || {};
                const pricing = p.pricing || {};
                const price = pricing.finalPrice || pricing.basePrice || 0;
                const currency = pricing.currency || currency;
                const imageUrl = p.imageUrl || productPlaceholderImage(p);
                const displayName = p.title || asset.name || 'Product';
                return (
                  <div
                    key={p.listingId || Math.random()}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedProduct(p)}
                  >
                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: 180, background: '#1a1a24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={imageUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#c6a969' }}>{displayName}</div>
                        <div style={{ color: '#8a8a9a', fontSize: 13, marginTop: 8 }}>
                          <div>{t('metal')}: {asset.metalType || '—'}</div>
                          <div>{t('karat')}: {asset.karat || '—'}</div>
                          <div>{t('weight')}: {asset.weightGross || '—'}g</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#c6a969', marginTop: 8 }}>{fmtMoney(price, currency)}</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {section === 'exhibitors' && (
        <main className="content" style={{ padding: '40px 28px', maxWidth: 1200, margin: '0 auto', width: '100%', flex: '1 1 auto' }}>
          <ExhibitorsSection t={t} language={language} onOpenBuyer={() => setSection('how')} />
        </main>
      )}

      {section === 'services' && (
        <main className="content" style={{ padding: '40px 28px', maxWidth: 1200, margin: '0 auto', width: '100%', flex: '1 1 auto' }}>
          <ServicesSection t={t} onNavigate={(id) => setSection(id)} />
        </main>
      )}

      {section === 'academy' && (
        <main className="content" style={{ padding: '40px 28px', maxWidth: 1200, margin: '0 auto', width: '100%', flex: '1 1 auto' }}>
          <AcademySection t={t} language={language} />
        </main>
      )}

      {section === 'how' && (
        <main className="content" style={{ padding: '40px 28px', maxWidth: 1200, margin: '0 auto', width: '100%', flex: '1 1 auto' }}>
          <HowSection t={t} language={language} />
        </main>
      )}

      {section === 'faq' && (
        <main className="content" style={{ padding: '40px 28px', maxWidth: 1200, margin: '0 auto', width: '100%', flex: '1 1 auto' }}>
          <FaqSection t={t} />
        </main>
      )}

      {section === 'contact' && (
        <main className="content" style={{ padding: '40px 28px', maxWidth: 1200, margin: '0 auto', width: '100%', flex: '1 1 auto' }}>
          <ContactSection t={t} language={language} />
        </main>
      )}

      {/* Footer */}
      <footer style={{ padding: '32px 28px', borderTop: '1px solid rgba(198,169,105,0.08)', color: '#5a5a68', fontSize: 13, flexShrink: 0 }}>
        <div style={{ maxWidth: 520, margin: '0 auto 24px' }}>
          <NewsletterBox t={t} language={language} />
        </div>
        <div style={{ textAlign: 'center' }}>{t('footer')}</div>
      </footer>

      {/* Modal */}
      {selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }} onClick={() => setSelectedProduct(null)}>
          <div style={{
            background: '#1a1a24',
            borderRadius: 12,
            maxWidth: 540,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: 28,
            position: 'relative',
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                background: 'transparent',
                border: 'none',
                color: '#8a8a9a',
                fontSize: 24,
                cursor: 'pointer',
              }}
            >&times;</button>
            <h3 style={{ color: '#c6a969', fontSize: 20, fontWeight: 700, marginTop: 0 }}>{selectedProduct.title || selectedProduct.asset?.name || 'Product'}</h3>
            <div style={{ color: '#8a8a9a', fontSize: 14, marginBottom: 16 }}>
              <div>{t('metal')}: {selectedProduct.asset?.metalType || '—'}</div>
              <div>{t('karat')}: {selectedProduct.asset?.karat || '—'}</div>
              <div>{t('weight')}: {selectedProduct.asset?.weightGross || '—'}g</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#c6a969', marginTop: 8 }}>{fmtMoney(selectedProduct.pricing?.finalPrice || selectedProduct.pricing?.basePrice || 0, selectedProduct.pricing?.currency || currency)}</div>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextField
                placeholder={t('name')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <TextField
                placeholder={t('email')}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <TextField
                placeholder={t('message')}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
              />
              <GoldButton type="submit" disabled={submitting} style={{ padding: '12px' }}>
                {submitting ? t('sending') : t('send')}
              </GoldButton>
              {submitResult && (
                <div style={{ padding: 12, borderRadius: 8, background: submitResult.ok ? 'rgba(60,185,126,0.1)' : 'rgba(220,53,69,0.1)', border: `1px solid ${submitResult.ok ? '#3cb97e' : '#dc3545'}`, color: submitResult.ok ? '#3cb97e' : '#dc3545', fontSize: 13 }}>
                  {submitResult.message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default PublicLandingPage;