// ============================================================================
// GOLD PLATFORM — PUBLIC VERIFICATION UI COMPONENT
// ============================================================================
// شاشة التحقق الشاملة (VERIFY PRECIOUS METAL)
// لعرض تفاصيل الجواز الرقمي عند مسح الـ NFC/QR
//
// الهوية البصرية: Deep Graphite + Precious Gold + Success Green
// تُعرض بالعربية عند اللغة AR

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Language = 'AR' | 'FR' | 'EN';
type Currency = 'DZD' | 'EUR' | 'USD';

interface VerificationData {
  verification: {
    status: 'VERIFIED' | 'NOT_VERIFIED' | 'REVOKED';
    goldId: string;
    passportNumber: string;
    digitalSignature: string;
  };
  asset: {
    name: string;
    goldId: string;
    serialNumber: string;
    metalType: string;
    karat: number;
    weightGross: number;
    weightNet: number;
    measuredPurity: number;
    productType: string;
  };
  assay: {
    totalAssays: number;
    lastAssayDate: string;
    certifiedPurity: number;
    certifiedKarat: number;
    recentResults: Array<{
      reportNumber: string;
      purity: number;
      karat: number;
      lab: string;
      date: string;
    }>;
  };
  chainOfCustody: {
    totalEvents: number;
    history: Array<{
      from: string;
      to: string;
      date: string;
      type: string;
    }>;
  };
  custody: {
    status: string;
    warehouse: string;
  };
  digitalIdentity: {
    goldId: string;
    isActive: boolean;
    isLocked: boolean;
    hashChainLength: number;
  };
  disclaimer: string;
}

