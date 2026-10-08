import React, { useState, useEffect } from 'react';
import {
  PageShell, Card, GoldButton, TextField, Loading, ErrorBox, DataTable, Td, Badge,
  fmtMoney, fmtDateTime, fmtNum, normalizeNumber
} from '../components/UiKit';
import type { Language, Currency } from '../components/UiKit';
import { apiFetch } from '../utils/apiFetch';

interface Product {
  id: string;
  listingId: string;
  title: string;
  description: string;
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
  status: string;
  condition: string;
  authenticityGuaranteed: boolean;
  viewCount: number;
  favoriteCount: number;
  inquiryCount: number;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  product: string;
  message: string;
  status: string;
  createdAt: string;
}

export function AdminProductsPage({ language, currency }: { language: Language; currency: Currency }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'inquiries'>('products');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    metalType: 'GOLD',
    karat: 24,
    weightGross: '',
    price: '',
    currency: 'USD',
    condition: 'NEW',
    imageUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string } | null>(null);

  const t = (key: string): string => {
    const map: Record<string, Record<Language, string>> = {
      title: { AR: 'إدارة المنتجات', FR: 'Gestion des produits', EN: 'Product Management' },
      products: { AR: 'المنتجات', FR: 'Produits', EN: 'Products' },
      inquiries: { AR: 'الاستفسارات', FR: 'Demandes', EN: 'Inquiries' },
      addProduct: { AR: 'إضافة منتج', FR: 'Ajouter un produit', EN: 'Add Product' },
      editProduct: { AR: 'تعديل منتج', FR: 'Modifier un produit', EN: 'Edit Product' },
      name: { AR: 'الاسم', FR: 'Nom', EN: 'Name' },
      description: { AR: 'الوصف', FR: 'Description', EN: 'Description' },
      metal: { AR: 'المعدن', FR: 'Métal', EN: 'Metal' },
      karat: { AR: 'القيراط', FR: 'Karat', EN: 'Karat' },
      weight: { AR: 'الوزن', FR: 'Poids', EN: 'Weight' },
      price: { AR: 'السعر', FR: 'Prix', EN: 'Price' },
      currency: { AR: 'العملة', FR: 'Devise', EN: 'Currency' },
      condition: { AR: 'الحالة', FR: 'État', EN: 'Condition' },
      imageUrl: { AR: 'رابط الصورة', FR: 'URL de l\'image', EN: 'Image URL' },
      status: { AR: 'الحالة', FR: 'Statut', EN: 'Status' },
      actions: { AR: 'الإجراءات', FR: 'Actions', EN: 'Actions' },
      save: { AR: 'حفظ', FR: 'Enregistrer', EN: 'Save' },
      cancel: { AR: 'إلغاء', FR: 'Annuler', EN: 'Cancel' },
      delete: { AR: 'حذف', FR: 'Supprimer', EN: 'Delete' },
      edit: { AR: 'تعديل', FR: 'Modifier', EN: 'Edit' },
      view: { AR: 'عرض', FR: 'Voir', EN: 'View' },
      email: { AR: 'البريد الإلكتروني', FR: 'E-mail', EN: 'Email' },
      product: { AR: 'المنتج', FR: 'Produit', EN: 'Product' },
      message: { AR: 'الرسالة', FR: 'Message', EN: 'Message' },
      date: { AR: 'التاريخ', FR: 'Date', EN: 'Date' },
      noProducts: { AR: 'لا توجد منتجات', FR: 'Aucun produit', EN: 'No products' },
      noInquiries: { AR: 'لا توجد استفسارات', FR: 'Aucune demande', EN: 'No inquiries' },
      success: { AR: 'تم الحفظ بنجاح', FR: 'Enregistré avec succès', EN: 'Saved successfully' },
      error: { AR: 'حدث خطأ', FR: 'Une erreur est survenue', EN: 'An error occurred' },
      deleteConfirm: { AR: 'هل أنت متأكد من الحذف؟', FR: 'Êtes-vous sûr de vouloir supprimer ?', EN: 'Are you sure you want to delete?' },
    };
    return map[key]?.[language] || key;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, inquiriesRes] = await Promise.all([
        apiFetch('/api/v1/admin/products'),
        apiFetch('/api/v1/admin/inquiries'),
      ]);
      const productsJson = await productsRes.json();
      const inquiriesJson = await inquiriesRes.json();
      if (productsRes.ok) {
        setProducts(productsJson.data?.items || productsJson.data || []);
      } else {
        setError(productsJson.error?.message || 'Failed to load products');
      }
      if (inquiriesRes.ok) {
        setInquiries(inquiriesJson.data?.items || inquiriesJson.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const url = editingProduct
        ? `/api/v1/admin/products/${editingProduct.id}`
        : '/api/v1/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        weightGross: normalizeNumber(formData.weightGross),
        price: normalizeNumber(formData.price),
        karat: normalizeNumber(formData.karat),
      };
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        setSubmitResult({ ok: true, message: t('success') });
        setShowForm(false);
        setEditingProduct(null);
        setFormData({ title: '', description: '', metalType: 'GOLD', karat: 24, weightGross: '', price: '', currency: 'USD', condition: 'NEW', imageUrl: '' });
        fetchData();
      } else {
        setSubmitResult({ ok: false, message: json.error?.message || t('error') });
      }
    } catch (err: any) {
      setSubmitResult({ ok: false, message: err.message || t('error') });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await apiFetch(`/api/v1/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const json = await res.json();
        setSubmitResult({ ok: false, message: json.error?.message || t('error') });
      }
    } catch (err: any) {
      setSubmitResult({ ok: false, message: err.message || t('error') });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || '',
      description: product.description || '',
      metalType: product.asset?.metalType || 'GOLD',
      karat: product.asset?.karat || 24,
      weightGross: String(product.asset?.weightGross || ''),
      price: String(product.pricing?.basePrice || ''),
      currency: product.pricing?.currency || 'USD',
      condition: product.condition || 'NEW',
      imageUrl: product.imageUrl || '',
    });
    setShowForm(true);
  };

  if (loading) return <PageShell title={t('title')} language={language}><Loading /></PageShell>;
  if (error) return <PageShell title={t('title')} language={language}><ErrorBox message={error} /></PageShell>;

  return (
    <PageShell title={t('title')} icon="📦" language={language}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <GoldButton
          onClick={() => setActiveTab('products')}
          style={{ background: activeTab === 'products' ? '#c6a969' : 'transparent', color: activeTab === 'products' ? '#0a0a0f' : '#8a8a9a', border: activeTab === 'products' ? 'none' : '1px solid rgba(198,169,105,0.2)' }}
        >
          {t('products')} ({products.length})
        </GoldButton>
        <GoldButton
          onClick={() => setActiveTab('inquiries')}
          style={{ background: activeTab === 'inquiries' ? '#c6a969' : 'transparent', color: activeTab === 'inquiries' ? '#0a0a0f' : '#8a8a9a', border: activeTab === 'inquiries' ? 'none' : '1px solid rgba(198,169,105,0.2)' }}
        >
          {t('inquiries')} ({inquiries.length})
        </GoldButton>
        {activeTab === 'products' && (
          <GoldButton onClick={() => { setShowForm(true); setEditingProduct(null); setFormData({ title: '', description: '', metalType: 'GOLD', karat: 24, weightGross: '', price: '', currency: 'USD', condition: 'NEW', imageUrl: '' }); }}>
            + {t('addProduct')}
          </GoldButton>
        )}
      </div>

      {submitResult && (
        <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: submitResult.ok ? 'rgba(60,185,126,0.1)' : 'rgba(220,53,69,0.1)', border: `1px solid ${submitResult.ok ? '#3cb97e' : '#dc3545'}`, color: submitResult.ok ? '#3cb97e' : '#dc3545' }}>
          {submitResult.message}
        </div>
      )}

      {showForm && activeTab === 'products' && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#c6a969', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            {editingProduct ? t('editProduct') : t('addProduct')}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TextField
              placeholder={t('name')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <TextField
              placeholder={t('price')}
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <select
              value={formData.metalType}
              onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
              style={{ padding: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 8, color: '#e0d5c1' }}
            >
              <option value="GOLD">GOLD</option>
              <option value="SILVER">SILVER</option>
              <option value="PLATINUM">PLATINUM</option>
              <option value="PALLADIUM">PALLADIUM</option>
            </select>
            <TextField
              placeholder={t('karat')}
              type="number"
              value={formData.karat}
              onChange={(e) => setFormData({ ...formData, karat: Number(e.target.value) })}
            />
            <TextField
              placeholder={t('weight')}
              type="number"
              value={formData.weightGross}
              onChange={(e) => setFormData({ ...formData, weightGross: e.target.value })}
              required
            />
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              style={{ padding: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 8, color: '#e0d5c1' }}
            >
              <option value="DZD">DZD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              style={{ padding: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 8, color: '#e0d5c1' }}
            >
              <option value="NEW">NEW</option>
              <option value="LIKE_NEW">LIKE_NEW</option>
              <option value="EXCELLENT">EXCELLENT</option>
              <option value="GOOD">GOOD</option>
            </select>
            <div style={{ gridColumn: '1 / -1' }}>
              <TextField
                placeholder={t('imageUrl')}
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <TextField
                placeholder={t('description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
              <GoldButton type="submit" disabled={submitting}>{submitting ? '...' : t('save')}</GoldButton>
              <GoldButton type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }} style={{ background: 'transparent', border: '1px solid rgba(198,169,105,0.2)' }}>
                {t('cancel')}
              </GoldButton>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'products' && (
        products.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8a8a9a', padding: 40 }}>{t('noProducts')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {products.map((p) => (
              <Card key={p.id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#c6a969' }}>{p.title}</div>
                  <Badge value={p.status || 'ACTIVE'} />
                </div>
                <div style={{ color: '#8a8a9a', fontSize: 12, marginTop: 8 }}>
                  <div>{p.asset?.metalType || '—'} · {p.asset?.karat || '—'}K · {p.asset?.weightGross || '—'}g</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#c6a969', marginTop: 4 }}>
                    {fmtMoney(p.pricing?.basePrice || 0, p.pricing?.currency || 'USD')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <GoldButton onClick={() => handleEdit(p)} style={{ padding: '4px 12px', fontSize: 12 }}>{t('edit')}</GoldButton>
                  <GoldButton onClick={() => handleDelete(p.id)} style={{ padding: '4px 12px', fontSize: 12, background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', color: '#dc3545' }}>{t('delete')}</GoldButton>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {activeTab === 'inquiries' && (
        inquiries.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8a8a9a', padding: 40 }}>{t('noInquiries')}</div>
        ) : (
          <DataTable columns={[t('name'), t('email'), t('product'), t('message'), t('status'), t('date')]}>
            {inquiries.map((inq) => (
              <tr key={inq.id}>
                <Td>{inq.name}</Td>
                <Td>{inq.email}</Td>
                <Td>{inq.product || '—'}</Td>
                <Td>{inq.message?.slice(0, 60)}{inq.message?.length > 60 ? '...' : ''}</Td>
                <Td><Badge value={inq.status || 'NEW'} /></Td>
                <Td>{fmtDateTime(inq.createdAt, language)}</Td>
              </tr>
            ))}
          </DataTable>
        )
      )}
    </PageShell>
  );
}

export default AdminProductsPage;