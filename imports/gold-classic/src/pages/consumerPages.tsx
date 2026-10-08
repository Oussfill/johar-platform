import React, { useState, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  PageShell, useFetch, StatCard, Card, DataTable, Td, Badge, Loading,
  ErrorBox, Empty, GoldButton, TextField, fmtMoney, fmtNum, fmtDate,
  fmtDateTime, normalizeNumber,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';
import { default as OwnershipDashboard } from '../components/OwnershipDashboard';
import { default as PublicVerificationUI } from '../components/PublicVerificationUI';

/* ───────── translations ───────── */

const T: Record<Language, Record<string, string>> = {
  EN: {
    // MarketplaceDetailPage
    marketplaceTitle: 'Marketplace',
    marketplaceSubtitle: 'Browse verified gold listings',
    marketplaceEmpty: 'No listings available yet.',
    'ownNow': 'Own Now',
    'priceBreakdown': 'FINAL PRICE = METAL + MANUFACTURING + CERTIFICATION + INSURANCE + LOGISTICS + FEE + TAXES',
    'seller': 'Seller',
    'karat': 'Karat',
    'metal': 'Metal',
    'weight': 'Weight',
    'price': 'Price',
    'listedAt': 'Listed',

    // MyAssetsPage
    assetsTitle: 'My Assets',
    assetsSubtitle: 'All your registered assets',
    assetsEmpty: 'No assets found.',
    totalAssets: 'Total Assets',
    activeAssets: 'Active Assets',
    goldItems: 'Gold Items',
    silverItems: 'Silver Items',
    colGoldId: 'Gold ID',
    colSerial: 'Serial',
    colMetal: 'Metal',
    colKarat: 'Karat',
    colGrossWeight: 'Gross Weight',
    colNetWeight: 'Net Weight',
    colPurity: 'Purity',
    colStatus: 'Status',
    colNfc: 'NFC',
    colCreated: 'Created',

    // MyOrdersPage
    ordersTitle: 'My Orders',
    ordersSubtitle: 'Track your ownership processes',
    ordersEmpty: 'No orders found.',
    colProcessId: 'Process ID',
    colAssetId: 'Asset Gold ID',
    colSalePrice: 'Sale Price',
    colCurrentStep: 'Current Step',

    // OwnershipActivatePage
    ownershipTitle: 'Activate Ownership',
    ownershipSubtitle: 'Manage asset ownership transfers',

    // VerifyPage
    verifyTitle: 'Public Verification',
    verifySubtitle: 'Verify an asset by passport ID',
    verifyPlaceholder: 'Enter digital passport ID',
    verifyButton: 'Verify',
    verifyHint: 'Enter a valid digital passport ID above and click Verify to view the full asset verification details. Try DP-2024-001.',

    // AiAssistantPage
    aiTitle: 'AI Assistant',
    aiSubtitle: 'Chat with the JOHAR platform assistant',

    // generic
    grA: 'Gold',
    grS: 'Silver',
  },
  AR: {
    marketplaceTitle: 'السوق',
    marketplaceSubtitle: 'تصفح قوائم الذهب المعتمدة',
    marketplaceEmpty: 'لا توجد قوائم متاحة بعد.',
    'ownNow': 'استلم الآن',
    'priceBreakdown': 'السعر النهائي = المعادن + التصنيع + الشهادة + التأمين + اللوجستيات + الرسوم + الضرائب',
    'seller': 'البائع',
    'karat': 'القيراط',
    'metal': 'المعدن',
    'weight': 'الوزن',
    'price': 'السعر',
    'listedAt': 'تاريخ الإدراج',

    assetsTitle: 'أصولي',
    assetsSubtitle: 'جميع أصولك المسجلة',
    assetsEmpty: 'لم يتم العثور على أصول.',
    totalAssets: 'إجمالي الأصول',
    activeAssets: 'الأصول النشطة',
    goldItems: 'عناصر ذهب',
    silverItems: 'عناصر فضة',
    colGoldId: 'رقم الذهب',
    colSerial: 'التسلسلي',
    colMetal: 'المعدن',
    colKarat: 'القيراط',
    colGrossWeight: 'الوزن الإجمالي',
    colNetWeight: 'الوزن الصافي',
    colPurity: 'النقاء',
    colStatus: 'الحالة',
    colNfc: 'NFC',
    colCreated: 'تاريخ الإنشاء',

    ordersTitle: 'طلباتي',
    ordersSubtitle: 'تتبع عمليات الملكية',
    ordersEmpty: 'لم يتم العثور على طلبات.',
    colProcessId: 'رقم العملية',
    colAssetId: 'رقم الذهب',
    colSalePrice: 'سعر البيع',
    colCurrentStep: 'الخطوة الحالية',

    ownershipTitle: 'تفعيل الملكية',
    ownershipSubtitle: 'إدارة تحويلات ملكية الأصول',

    verifyTitle: 'التحقق العام',
    verifySubtitle: 'تحقق من الأصل برقم الجواز الرقمي',
    verifyPlaceholder: 'أدخل رقم الجواز الرقمي',
    verifyButton: 'تحقق',
    verifyHint: 'الرجاء إدخال رقم الجواز الرقمي أعلاه ثم انقر على تحقق لعرض تفاصيل التحقق الكاملة. جرب DP-2024-001.',

    aiTitle: 'مساعد الذكاء الاصطناعي',
    aiSubtitle: 'تحدث مع مساعد منصة جوهر',

    grA: 'ذهب',
    grS: 'فضة',
  },
  FR: {
    marketplaceTitle: 'Marketplace',
    marketplaceSubtitle: 'Parcourez les annonces d\'or vérifiées',
    marketplaceEmpty: 'Aucune annonce disponible.',
    'ownNow': 'Acquérir',
    'priceBreakdown': 'PRIX FINAL = MÉTAL + FABRICATION + CERTIFICATION + ASSURANCE + LOGISTIQUE + FRAIS + TAXES',
    'seller': 'Vendeur',
    'karat': 'Karat',
    'metal': 'Métal',
    'weight': 'Poids',
    'price': 'Prix',
    'listedAt': 'Publié',

    assetsTitle: 'Mes Actifs',
    assetsSubtitle: 'Tous vos actifs enregistrés',
    assetsEmpty: 'Aucun actif trouvé.',
    totalAssets: 'Total des Actifs',
    activeAssets: 'Actifs Actifs',
    goldItems: 'Articles Or',
    silverItems: 'Articles Argent',
    colGoldId: 'ID Or',
    colSerial: 'Série',
    colMetal: 'Métal',
    colKarat: 'Karat',
    colGrossWeight: 'Poids Brut',
    colNetWeight: 'Poids Net',
    colPurity: 'Pureté',
    colStatus: 'Statut',
    colNfc: 'NFC',
    colCreated: 'Créé',

    ordersTitle: 'Mes Commandes',
    ordersSubtitle: 'Suivez vos processus de propriété',
    ordersEmpty: 'Aucune commande trouvée.',
    colProcessId: 'ID Processus',
    colAssetId: 'ID Or',
    colSalePrice: 'Prix de Vente',
    colCurrentStep: 'Étape Actuelle',

    ownershipTitle: 'Activer la Propriété',
    ownershipSubtitle: 'Gérer les transferts de propriété',

    verifyTitle: 'Vérification Publique',
    verifySubtitle: 'Vérifier un actif par numéro de passeport',
    verifyPlaceholder: 'Entrez le numéro de passeport numérique',
    verifyButton: 'Vérifier',
    verifyHint: 'Entrez un numéro de passeport numérique valide ci-dessus puis cliquez sur Vérifier pour afficher les détails de vérification complets. Essayez DP-2024-001.',

    aiTitle: 'Assistant IA',
    aiSubtitle: 'Discutez avec l\'assistant de la plateforme JOHAR',

    grA: 'Or',
    grS: 'Argent',
  },
};

const makeT = (lang: Language) => (key: string): string => {
  const rec = T[lang];
  return (rec && rec[key]) || T.EN[key] || key;
};

/* ───────── 1. MarketplaceDetailPage ───────── */

export const MarketplaceDetailPage: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  const t = makeT(language);
  const { data: listings, loading, error } = useFetch<any[]>('/api/v1/marketplace');

  return (
    <PageShell title={t('marketplaceTitle')} subtitle={t('marketplaceSubtitle')} icon="🛒" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={String(error)} />}
      {!loading && !error && (!listings || listings.length === 0) && <Empty text={t('marketplaceEmpty')} />}
      {!loading && !error && listings && listings.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {listings.map((item: any, idx: number) => (
            <Card key={item.id ?? idx}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#c6a969', fontSize: 18, fontWeight: 700 }}>{item.name}</div>
                <div style={{ color: '#8a8a9a', fontSize: 13, marginTop: 4 }}>
                  {item.seller && <span>{t('seller')}: {item.seller} &nbsp;|&nbsp; </span>}
                  <span>{t('metal')}: {item.metalType} &nbsp;|&nbsp; {t('karat')}: {item.karat}</span>
                </div>
                <div style={{ color: '#8a8a9a', fontSize: 13, marginTop: 2 }}>
                  <span>{t('weight')}: {normalizeNumber(item.weightGross)} g &nbsp;|&nbsp; {t('listedAt')}: {fmtDateTime(item.createdAt, language)}</span>
                </div>
              </div>
              <div style={{ background: 'rgba(198,169,105,0.08)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#8a8a9a', marginBottom: 4 }}>{t('priceBreakdown')}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#c6a969' }}>
                  <span dir="auto">{fmtMoney(item.price, item.currency ?? currency)}</span>
                </div>
              </div>
              <GoldButton onClick={() => alert(`${t('ownNow')}: ${item.name}`)}>
                {t('ownNow')}
              </GoldButton>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
};

/* ───────── 2. MyAssetsPage ───────── */

export const MyAssetsPage: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  const t = makeT(language);
  const { data: assets, loading, error } = useFetch<any[]>('/api/v1/assets');

  const total = assets?.length ?? 0;
  const active = assets?.filter((a: any) => a.status === 'ACTIVE').length ?? 0;
  const goldCount = assets?.filter((a: any) => a.metalType?.toUpperCase().includes('GOLD')).length ?? 0;
  const silverCount = assets?.filter((a: any) => a.metalType?.toUpperCase().includes('SILVER')).length ?? 0;

  return (
    <PageShell title={t('assetsTitle')} subtitle={t('assetsSubtitle')} icon="🪙" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={String(error)} />}
      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label={t('totalAssets')} value={fmtNum(total)} icon="📦" />
            <StatCard label={t('activeAssets')} value={fmtNum(active)} icon="✅" />
            <StatCard label={t('goldItems')} value={fmtNum(goldCount)} icon="🥇" />
            <StatCard label={t('silverItems')} value={fmtNum(silverCount)} icon="🥈" />
          </div>
          {!assets || assets.length === 0 ? (
            <Empty text={t('assetsEmpty')} />
          ) : (
            <DataTable
              columns={[
                t('colGoldId'), t('colSerial'), t('colMetal'), t('colKarat'),
                t('colGrossWeight'), t('colNetWeight'), t('colPurity'),
                t('colStatus'), t('colNfc'), t('colCreated'),
              ]}
            >
              {assets.map((a: any, idx: number) => (
                <tr key={a.id ?? idx}>
                  <Td>{a.goldId ?? a.id}</Td>
                  <Td>{a.serialNumber ?? '-'}</Td>
                  <Td>{a.metalType}</Td>
                  <Td>{a.karat}</Td>
                  <Td>{normalizeNumber(a.weightGross)} g</Td>
                  <Td>{normalizeNumber(a.weightNet)} g</Td>
                  <Td>{normalizeNumber(a.purity)}%</Td>
                  <Td><Badge value={a.status} /></Td>
                  <Td><Badge value={a.nfcAvailable ? 'YES' : 'NO'} /></Td>
                  <Td>{fmtDate(a.createdAt, language)}</Td>
                </tr>
              ))}
            </DataTable>
          )}
        </>
      )}
    </PageShell>
  );
};