interface PublicVerificationUIProps {
  passportId: string;
  language: Language;
  currency: Currency;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const T: Record<string, Record<Language, string>> = {
  title: { AR: 'تحقق من الأصالة', FR: "Vérification d'Authenticité", EN: 'Authenticity Verification' },
  subtitle: { AR: 'مسح رمز NFC أو QR للتحقق', FR: 'Scannez le code NFC ou QR pour vérifier', EN: 'Scan NFC or QR code to verify' },
  verified: { AR: 'تم التحقق — أصلية مضمونة', FR: 'Vérifié — Authenticité Garantie', EN: 'Verified — Authenticity Guaranteed' },
  not_verified: { AR: 'لم يتم التحقق', FR: 'Non Vérifié', EN: 'Not Verified' },
  revoked: { AR: 'تم إلغاء الجواز', FR: 'Passeport Annulé', EN: 'Passport Revoked' },
  asset_details: { AR: 'تفاصيل الأصل', FR: "Détails de l'actif", EN: 'Asset Details' },
  gold_id: { AR: 'المعرّف الذهبي', FR: 'ID Or', EN: 'Gold ID' },
  serial: { AR: 'الرقم التسلسلي', FR: 'Numéro de série', EN: 'Serial Number' },
  metal: { AR: 'نوع المعدن', FR: 'Type de métal', EN: 'Metal Type' },
  weight_gross: { AR: 'الوزن الإجمالي', FR: 'Poids brut', EN: 'Gross Weight' },
  weight_net: { AR: 'الوزن الصافي', FR: 'Poids net', EN: 'Net Weight' },
  purity: { AR: 'النقاوة', FR: 'Pureté', EN: 'Purity' },
  karat: { AR: 'القدر', FR: 'Carat', EN: 'Karat' },
  product_type: { AR: 'نوع المنتج', FR: 'Type de produit', EN: 'Product Type' },
  assay_status: { AR: 'حالة الفحص', FR: "Statut de l'analyse", EN: 'Assay Status' },
  total_assays: { AR: 'عدد الفحوصات', FR: "Nombre d'analyses", EN: 'Total Assays' },
  certified_purity: { AR: 'النقاوة المعتمدة', FR: 'Pureté certifiée', EN: 'Certified Purity' },
  lab_results: { AR: 'نتائج المختبرات', FR: 'Résultats de laboratoire', EN: 'Lab Results' },
  custody_history: { AR: 'سجل الحيازة', FR: 'Historique de possession', EN: 'Custody History' },
  total_events: { AR: 'عدد الأحداث', FR: "Nombre d'événements", EN: 'Total Events' },
  from: { AR: 'من', FR: 'De', EN: 'From' },
  to: { AR: 'إلى', FR: 'Vers', EN: 'To' },
  date: { AR: 'التاريخ', FR: 'Date', EN: 'Date' },
  custody_status: { AR: 'حالة الحيازة', FR: 'Statut de possession', EN: 'Custody Status' },
  warehouse: { AR: 'المخزن', FR: 'Entrepôt', EN: 'Warehouse' },
  digital_signature: { AR: 'التوقيع الرقمي', FR: 'Signature numérique', EN: 'Digital Signature' },
  hash_chain: { AR: 'سلسلة الهاشات', FR: 'Chaîne de hachage', EN: 'Hash Chain' },
  operations: { AR: 'العمليات المسجلة', FR: 'Opérations enregistrées', EN: 'Recorded Operations' },
  disclaimer: { AR: 'إخلاء المسؤولية', FR: 'Avertissement', EN: 'Disclaimer' },
  scan_prompt: { AR: 'امسح رمز NFC أو QR...', FR: 'Scannez le code NFC ou QR...', EN: 'Scan NFC or QR code...' },
  loading: { AR: 'جاري التحقق...', FR: 'Vérification en cours...', EN: 'Verifying...' },
  error: { AR: 'خطأ في التحقق', FR: 'Erreur de vérification', EN: 'Verification Error' },
  not_found: { AR: 'الجواز الرقمي غير موجود', FR: 'Passeport numérique introuvable', EN: 'Digital passport not found' },
};

// ============================================================================
// PUBLIC VERIFICATION UI COMPONENT
// ============================================================================

export const PublicVerificationUI: React.FC<PublicVerificationUIProps> = ({
  passportId,
  language,
  currency,
}) => {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'assay' | 'custody'>('details');

  const direction = language === 'AR' ? 'rtl' : 'ltr';

  // جلب بيانات التحقق
  const fetchVerificationData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/assets/verify/${passportId}?lang=${language}&currency=${currency}`,
        {
          headers: {
            'Accept-Language': language.toLowerCase(),
            'X-Currency': currency,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('NOT_FOUND');
        }
        throw new Error('FETCH_ERROR');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message === 'NOT_FOUND' ? 'NOT_FOUND' : 'FETCH_ERROR');
    } finally {
      setLoading(false);
    }
  }, [passportId, language, currency]);

  useEffect(() => {
    fetchVerificationData();
  }, [fetchVerificationData]);

  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="gold-verification" dir={direction}>
        <div className="gold-spinner" style={{ margin: '0 auto', width: 48, height: 48 }} />
        <p style={{ marginTop: 16, color: 'var(--color-primary-200)' }}>
          {T.loading[language]}
        </p>
      </div>
    );
  }

  // عرض الخطأ
  if (error || !data) {
    return (
      <div className="gold-verification" dir={direction}>
        <div
          className="gold-verification__icon"
          style={{ background: 'linear-gradient(135deg, var(--color-risk-red), #991b1b)' }}
        >
          ✕
        </div>
        <h2 className="gold-verification__title" style={{ color: 'var(--color-risk-red)' }}>
          {T.error[language]}
        </h2>
        <p className="gold-verification__subtitle">
          {error === 'NOT_FOUND' ? T.not_found[language] : T.error[language]}
        </p>
        <button className="gold-btn gold-btn--primary" onClick={fetchVerificationData}>
          {T.loading[language].replace('...', '')}
        </button>
      </div>
    );
  }

  const isVerified = data.verification.status === 'VERIFIED';

  return (
    <div className="gold-verification" dir={direction}>
      {/* أيقونة الحالة */}
      <div
        className="gold-verification__icon"
        style={{
          background: isVerified
            ? 'linear-gradient(135deg, var(--color-success), #16a34a)'
            : 'linear-gradient(135deg, var(--color-risk-red), #991b1b)',
        }}
      >
        {isVerified ? '✓' : '✕'}
      </div>

      {/* العنوان */}
      <h1 className="gold-verification__title">
        {isVerified ? T.verified[language] : T.not_verified[language]}
      </h1>
      <p className="gold-verification__subtitle">
        {T.subtitle[language]}
      </p>

      {/* شريط التبويب */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
        {(['details', 'assay', 'custody'] as const).map((tab) => (
          <button
            key={tab}
            className={`gold-btn gold-btn--sm ${
              activeTab === tab ? 'gold-btn--primary' : 'gold-btn--ghost'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'details'
              ? T.asset_details[language]
              : tab === 'assay'
              ? T.assay_status[language]
              : T.custody_history[language]}
          </button>
        ))}
      </div>

      {/* تفاصيل الأصل */}
      {activeTab === 'details' && (
        <div className="gold-card gold-card--highlighted" style={{ textAlign: 'left' }}>
          <div className="gold-card__header">
            <span className="gold-card__title">{T.asset_details[language]}</span>
            <span className="gold-badge gold-badge--gold">
              {data.asset.goldId}
            </span>
          </div>

          <div className="gold-verification__details">
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.gold_id[language]}</div>
              <div className="gold-detail-item__value">{data.asset.goldId}</div>
            </div>
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.serial[language]}</div>
              <div className="gold-detail-item__value" style={{ fontFamily: 'var(--font-mono)' }}>
                {data.asset.serialNumber}
              </div>
            </div>
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.metal[language]}</div>
              <div className="gold-detail-item__value">{data.asset.metalType}</div>
            </div>
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.karat[language]}</div>
              <div className="gold-detail-item__value">{data.asset.karat}K</div>
            </div>
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.weight_gross[language]}</div>
              <div className="gold-detail-item__value">{data.asset.weightGross}g</div>
            </div>
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.purity[language]}</div>
              <div className="gold-detail-item__value">{data.asset.measuredPurity}%</div>
            </div>
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.product_type[language]}</div>
              <div className="gold-detail-item__value">{data.asset.productType}</div>
            </div>
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.hash_chain[language]}</div>
              <div className="gold-detail-item__value">
                {data.digitalIdentity.hashChainLength} {T.operations[language]}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نتائج الفحص */}
      {activeTab === 'assay' && (
        <div className="gold-card gold-card--highlighted" style={{ textAlign: 'left' }}>
          <div className="gold-card__header">
            <span className="gold-card__title">{T.assay_status[language]}</span>
            <span className="gold-badge gold-badge--success">
              {T.total_assays[language]}: {data.assay.totalAssays}
            </span>
          </div>

          <div className="gold-verification__details">
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.certified_purity[language]}</div>
              <div className="gold-detail-item__value">{data.assay.certifiedPurity}%</div>
            </div>
            <div className="gold-detail-item">
              <div className="gold-detail-item__label">{T.karat[language]}</div>
              <div className="gold-detail-item__value">{data.assay.certifiedKarat}K</div>
            </div>
          </div>

          {data.assay.recentResults.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ color: 'var(--color-gold-400)', marginBottom: 12 }}>
                {T.lab_results[language]}
              </h4>
              <table className="gold-table">
                <thead>
                  <tr>
                    <th>{T.lab_results[language]}</th>
                    <th>{T.purity[language]}</th>
                    <th>{T.karat[language]}</th>
                    <th>{T.date[language]}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assay.recentResults.map((result, index) => (
                    <tr key={index}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{result.reportNumber}</td>
                      <td>{result.purity}%</td>
                      <td>{result.karat}K</td>
                      <td>{new Date(result.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* سلسلة الحيازة */}
      {activeTab === 'custody' && (
        <div className="gold-card gold-card--highlighted" style={{ textAlign: 'left' }}>
          <div className="gold-card__header">
            <span className="gold-card__title">{T.custody_history[language]}</span>
            <span className="gold-badge gold-badge--info">
              {T.total_events[language]}: {data.chainOfCustody.totalEvents}
            </span>
          </div>

          <div className="gold-timeline">
            {data.chainOfCustody.history.map((event, index) => (
              <div key={index} className="gold-timeline__item gold-timeline__item--completed">
                <div className="gold-timeline__dot" />
                <div className="gold-timeline__content">
                  <div className="gold-timeline__date">
                    {new Date(event.date).toLocaleString()}
                  </div>
                  <div className="gold-timeline__title">
                    {event.from} → {event.to}
                  </div>
                  <div className="gold-timeline__description">{event.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* إخلاء المسؤولية الخاص بالذكاء الاصطناعي */}
      <div className="gold-disclaimer">
        <span className="gold-disclaimer__icon">ℹ</span>
        <span className="gold-disclaimer__text">{data.disclaimer}</span>
      </div>
    </div>
  );
};

export default PublicVerificationUI;
