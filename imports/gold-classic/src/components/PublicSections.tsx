import React, { useState } from 'react';
import { Card, GoldButton, TextField, Loading } from './UiKit';
import type { Language } from './UiKit';

// ============================================================================
// PUBLIC & B2B SECTIONS — Exhibitors | Academy (Blog) | How it works / Buyer
// Program | FAQ | Contact | Newsletter
// ============================================================================

export type SectionId = 'home' | 'products' | 'services' | 'exhibitors' | 'academy' | 'how' | 'faq' | 'contact';

type T = (key: string) => string;

const CARD_BG = '#1a1a24';
const GOLD = '#c6a969';
const MUTED = '#8a8a9a';

function fmtDate(d: string | undefined, language: Language): string {
  if (!d) return '';
  const loc = language === 'AR' ? 'ar-JO' : language === 'FR' ? 'fr-FR' : 'en-GB';
  try {
    return new Date(d).toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d;
  }
}

// ============================================================================
// NEWSLETTER
// ============================================================================

export function NewsletterBox({ t, language }: { t: T; language: Language }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('busy');
    try {
      const res = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(language ? { 'X-Language': language } : {}),
        },
        body: JSON.stringify({ email, name }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('done');
        setEmail('');
        setName('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <Card style={{ background: CARD_BG, padding: 24 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: GOLD, marginBottom: 8 }}>{t('newsletterTitle')}</div>
      <div style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>{t('newsletterSub')}</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TextField
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          placeholder={t('name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <GoldButton type="submit" disabled={status === 'busy'} style={{ padding: '10px 18px' }}>
          {status === 'busy' ? t('sending') : t('newsletterCta')}
        </GoldButton>
        {status === 'done' && (
          <div style={{ color: '#3cb97e', fontSize: 13 }}>{t('newsletterDone')}</div>
        )}
        {status === 'error' && (
          <div style={{ color: '#dc3545', fontSize: 13 }}>{t('error')}</div>
        )}
      </form>
    </Card>
  );
}

// ============================================================================
// EXHIBITORS — DIRECTORY OF VERIFIED SELLERS
// ============================================================================

interface Exhibitor {
  id: string;
  entityCode: string;
  entityType: string;
  name: string;
  country?: string;
  city?: string;
  email?: string;
  verified: boolean;
  activeListings: number;
  memberSince?: string;
}

export function ExhibitorsSection({ t, language, onOpenBuyer }: { t: T; language: Language; onOpenBuyer: () => void }) {
  const { data, loading } = usePublic<Exhibitor[]>('/api/v1/exhibitors');
  const items = data || [];

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: GOLD, margin: 0 }}>{t('exhibitorsTitle')}</h2>
        <p style={{ color: MUTED, marginTop: 8 }}>{t('exhibitorsSub')}</p>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', color: MUTED, padding: 40 }}>{t('noResults')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {items.map((ex) => (
            <Card key={ex.id} style={{ background: CARD_BG, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{ex.name}</div>
                {ex.verified && (
                  <span style={{ fontSize: 11, color: '#3cb97e', border: '1px solid #3cb97e', borderRadius: 4, padding: '2px 6px' }}>
                    ✓ {t('verified')}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: MUTED }}>
                {[ex.country, ex.city].filter(Boolean).join(' — ') || '—'}
              </div>
              <div style={{ fontSize: 13, color: MUTED }}>
                {t('activeListings')}: <b style={{ color: '#e0d5c1' }}>{ex.activeListings}</b>
              </div>
              {ex.email && (
                <a href={`mailto:${ex.email}`} style={{ color: GOLD, fontSize: 13 }}>{ex.email}</a>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card style={{ background: CARD_BG, padding: 24, marginTop: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>{t('joinFairTitle')}</div>
        <p style={{ color: MUTED, fontSize: 14 }}>{t('joinFairSub')}</p>
        <GoldButton onClick={onOpenBuyer} style={{ padding: '10px 24px' }}>{t('bookStand')}</GoldButton>
      </Card>
    </div>
  );
}

function usePublic<T>(url: string) {
  const [data, setData] = React.useState<T | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(url, { headers: { 'X-Language': 'EN' } })
      .then((r) => r.json())
      .then((j) => {
        if (alive) setData(j.success ? j.data?.items ?? j.data : undefined);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [url]);
  return { data, loading };
}

// ============================================================================
// ACADEMY — ARTICLES / BLOG / WORKSHOPS
// ============================================================================

interface ArticleCard {
  id: string;
  slug: string;
  type: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
}

export function AcademySection({ t, language }: { t: T; language: Language }) {
  const { data, loading } = usePublic<ArticleCard[]>('/api/v1/articles?limit=12');
  const items = data || [];
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [article, setArticle] = useState<{ title: string; content: string; author?: string; publishedAt?: string; type: string } | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);

  const openArticle = async (slug: string) => {
    setOpenSlug(slug);
    setArticle(null);
    setArticleLoading(true);
    try {
      const res = await fetch(`/api/v1/articles/${slug}`, { headers: { 'X-Language': language } });
      const json = await res.json();
      if (json.success) setArticle(json.data);
    } catch {
      setArticle(null);
    } finally {
      setArticleLoading(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: GOLD, margin: 0 }}>{t('academyTitle')}</h2>
        <p style={{ color: MUTED, marginTop: 8 }}>{t('academySub')}</p>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', color: MUTED, padding: 40 }}>{t('noResults')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {items.map((a) => (
            <Card
              key={a.id}
              style={{ background: CARD_BG, padding: 20, cursor: 'pointer' }}
              onClick={() => openArticle(a.slug)}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#1a1a24', background: GOLD, borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>
                  {a.type}
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e0d5c1', marginBottom: 8 }}>{a.title}</div>
              {a.excerpt && <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>{a.excerpt}</div>}
              <div style={{ fontSize: 12, color: '#5a5a68', marginTop: 8 }}>
                {[a.author, fmtDate(a.publishedAt, language)].filter(Boolean).join(' • ')}
              </div>
            </Card>
          ))}
        </div>
      )}

      {openSlug && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
          onClick={() => setOpenSlug(null)}
        >
          <div
            style={{
              background: CARD_BG, borderRadius: 12, maxWidth: 720, width: '100%',
              maxHeight: '90vh', overflow: 'auto', padding: 28, position: 'relative',
              color: '#e0d5c1',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenSlug(null)}
              style={{ position: 'absolute', top: 12, right: 16, background: 'transparent', border: 'none', color: MUTED, fontSize: 24, cursor: 'pointer' }}
            >&times;</button>
            {articleLoading ? (
              <Loading />
            ) : article ? (
              <>
                <div style={{ fontSize: 12, color: GOLD, letterSpacing: 1 }}>{article.type} — {fmtDate(article.publishedAt, language)}</div>
                <h2 style={{ color: GOLD, margin: '8px 0 12px' }}>{article.title}</h2>
                {article.author && <div style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>{article.author}</div>}
                <div
                  style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </>
            ) : (
              <div style={{ color: MUTED, padding: 20 }}>{t('error')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HOW IT WORKS + BUYER PROGRAM REGISTRATION
// ============================================================================

const INTEREST_OPTIONS = ['GOLD_BULLION', 'JEWELLERY', 'INVESTMENT', 'WHOLESALE'];

export function HowSection({ t, language }: { t: T; language: Language }) {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', country: '', companyType: '' });
  const [interests, setInterests] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [1, 2, 3, 4];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/buyer-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Language': language },
        body: JSON.stringify({ ...form, interests, message }),
      });
      const json = await res.json();
      if (json.success) {
        setDone(true);
        setForm({ companyName: '', contactName: '', email: '', phone: '', country: '', companyType: '' });
        setInterests([]);
        setMessage('');
      } else {
        setError(json.error?.message || t('error'));
      }
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: GOLD, margin: 0 }}>{t('howTitle')}</h2>
        <p style={{ color: MUTED, marginTop: 8 }}>{t('howSub')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {steps.map((n) => (
          <Card key={n} style={{ background: CARD_BG, padding: 20 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: GOLD, marginBottom: 8 }}>{n}</div>
            <div style={{ fontWeight: 700, color: '#e0d5c1', marginBottom: 4 }}>{t(`howStep${n}Title`)}</div>
            <div style={{ fontSize: 13, color: MUTED }}>{t(`howStep${n}Desc`)}</div>
          </Card>
        ))}
      </div>

      <Card style={{ background: CARD_BG, padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: GOLD, marginBottom: 4 }}>{t('buyerProgramTitle')}</div>
        <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>{t('buyerProgramSub')}</p>

        {done ? (
          <div style={{ color: '#3cb97e', fontSize: 15 }}>{t('buyerProgramDone')}</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TextField
              placeholder={t('companyName')}
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
            <TextField
              placeholder={t('contactName')}
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              required
            />
            <TextField
              type="email"
              placeholder={t('email')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <TextField placeholder={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField placeholder={t('country')} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              <TextField placeholder={t('companyType')} value={form.companyType} onChange={(e) => setForm({ ...form, companyType: e.target.value })} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {INTEREST_OPTIONS.map((opt) => {
                const checked = interests.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setInterests(checked ? interests.filter((i) => i !== opt) : [...interests, opt])
                    }
                    style={{
                      background: checked ? GOLD : 'transparent',
                      color: checked ? '#1a1a24' : '#e0d5c1',
                      border: `1px solid ${checked ? GOLD : 'rgba(198,169,105,0.35)'}`,
                      borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    {t(`interest${opt}`)}
                  </button>
                );
              })}
            </div>
            <TextField placeholder={t('message')} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            <GoldButton type="submit" disabled={busy} style={{ padding: '12px' }}>
              {busy ? t('sending') : t('applyBuyerProgram')}
            </GoldButton>
            {error && <div style={{ color: '#dc3545', fontSize: 13 }}>{error}</div>}
          </form>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// FAQ
// ============================================================================

export function FaqSection({ t }: { t: T }) {
  const ids = [1, 2, 3, 4, 5, 6];
  const [open, setOpen] = useState<number | null>(1);
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: GOLD, margin: 0 }}>{t('faqTitle')}</h2>
        <p style={{ color: MUTED, marginTop: 8 }}>{t('faqSub')}</p>
      </div>
      {ids.map((n) => {
        const isOpen = open === n;
        return (
          <Card key={n} style={{ background: CARD_BG, padding: 0, marginBottom: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setOpen(isOpen ? null : n)}
              style={{
                width: '100%', background: 'transparent', border: 'none', color: '#e0d5c1',
                textAlign: 'left', padding: '16px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              {t(`faq${n}Q`)}
              <span style={{ color: GOLD }}>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 20px 16px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
                {t(`faq${n}A`)}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// CONTACT
// ============================================================================

export function ContactSection({ t, language }: { t: T; language: Language }) {
  const [form, setForm] = useState({ name: '', email: '', product: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setOk(null);
    try {
      const res = await fetch('/api/v1/contact/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Language': language },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      setOk(!!json.success);
      if (json.success) setForm({ name: '', email: '', product: '', message: '' });
    } catch {
      setOk(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: GOLD, margin: 0 }}>{t('contactTitle')}</h2>
        <p style={{ color: MUTED, marginTop: 8 }}>{t('contactSub')}</p>
      </div>
      <Card style={{ background: CARD_BG, padding: 24 }}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TextField placeholder={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField type="email" placeholder={t('email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <TextField placeholder={t('productSubject')} value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <TextField placeholder={t('message')} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <GoldButton type="submit" disabled={busy} style={{ padding: '12px' }}>
            {busy ? t('sending') : t('send')}
          </GoldButton>
          {ok === true && <div style={{ color: '#3cb97e', fontSize: 13 }}>{t('success')}</div>}
          {ok === false && <div style={{ color: '#dc3545', fontSize: 13 }}>{t('error')}</div>}
        </form>
      </Card>
    </div>
  );
}

// ============================================================================
// SERVICES — ASSET MANAGEMENT (Al-Takamul Wahid) & SPSS STATISTICAL ANALYSIS
// ============================================================================

function Eq({ children }: { children: React.ReactNode }) {
  return (
    <span
      dir="ltr"
      style={{
        direction: 'ltr',
        display: 'inline-block',
        unicodeBidi: 'isolate',
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontWeight: 700,
        fontStyle: 'italic',
        color: '#e0c96e',
        margin: '0 2px',
      }}
    >
      {children}
    </span>
  );
}

interface ServiceCard {
  icon: string;
  titleKey: string;
  descKey: string;
}

const ASSET_SERVICE_CARDS: ServiceCard[] = [
  { icon: '⚖️', titleKey: 'svcConservationTitle', descKey: 'svcConservationDesc1' },
  { icon: '🔄', titleKey: 'svcClosedOpsTitle', descKey: 'svcClosedOpsDesc1' },
  { icon: '🔒', titleKey: 'svcAuditTitle', descKey: 'svcAuditDesc' },
  { icon: '🪙', titleKey: 'svcSmartTitle', descKey: 'svcSmartDesc' },
  { icon: '💻', titleKey: 'svcInvariantTitle', descKey: 'svcInvariantDesc' },
];

const STATS_SERVICE_CARDS: ServiceCard[] = [
  { icon: '📊', titleKey: 'svcDescriptiveTitle', descKey: 'svcDescriptiveDesc' },
  { icon: '🧪', titleKey: 'svcHypothesisTitle', descKey: 'svcHypothesisDesc' },
  { icon: '🔗', titleKey: 'svcCorrTitle', descKey: 'svcCorrDesc' },
  { icon: '⚖️', titleKey: 'svcTtestTitle', descKey: 'svcTtestDesc' },
  { icon: '📋', titleKey: 'svcReliabilityTitle', descKey: 'svcReliabilityDesc' },
];

function renderCardDesc(c: ServiceCard, t: T) {
  if (c.titleKey === 'svcConservationTitle') {
    return (
      <>
        {t('svcConservationDesc1')} <Eq>L(t) = C(t) + S(t)</Eq>{' '}
        {t('svcConservationDesc2')}
      </>
    );
  }
  if (c.titleKey === 'svcClosedOpsTitle') {
    return (
      <>
        {t(c.descKey)} <Eq>Σ P</Eq> {t('svcClosedOpsDesc2')}
      </>
    );
  }
  return t(c.descKey);
}

export function ServicesSection({ t, onNavigate }: { t: T; onNavigate: (id: SectionId) => void }) {
  const renderGrid = (cards: ServiceCard[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
      {cards.map((c) => (
        <Card
          key={c.titleKey}
          style={{ background: CARD_BG, padding: 20, border: '1px solid rgba(198,169,105,0.14)', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(198,169,105,0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              marginBottom: 4,
            }}
          >
            {c.icon}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#e0d5c1', lineHeight: 1.4 }}>{t(c.titleKey)}</div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.8 }}>{renderCardDesc(c, t)}</div>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      {/* Block 1 — Asset management (Al-Takamul Wahid) */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 11,
            color: '#1a1a24',
            background: GOLD,
            borderRadius: 20,
            padding: '4px 14px',
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          {t('svcSystemBadge')}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: GOLD, margin: '16px 0 12px', lineHeight: 1.4 }}>{t('svcTitle1')}</h2>
        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.9, maxWidth: 860, margin: '0 auto' }}>{t('svcSub1')}</p>
      </div>

      {/* Triple Conservation equation highlight box */}
      <div
        style={{
          margin: '30px auto',
          maxWidth: 720,
          padding: '24px 26px',
          borderRadius: 14,
          border: '2px solid rgba(198,169,105,0.55)',
          background: 'linear-gradient(135deg, rgba(198,169,105,0.16), rgba(26,26,36,0.5))',
          boxShadow: '0 0 38px rgba(198,169,105,0.18), inset 0 1px 0 rgba(224,201,110,0.2)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: 2, marginBottom: 12 }}>{t('svcConservationBoxTitle')}</div>
        <div
          dir="ltr"
          style={{
            direction: 'ltr',
            unicodeBidi: 'isolate',
            fontSize: 30,
            fontWeight: 900,
            color: '#e0c96e',
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: 2,
          }}
        >
          L(t) = C(t) + S(t)
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 14, lineHeight: 1.8, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          {t('svcConservationBoxSub')}
        </div>
      </div>

      {renderGrid(ASSET_SERVICE_CARDS)}

      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <GoldButton onClick={() => onNavigate('contact')} style={{ padding: '13px 30px', fontSize: 15 }}>{t('svcCta1')}</GoldButton>
      </div>

      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(198,169,105,0.4), transparent)', margin: '46px 0' }} />

      {/* Block 2 — SPSS statistical analysis */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 11,
            color: '#1a1a24',
            background: GOLD,
            borderRadius: 20,
            padding: '4px 14px',
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          {t('svcStatsBadge')}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: GOLD, margin: '16px 0 12px', lineHeight: 1.4 }}>{t('svcTitle2')}</h2>
        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.9, maxWidth: 860, margin: '0 auto' }}>{t('svcSub2')}</p>
      </div>

      {renderGrid(STATS_SERVICE_CARDS)}

      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <GoldButton onClick={() => onNavigate('contact')} style={{ padding: '13px 30px', fontSize: 15 }}>{t('svcCta2')}</GoldButton>
      </div>
    </div>
  );
}