/* ───────── 3. MyOrdersPage ───────── */

export const MyOrdersPage: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  const t = makeT(language);
  const { data: processes, loading, error } = useFetch<any[]>('/api/v1/ownership/my-processes');

  const shortId = (id: string) => (id && id.length > 12 ? id.slice(0, 8) + '...' : id);

  return (
    <PageShell title={t('ordersTitle')} subtitle={t('ordersSubtitle')} icon="📋" language={language}>
      {loading && <Loading />}
      {error && <ErrorBox message={String(error)} />}
      {!loading && !error && (
        <>
          {!processes || processes.length === 0 ? (
            <Empty text={t('ordersEmpty')} />
          ) : (
            <DataTable
              columns={[t('colProcessId'), t('colAssetId'), t('colSalePrice'), t('colStatus'), t('colCurrentStep'), t('colCreated')]}
            >
              {processes.map((p: any, idx: number) => {
                const current = p.currentStep ?? 0;
                const totalSteps = 4;
                return (
                  <tr key={p.processId ?? idx}>
                    <Td>{shortId(p.processId ?? p.id ?? '')}</Td>
                    <Td>{p.assetGoldId ?? p.goldId ?? '-'}</Td>
                    <Td><span dir="auto">{fmtMoney(p.salePrice ?? p.price, currency)}</span></Td>
                    <Td><Badge value={p.status} /></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {Array.from({ length: totalSteps }).map((_, stepIdx) => (
                          <div
                            key={stepIdx}
                            title={`Step ${stepIdx + 1}`}
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: stepIdx <= current ? '#c6a969' : 'rgba(138,138,154,0.3)',
                              border: stepIdx === current ? '2px solid #fff' : 'none',
                            }}
                          />
                        ))}
                        <span style={{ color: '#8a8a9a', fontSize: 12, marginLeft: 4 }}>{current}/{totalSteps}</span>
                      </div>
                    </Td>
                    <Td>{fmtDate(p.createdAt, language)}</Td>
                  </tr>
                );
              })}
            </DataTable>
          )}
        </>
      )}
    </PageShell>
  );
};

