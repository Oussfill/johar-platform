import React, { useState, useEffect } from 'react';
import {
  PageShell,
  Card,
  GoldButton,
  TextField,
  Loading,
  ErrorBox,
  DataTable,
  Td,
  Badge,
  fmtDateTime,
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';
import { apiFetch } from '../utils/apiFetch';

// ============================================================================
// ADMIN — PUBLIC & B2B SERVICES (Newsletter | Articles | Buyer Program | Messages)
// ============================================================================

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  language: string;
  status: string;
  createdAt: string;
}

interface ArticleRow {
  id: string;
  slug: string;
  type: string;
  title: Record<string, string>;
  status: string;
  author?: string;
  publishedAt?: string;
  updatedAt: string;
}

interface BuyerReg {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  country?: string;
  status: string;
  createdAt: string;
}

interface MessageRow {
  id: string;
  name: string;
  email: string;
  product?: string;
  message?: string;
  status: string;
  createdAt: string;
}

type Tab = 'newsletter' | 'articles' | 'buyer' | 'messages';

const EMPTY_ARTICLE = {
  slug: '',
  type: 'BLOG',
  title: '',
  excerpt: '',
  content: '',
  author: '',
  imageUrl: '',
  status: 'DRAFT',
};

export function AdminB2bPage({ language }: { language: Language; currency: Currency }) {
  const [tab, setTab] = useState<Tab>('newsletter');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [buyers, setBuyers] = useState<BuyerReg[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<typeof EMPTY_ARTICLE | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);

  const t = (key: string): string => {
    const map: Record<string, Record<Language, string>> = {
      title: { AR: 'الخدمات العامة والتسويقية', FR: 'Services publics & marketing', EN: 'Public & Marketing Services' },
      newsletter: { AR: 'النشرة البريدية', FR: 'Newsletter', EN: 'Newsletter' },
      articles: { AR: 'المقالات', FR: 'Articles', EN: 'Articles' },
      buyer: { AR: 'برنامج المشترين', FR: 'Programme Acheteurs', EN: 'Buyer Program' },
      messages: { AR: 'الرسائل', FR: 'Messages', EN: 'Messages' },
      email: { AR: 'البريد الإلكتروني', FR: 'E-mail', EN: 'Email' },
      name: { AR: 'الاسم', FR: 'Nom', EN: 'Name' },
      status: { AR: 'الحالة', FR: 'Statut', EN: 'Status' },
      date: { AR: 'التاريخ', FR: 'Date', EN: 'Date' },
      actions: { AR: 'إجراءات', FR: 'Actions', EN: 'Actions' },
      delete: { AR: 'حذف', FR: 'Supprimer', EN: 'Delete' },
      add: { AR: 'إضافة', FR: 'Ajouter', EN: 'Add' },
      save: { AR: 'حفظ', FR: 'Enregistrer', EN: 'Save' },
      cancel: { AR: 'إلغاء', FR: 'Annuler', EN: 'Cancel' },
      edit: { AR: 'تعديل', FR: 'Modifier', EN: 'Edit' },
      view: { AR: 'عرض', FR: 'Voir', EN: 'View' },
      slug: { AR: 'الرابط الداخلي', FR: 'Slug', EN: 'Slug' },
      type: { AR: 'النوع', FR: 'Type', EN: 'Type' },
      author: { AR: 'الكاتب', FR: 'Auteur', EN: 'Author' },
      image: { AR: 'رابط الصورة', FR: 'URL image', EN: 'Image URL' },
      titleEn: { AR: 'العنوان (إنجليزي)', FR: 'Titre (EN)', EN: 'Title (EN)' },
      titleAr: { AR: 'العنوان (عربي)', FR: 'Titre (AR)', EN: 'Title (AR)' },
      excerptEn: { AR: 'الملخص (إنجليزي)', FR: 'Extrait (EN)', EN: 'Excerpt (EN)' },
      contentEn: { AR: 'المحتوى (إنجليزي)', FR: 'Contenu (EN)', EN: 'Content (EN)' },
      published: { AR: 'منشور', FR: 'Publié', EN: 'Published' },
      draft: { AR: 'مسودة', FR: 'Brouillon', EN: 'Draft' },
      company: { AR: 'الشركة', FR: 'Société', EN: 'Company' },
      contact: { AR: 'المسؤول', FR: 'Contact', EN: 'Contact' },
      product: { AR: 'المنتج', FR: 'Produit', EN: 'Product' },
      message: { AR: 'الرسالة', FR: 'Message', EN: 'Message' },
      empty: { AR: 'لا توجد بيانات', FR: 'Aucune donnée', EN: 'No data' },
      deleted: { AR: 'تم الحذف', FR: 'Supprimé', EN: 'Deleted' },
      saved: { AR: 'تم الحفظ', FR: 'Enregistré', EN: 'Saved' },
      errorSave: { AR: 'حدث خطأ في الحفظ', FR: 'Erreur d\'enregistrement', EN: 'Save error' },
      confirmDelete: { AR: 'تأكيد الحذف؟', FR: 'Confirmer la suppression ?', EN: 'Confirm delete?' },
    };
    return map[key]?.[language] || key;
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a, b, m] = await Promise.all([
        apiFetch('/api/v1/admin/content/newsletter'),
        apiFetch('/api/v1/admin/content/articles'),
        apiFetch('/api/v1/admin/content/buyer-program'),
        apiFetch('/api/v1/admin/content/contact-messages'),
      ]);
      const [sj, aj, bj, mj] = await Promise.all([s.json(), a.json(), b.json(), m.json()]);
      if (s.ok) setSubscribers(sj.data?.items || []);
      if (a.ok) setArticles(aj.data?.items || []);
      if (b.ok) setBuyers(bj.data?.items || []);
      if (m.ok) setMessages(mj.data?.items || []);
      if (!s.ok || !a.ok || !b.ok || !m.ok) setError('Failed to load some lists');
    } catch (e: any) {
      setError(e?.message || 'Load error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Newsletter ───────────────────────────────────────────────────────────
  const removeSubscriber = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const res = await apiFetch(`/api/v1/admin/content/newsletter/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSubscribers((rows) => rows.filter((r) => r.id !== id));
      setNote({ ok: true, message: t('deleted') });
    } else {
      setNote({ ok: false, message: t('errorSave') });
    }
  };

  // ─── Articles ─────────────────────────────────────────────────────────────
  const saveArticle = async () => {
    if (!editingArticle) return;
    setSubmitting(true);
    setNote(null);
    const payload = {
      slug: editingArticle.slug,
      type: editingArticle.type,
      title: { en: editingArticle.title },
      excerpt: editingArticle.excerpt ? { en: editingArticle.excerpt } : null,
      content: { en: editingArticle.content },
      imageUrl: editingArticle.imageUrl || null,
      author: editingArticle.author || null,
      status: editingArticle.status,
    };
    try {
      if (editingArticle.id) {
        const res = await apiFetch(`/api/v1/admin/content/articles/${editingArticle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('update failed');
      } else {
        const res = await apiFetch('/api/v1/admin/content/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('create failed');
      }
      setNote({ ok: true, message: t('saved') });
      setEditingArticle(null);
      setArticles((rows) => [...rows]);
      await loadAll();
    } catch {
      setNote({ ok: false, message: t('errorSave') });
    } finally {
      setSubmitting(false);
    }
  };

  const removeArticle = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const res = await apiFetch(`/api/v1/admin/content/articles/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setArticles((rows) => rows.filter((r) => r.id !== id));
      setNote({ ok: true, message: t('deleted') });
    } else {
      setNote({ ok: false, message: t('errorSave') });
    }
  };

  const openEdit = (a: ArticleRow) => {
    setEditingArticle({
      id: a.id,
      slug: a.slug,
      type: a.type,
      title: a.title?.en || '',
      excerpt: '',
      content: '',
      author: a.author || '',
      imageUrl: '',
      status: a.status,
    });
  };

  // ─── Buyer program ────────────────────────────────────────────────────────
  const setBuyerStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/api/v1/admin/content/buyer-program/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBuyers((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
      setNote({ ok: true, message: t('saved') });
    } else {
      setNote({ ok: false, message: t('errorSave') });
    }
  };

  // ─── Messages ─────────────────────────────────────────────────────────────
  const setMessageStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/api/v1/admin/content/contact-messages/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMessages((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
      setNote({ ok: true, message: t('saved') });
    } else {
      setNote({ ok: false, message: t('errorSave') });
    }
  };

  const tabs: { id: Tab; key: string }[] = [
    { id: 'newsletter', key: 'newsletter' },
    { id: 'articles', key: 'articles' },
    { id: 'buyer', key: 'buyer' },
    { id: 'messages', key: 'messages' },
  ];

  return (
    <PageShell title={t('title')}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            style={{
              background: tab === tb.id ? 'linear-gradient(135deg, #c6a969, #a67c00)' : 'transparent',
              color: tab === tb.id ? '#0a0a0f' : '#8a8a9a',
              border: `1px solid ${tab === tb.id ? 'transparent' : 'rgba(198,169,105,0.3)'}`,
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t(tb.key)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          {tab === 'articles' && (
            <GoldButton onClick={() => setEditingArticle({ ...EMPTY_ARTICLE })} style={{ padding: '8px 18px', fontSize: 13 }}>
              + {t('add')}
            </GoldButton>
          )}
        </div>
      </div>

      {note && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: note.ok ? 'rgba(60,185,126,0.1)' : 'rgba(220,53,69,0.1)', border: `1px solid ${note.ok ? '#3cb97e' : '#dc3545'}`, color: note.ok ? '#3cb97e' : '#dc3545', fontSize: 13 }}>
          {note.message}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <>
          {tab === 'newsletter' && (
            <Card>
              {subscribers.length === 0 ? (
                <div style={{ padding: 20, color: '#8a8a9a', textAlign: 'center' }}>{t('empty')}</div>
              ) : (
                <DataTable columns={[t('email'), t('name'), t('status'), t('date'), t('actions')]}>
                  {subscribers.map((s) => (
                    <tr key={s.id}>
                      <Td>{s.email}</Td>
                      <Td>{s.name || '—'}</Td>
                      <Td><Badge value={s.status} /></Td>
                      <Td>{fmtDateTime(s.createdAt)}</Td>
                      <Td><GoldButton onClick={() => removeSubscriber(s.id)} style={{ padding: '4px 10px', fontSize: 11 }}>{t('delete')}</GoldButton></Td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </Card>
          )}

          {tab === 'articles' && (
            <>
              {editingArticle && (
                <Card style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <TextField placeholder={t('titleEn')} value={editingArticle.title} onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12 }}>
                      <TextField placeholder={t('slug')} value={editingArticle.slug} onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })} />
                      <select value={editingArticle.type} onChange={(e) => setEditingArticle({ ...editingArticle, type: e.target.value })} style={{ ...inputStyle }}>
                        <option value="BLOG">BLOG</option>
                        <option value="NEWS">NEWS</option>
                        <option value="ACADEMY">ACADEMY</option>
                        <option value="WORKSHOP">WORKSHOP</option>
                      </select>
                      <select value={editingArticle.status} onChange={(e) => setEditingArticle({ ...editingArticle, status: e.target.value })} style={{ ...inputStyle }}>
                        <option value="DRAFT">{t('draft')}</option>
                        <option value="PUBLISHED">{t('published')}</option>
                      </select>
                    </div>
                    <TextField placeholder={t('excerptEn')} value={editingArticle.excerpt} onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })} />
                    <TextField placeholder={t('author')} value={editingArticle.author} onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })} />
                    <TextField placeholder={t('image')} value={editingArticle.imageUrl} onChange={(e) => setEditingArticle({ ...editingArticle, imageUrl: e.target.value })} />
                    <TextField placeholder={t('contentEn')} rows={8} value={editingArticle.content} onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <GoldButton onClick={saveArticle} disabled={submitting} style={{ padding: '10px 24px' }}>
                        {submitting ? '...' : t('save')}
                      </GoldButton>
                      <GoldButton onClick={() => setEditingArticle(null)} style={{ padding: '10px 24px' }}>{t('cancel')}</GoldButton>
                    </div>
                  </div>
                </Card>
              )}

              <Card>
                {articles.length === 0 ? (
                  <div style={{ padding: 20, color: '#8a8a9a', textAlign: 'center' }}>{t('empty')}</div>
                ) : (
                  <DataTable columns={[t('title'), t('type'), t('status'), t('date'), t('actions')]}>
                    {articles.map((a) => (
                      <tr key={a.id}>
                        <Td>{a.title?.en || a.slug}</Td>
                        <Td><Badge value={a.type} /></Td>
                        <Td><Badge value={a.status} /></Td>
                        <Td>{fmtDateTime(a.updatedAt)}</Td>
                        <Td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <GoldButton onClick={() => openEdit(a)} style={{ padding: '4px 10px', fontSize: 11 }}>{t('edit')}</GoldButton>
                            <GoldButton onClick={() => removeArticle(a.id)} style={{ padding: '4px 10px', fontSize: 11 }}>{t('delete')}</GoldButton>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </Card>
            </>
          )}

          {tab === 'buyer' && (
            <Card>
              {buyers.length === 0 ? (
                <div style={{ padding: 20, color: '#8a8a9a', textAlign: 'center' }}>{t('empty')}</div>
              ) : (
                <DataTable columns={[t('company'), t('contact'), t('email'), t('status'), t('date'), t('actions')]}>
                  {buyers.map((b) => (
                    <tr key={b.id}>
                      <Td>{b.companyName}</Td>
                      <Td>{b.contactName}{b.country ? ` (${b.country})` : ''}</Td>
                      <Td>{b.email}</Td>
                      <Td><Badge value={b.status} /></Td>
                      <Td>{fmtDateTime(b.createdAt)}</Td>
                      <Td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['APPROVED', 'REJECTED'].map((st) => (
                            <GoldButton key={st} onClick={() => setBuyerStatus(b.id, st)} style={{ padding: '4px 10px', fontSize: 11 }}>{st}</GoldButton>
                          ))}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </Card>
          )}

          {tab === 'messages' && (
            <Card>
              {messages.length === 0 ? (
                <div style={{ padding: 20, color: '#8a8a9a', textAlign: 'center' }}>{t('empty')}</div>
              ) : (
                <DataTable columns={[t('name'), t('email'), t('product'), t('message'), t('status'), t('date'), t('actions')]}>
                  {messages.map((m) => (
                    <tr key={m.id}>
                      <Td>{m.name}</Td>
                      <Td>{m.email}</Td>
                      <Td>{m.product || '—'}</Td>
                      <Td>{(m.message || '').slice(0, 60)}…</Td>
                      <Td><Badge value={m.status} /></Td>
                      <Td>{fmtDateTime(m.createdAt)}</Td>
                      <Td>
                        {m.status !== 'READ' && (
                          <GoldButton onClick={() => setMessageStatus(m.id, 'READ')} style={{ padding: '4px 10px', fontSize: 11 }}>{t('view')}</GoldButton>
                        )}
                      </Td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#12121c',
  color: '#e0d5c1',
  border: '1px solid rgba(198,169,105,0.2)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
};

export default AdminB2bPage;