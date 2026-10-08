import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';

type Language = 'AR' | 'FR' | 'EN';
type Currency = 'DZD' | 'EUR' | 'USD';

interface MarketplacePageProps {
  language: Language;
  currency: Currency;
}

interface MarketplaceItem {
  listingId: string;
  title: string;
  description: string;
  asset: {
    goldId: string;
    serialNumber: string;
    metalType: string;
    karat: number;
    weightGross: string;
    weightNet: string;
    purity: string;
    productType: string;
    name: string;
  };
  seller: {
    name: string;
    entityType: string;
    country: string;
  };
  pricing: {
    basePrice: string;
    metalValue: string;
    manufacturingValue: string;
    certificationValue: string;
    insuranceValue: string;
    logisticsValue: string;
    marketplaceFee: string;
    taxAmount: string;
    finalPrice: string;
    currency: string;
    referenceGoldPricePerGram: string | null;
  };
  listingType: string;
  visibility: string;
  condition: string;
  authenticityGuaranteed: boolean;
  stats: { views: number; favorites: number; inquiries: number };
  status: string;
  listedAt: string | null;
  expiresAt: string | null;
}

const t: Record<Language, Record<string, string>> = {
  AR: {
    title: 'السوق',
    subtitle: 'تصفح وشراء أصول ذهبية ومعادن ثمينة موثقة',
    search: 'بحث في السوق...',
    filterMetal: 'filter by Metal',
    filterType: 'filter by Type',
    all: 'الكل',
    price: 'السعر',
    seller: 'البائع',
    condition: 'الحالة',
    listed: 'تاريخ النشر',
    views: 'المشاهدات',
    favorites: 'المفضلة',
    inquiries: 'الاستفسارات',
    noItems: 'لا توجد عناصر في السوق',
    new: 'جديد',
    likeNew: 'كالجديد',
    excellent: 'ممتاز',
    good: 'جيد',
    fair: 'مقبول',
    used: 'مستعمل',
    fixedPrice: 'سعر ثابت',
    auction: 'مزاد',
    negotiable: 'قابل للتفاوض',
    viewDetails: 'عرض التفاصيل',
    priceBreakdown: 'تفصيل السعر',
    metalValue: 'قيمة المعدن',
    manufacturing: 'التصنيع',
    certification: 'الشهادة',
    insurance: 'التأمين',
    logistics: 'الشحن',
    fee: 'رسوم المنصة',
    tax: 'الضرائب',
    finalPrice: 'السعر النهائي',
    authenticity: 'أصالة مضمونة',
    page: 'صفحة',
    of: 'من',
    previous: 'السابق',
    next: 'التالي',
    total: 'الإجمالي',
    item: 'عنصر',
    product: 'المنتج',
    close: 'إغلاق',
    currency: 'العملة',
  },
  FR: {
    title: 'Marketplace',
    subtitle: 'Parcourez et achetez des actifs dorés et métaux précieux certifiés',
    search: 'Rechercher sur le marketplace...',
    filterMetal: 'Filtrer par Métal',
    filterType: 'Filtrer par Type',
    all: 'Tous',
    price: 'Prix',
    seller: 'Vendeur',
    condition: 'État',
    listed: 'Date de publication',
    views: 'Vues',
    favorites: 'Favoris',
    inquiries: 'Demandes',
    noItems: 'Aucun élément sur le marketplace',
    new: 'Neuf',
    likeNew: 'Comme neuf',
    excellent: 'Excellent',
    good: 'Bon',
    fair: 'Acceptable',
    used: 'Utilisé',
    fixedPrice: 'Prix fixe',
    auction: 'Enchère',
    negotiable: 'Négociable',
    viewDetails: 'Voir les détails',
    priceBreakdown: 'Détail du prix',
    metalValue: 'Valeur du métal',
    manufacturing: 'Fabrication',
    certification: 'Certification',
    insurance: 'Assurance',
    logistics: 'Logistique',
    fee: 'Frais de plateforme',
    tax: 'Taxes',
    finalPrice: 'Prix final',
    authenticity: 'Authenticité garantie',
    page: 'Page',
    of: 'sur',
    previous: 'Précédent',
    next: 'Suivant',
    total: 'Total',
    item: 'élément',
    product: 'Produit',
    close: 'Fermer',
    currency: 'Devise',
  },
  EN: {
    title: 'Marketplace',
    subtitle: 'Browse and buy certified gold assets and precious metals',
    search: 'Search marketplace...',
    filterMetal: 'Filter by Metal',
    filterType: 'Filter by Type',
    all: 'All',
    price: 'Price',
    seller: 'Seller',
    condition: 'Condition',
    listed: 'Listed',
    views: 'Views',
    favorites: 'Favorites',
    inquiries: 'Inquiries',
    noItems: 'No items in marketplace',
    new: 'New',
    likeNew: 'Like New',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    used: 'Used',
    fixedPrice: 'Fixed Price',
    auction: 'Auction',
    negotiable: 'Negotiable',
    viewDetails: 'View Details',
    priceBreakdown: 'Price Breakdown',
    metalValue: 'Metal Value',
    manufacturing: 'Manufacturing',
    certification: 'Certification',
    insurance: 'Insurance',
    logistics: 'Logistics',
    fee: 'Marketplace Fee',
    tax: 'Tax',
    finalPrice: 'Final Price',
    authenticity: 'Authenticity Guaranteed',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    total: 'Total',
    item: 'item',
    product: 'Product',
    close: 'Close',
    currency: 'Currency',
  },
};