/* ───────── 4. OwnershipActivatePage ───────── */

export const OwnershipActivatePage: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  return <OwnershipDashboard language={language} currency={currency} />;
};

/* ───────── 5. VerifyPage ───────── */

export const VerifyPage: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  const t = makeT(language);
  const [passportId, setPassportId] = useState('DP-2024-001');
  const [verified, setVerified] = useState(false);

  const handleVerify = useCallback(() => {
    if (passportId.trim().length > 0) {
      setVerified(true);
    }
  }, [passportId]);

  return (
    <PageShell title={t('verifyTitle')} subtitle={t('verifySubtitle')} icon="🔍" language={language}>
      <Card>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <TextField
              value={passportId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPassportId(e.target.value);
                setVerified(false);
              }}
              placeholder={t('verifyPlaceholder')}
            />
          </div>
          <GoldButton onClick={handleVerify}>{t('verifyButton')}</GoldButton>
        </div>

        {verified && passportId.trim().length > 0 && (
          <PublicVerificationUI passportId={passportId} language={language} currency={currency} />
        )}

        {!verified && (
          <p style={{ color: '#8a8a9a', fontSize: 14, lineHeight: 1.6 }}>
            {t('verifyHint')}
          </p>
        )}
      </Card>
    </PageShell>
  );
};

/* ───────── 6. AiAssistantPage ───────── */

const AIAssistantChatUI = React.lazy(() =>
  import('../components/AIAssistantChatUI').then((m) => ({ default: m.AIAssistantChatUI }))
);

export const AiAssistantPage: React.FC<{ language: Language; currency: Currency }> = ({ language, currency }) => {
  const t = makeT(language);

  return (
    <PageShell title={t('aiTitle')} subtitle={t('aiSubtitle')} icon="🤖" language={language}>
      <React.Suspense fallback={<Loading />}>
        <AIAssistantChatUI language={language} />
      </React.Suspense>
    </PageShell>
  );
};

/* ───────── exports ───────── */

export {};