const conditionColors: Record<string, string> = {
  NEW: 'var(--color-success)',
  LIKE_NEW: 'var(--color-success)',
  EXCELLENT: 'var(--color-gold-400)',
  GOOD: 'var(--color-info)',
  FAIR: 'var(--color-warning)',
  USED: 'var(--color-primary-300)',
};

const MarketplacePage: React.FC<MarketplacePageProps> = ({ language, currency }) => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [filterMetal, setFilterMetal] = useState('');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        lang: language,
        currency: currency,
      });
      if (search) params.set('search', search);
      if (filterMetal) params.set('metalType', filterMetal);

      const res = await apiFetch(`/api/v1/marketplace?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
        setTotalItems(data.data.pagination.totalItems);
      }
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, filterMetal, language, currency]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const tx = t[language];

  const formatPrice = (price: string, curr: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return price;
    return new Intl.NumberFormat(language === 'AR' ? 'ar-DZ' : language === 'FR' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
    }).format(num);
  };

  if (selectedItem) {
    return (
      <div style={{ padding: 'var(--space-xl)' }}>
        <button className="gold-btn gold-btn--ghost" onClick={() => setSelectedItem(null)}>
          ← {tx.close}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)', marginTop: 'var(--space-lg)' }}>
          {/* Product info */}
          <div>
            <div className="gold-card" style={{ marginBottom: 'var(--space-lg)' }}>
              <h2 style={{ color: 'var(--color-gold-400)', fontSize: '1.4rem', marginBottom: 'var(--space-md)' }}>
                {selectedItem.asset.name || selectedItem.title}
              </h2>
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
                <span className="gold-badge gold-badge--gold">{selectedItem.asset.metalType} {selectedItem.asset.karat}K</span>
                <span className="gold-badge" style={{ backgroundColor: (conditionColors[selectedItem.condition] || 'var(--color-info)') + '22', color: conditionColors[selectedItem.condition] || 'var(--color-info)' }}>
                  {tx[selectedItem.condition.toLowerCase() as keyof typeof tx] || selectedItem.condition}
                </span>
                <span className="gold-badge gold-badge--info">{selectedItem.listingType}</span>
                {selectedItem.authenticityGuaranteed && (
                  <span className="gold-badge gold-badge--success">✓ {tx.authenticity}</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)' }}>
                <div className="gold-detail-item">
                  <div className="gold-detail-item__label">{tx.product}</div>
                  <div className="gold-detail-item__value">{selectedItem.asset.productType}</div>
                </div>
                <div className="gold-detail-item">
                  <div className="gold-detail-item__label">{tx.views}</div>
                  <div className="gold-detail-item__value">{selectedItem.asset.weightGross}g</div>
                </div>
                <div className="gold-detail-item">
                  <div className="gold-detail-item__label">{tx.condition}</div>
                  <div className="gold-detail-item__value">{selectedItem.asset.purity}%</div>
                </div>
                <div className="gold-detail-item">
                  <div className="gold-detail-item__label">{tx.goldId}</div>
                  <div className="gold-detail-item__value" style={{ fontFamily: 'var(--font-mono)' }}>{selectedItem.asset.goldId}</div>
                </div>
              </div>
            </div>

            {/* Seller info */}
            <div className="gold-card">
              <h3 style={{ color: 'var(--color-gold-400)', marginBottom: 'var(--space-md)' }}>{tx.seller}</h3>
              <p style={{ color: 'var(--color-primary-100)', fontWeight: 600 }}>{selectedItem.seller.name}</p>
              <p style={{ color: 'var(--color-primary-300)', fontSize: '0.85rem' }}>{selectedItem.seller.entityType} — {selectedItem.seller.country}</p>
            </div>
          </div>

          {/* Price panel */}
          <div>
            <div className="gold-card gold-card--highlighted" style={{ position: 'sticky', top: '100px' }}>
              <h3 style={{ color: 'var(--color-gold-400)', marginBottom: 'var(--space-lg)' }}>{tx.priceBreakdown}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {[
                  { label: tx.metalValue, value: selectedItem.pricing.metalValue },
                  { label: tx.manufacturing, value: selectedItem.pricing.manufacturingValue },
                  { label: tx.certification, value: selectedItem.pricing.certificationValue },
                  { label: tx.insurance, value: selectedItem.pricing.insuranceValue },
                  { label: tx.logistics, value: selectedItem.pricing.logisticsValue },
                  { label: tx.fee, value: selectedItem.pricing.marketplaceFee },
                  { label: tx.tax, value: selectedItem.pricing.taxAmount },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-primary-600)' }}>
                    <span style={{ color: 'var(--color-primary-300)', fontSize: '0.85rem' }}>{row.label}</span>
                    <span style={{ color: 'var(--color-primary-100)', fontSize: '0.85rem' }}>{formatPrice(row.value, selectedItem.pricing.currency)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '2px solid var(--color-gold-500)', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-gold-400)', fontWeight: 700, fontSize: '1.1rem' }}>{tx.finalPrice}</span>
                <span style={{ color: 'var(--color-gold-400)', fontWeight: 700, fontSize: '1.3rem' }}>
                  {formatPrice(selectedItem.pricing.finalPrice, selectedItem.pricing.currency)}
                </span>
              </div>
              {selectedItem.pricing.referenceGoldPricePerGram && (
                <p style={{ color: 'var(--color-primary-400)', fontSize: '0.75rem', marginTop: 'var(--space-sm)', textAlign: 'center' }}>
                  Gold ref: {formatPrice(selectedItem.pricing.referenceGoldPricePerGram, selectedItem.pricing.currency)}/g
                </p>
              )}

              <button className="gold-btn gold-btn--primary gold-btn--full" style={{ marginTop: 'var(--space-lg)' }}>
                {language === 'AR' ? 'شراء الآن' : language === 'FR' ? 'Acheter maintenant' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <h1 style={{ color: 'var(--color-gold-400)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>{tx.title}</h1>
      <p style={{ color: 'var(--color-primary-200)', marginBottom: 'var(--space-xl)' }}>{tx.subtitle}</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <input
          className="gold-input"
          placeholder={tx.search}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: '250px' }}
        />
        <select className="gold-select" value={filterMetal} onChange={(e) => { setFilterMetal(e.target.value); setPage(1); }} style={{ width: 'auto', minWidth: '150px' }}>
          <option value="">{tx.filterMetal}</option>
          <option value="GOLD">GOLD</option>
          <option value="SILVER">SILVER</option>
          <option value="PLATINUM">PLATINUM</option>
          <option value="PALLADIUM">PALLADIUM</option>
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-lg)', color: 'var(--color-primary-300)', fontSize: '0.85rem' }}>
        <span>{tx.total}: <strong style={{ color: 'var(--color-gold-400)' }}>{totalItems}</strong> {tx.item}</span>
        <span>{tx.page} {page} {tx.of} {totalPages}</span>
      </div>

      {loading && <div className="gold-spinner" style={{ margin: 'var(--space-3xl) auto' }} />}

      {!loading && items.length === 0 && (
        <p style={{ color: 'var(--color-primary-300)', textAlign: 'center', padding: 'var(--space-3xl)' }}>{tx.noItems}</p>
      )}

      {!loading && items.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
            {items.map((item) => (
              <div
                key={item.listingId}
                className="gold-card"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                onClick={() => setSelectedItem(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                  <span className="gold-badge gold-badge--gold">{item.asset.metalType} {item.asset.karat}K</span>
                  <span className="gold-badge" style={{ backgroundColor: (conditionColors[item.condition] || 'var(--color-info)') + '22', color: conditionColors[item.condition] || 'var(--color-info)' }}>
                    {tx[item.condition.toLowerCase() as keyof typeof tx] || item.condition}
                  </span>
                </div>

                <h3 style={{ color: 'var(--color-primary-100)', fontSize: '1rem', marginBottom: 'var(--space-sm)' }}>
                  {item.asset.name || item.title}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--color-primary-400)' }}>Weight: <span style={{ color: 'var(--color-primary-100)' }}>{item.asset.weightGross}g</span></span>
                  <span style={{ color: 'var(--color-primary-400)' }}>Purity: <span style={{ color: 'var(--color-primary-100)' }}>{item.asset.purity}%</span></span>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-primary-600)', paddingTop: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-gold-400)', fontSize: '1.2rem', fontWeight: 700 }}>
                      {formatPrice(item.pricing.finalPrice, item.pricing.currency)}
                    </span>
                    <span className="gold-badge gold-badge--info" style={{ fontSize: '0.7rem' }}>{item.listingType}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-sm)', fontSize: '0.75rem', color: 'var(--color-primary-400)' }}>
                    <span>{tx.seller}: {item.seller.name}</span>
                    <span>👁 {item.stats.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)' }}>
            <button className="gold-btn gold-btn--ghost gold-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← {tx.previous}
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} className={`gold-btn gold-btn--sm ${p === page ? 'gold-btn--primary' : 'gold-btn--ghost'}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              );
            })}
            <button className="gold-btn gold-btn--ghost gold-btn--sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              {tx.next} →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MarketplacePage;
