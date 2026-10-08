import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import { TrendingUp, TrendingDown, Package, ShieldCheck, FlaskConical, Users, Tag, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalAssets: 0,
    verifiedAssets: 0,
    pendingTests: 0,
    activeUsers: 0,
    openOffers: 0,
    loading: true
  });
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const [totalAssets, verifiedAssets, pendingTests, activeUsers, openOffers, recentList] = await Promise.all([
        supabase.from('assets').select('id', { count: 'exact', head: true }),
        supabase.from('assets').select('id', { count: 'exact', head: true }).eq('status', 'VERIFIED'),
        supabase.from('lab_tests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('marketplace_offers').select('id', { count: 'exact', head: true }).eq('status', 'OPEN'),
        supabase.from('assets').select('id, asset_code, asset_type, status, created_at, name').order('created_at', { ascending: false }).limit(8)
      ]);

      setStats({
        totalAssets: totalAssets.count || 0,
        verifiedAssets: verifiedAssets.count || 0,
        pendingTests: pendingTests.count || 0,
        activeUsers: activeUsers.count || 0,
        openOffers: openOffers.count || 0,
        loading: false
      });

      if (recentList.data) setRecentAssets(recentList.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setStats(prev => ({ ...prev, loading: false }));
    }
    setRefreshing(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const statCards = [
    { label: t('stats.totalAssets', 'إجمالي الأصول'), value: stats.totalAssets.toLocaleString(), icon: <Package className="w-5 h-5" />, color: 'text-johar-gold' },
    { label: t('stats.verifiedAssets', 'أصول موثقة'), value: stats.verifiedAssets.toLocaleString(), icon: <ShieldCheck className="w-5 h-5" />, color: 'text-green-400' },
    { label: t('stats.pendingTests', 'فحوصات معلقة'), value: stats.pendingTests.toLocaleString(), icon: <FlaskConical className="w-5 h-5" />, color: 'text-yellow-400' },
    { label: t('stats.activeUsers', 'مستخدمون نشطون'), value: stats.activeUsers.toLocaleString(), icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
    { label: t('stats.openOffers', 'عروض مفتوحة'), value: stats.openOffers.toLocaleString(), icon: <Tag className="w-5 h-5" />, color: 'text-purple-400' },
  ];

  const alerts = [
    { type: 'warning', message: t('alerts.kybPending', '4 طلبات KYB في انتظار المراجعة') },
    { type: 'danger', message: t('alerts.amlAlert', 'تنبيه AML — حساب مشبوه #SUS-2026-003') },
    { type: 'info', message: t('alerts.monthlyReport', 'التقرير الشهري جاهز للتصدير') },
    { type: 'warning', message: t('alerts.certExpiry', 'انتهاء صلاحية شهادات — 3 أجهزة خلال 30 يوماً') },
  ];

  const badgeClass: Record<string, string> = {
    'VERIFIED': 'badge-success',
    'PENDING': 'badge-warning',
    'REJECTED': 'badge-danger',
    'ACTIVE': 'badge-info',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('dashboard.title', 'لوحة التحكم الرئيسية')}</h2>
          <p className="text-johar-gray-light text-sm">
            {t('dashboard.subtitle', 'نظرة عامة على المنصة')} — {new Date().toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('dashboard.refresh', 'تحديث')}
          </button>
          <button className="btn-secondary text-sm">{t('dashboard.exportReport', 'تصدير تقرير')}</button>
          <button className="btn-primary text-sm">{t('dashboard.newAsset', '+ أصل جديد')}</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card card">
            <div className="flex justify-between items-start mb-3">
              <span className="stat-label text-xs">{s.label}</span>
              <span className={s.color}>{s.icon}</span>
            </div>
            {stats.loading ? (
              <div className="h-8 w-16 bg-johar-gray-dark/50 rounded animate-pulse" />
            ) : (
              <span className="stat-value text-2xl font-bold">{s.value}</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Assets */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{t('dashboard.recentAssets', 'آخر الأصول المضافة')}</h3>
            <button className="text-johar-gold text-sm hover:underline">{t('common.viewAll', 'عرض الكل')}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-johar-gray-light border-b border-johar-gray-dark/50 uppercase">
                  <th className="py-2 px-2 text-start">{t('table.code', 'الكود')}</th>
                  <th className="py-2 px-2 text-start">{t('table.name', 'الاسم')}</th>
                  <th className="py-2 px-2 text-start">{t('table.type', 'النوع')}</th>
                  <th className="py-2 px-2 text-start">{t('table.status', 'الحالة')}</th>
                  <th className="py-2 px-2 text-start">{t('table.date', 'التاريخ')}</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-johar-gray-light">{t('common.noData', 'لا توجد بيانات')}</td></tr>
                )}
                {recentAssets.map((a) => (
                  <tr key={a.id} className="border-b border-johar-gray-dark/30 hover:bg-johar-black-lighter/50 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-johar-gold">{a.asset_code}</td>
                    <td className="py-3 px-2">{a.name || '—'}</td>
                    <td className="py-3 px-2 text-johar-gray-light">{a.asset_type}</td>
                    <td className="py-3 px-2"><span className={`badge ${badgeClass[a.status] || 'badge-info'}`}>{a.status}</span></td>
                    <td className="py-3 px-2 text-johar-gray-light text-xs">{new Date(a.created_at).toLocaleDateString('ar-SA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts + Percentages */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold mb-4">{t('dashboard.alerts', 'التنبيهات')}</h3>
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${
                  a.type === 'danger' ? 'bg-johar-danger/10 border-johar-danger/30 text-johar-danger'
                  : a.type === 'warning' ? 'bg-johar-warning/10 border-johar-warning/30 text-johar-warning'
                  : 'bg-johar-info/10 border-johar-info/30 text-johar-info'
                }`}>{a.message}</div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4">{t('dashboard.assetsByType', 'الأصول حسب النوع')}</h3>
            <div className="space-y-3">
              {[
                { type: t('assetTypes.gold', 'ذهب'), pct: 65 },
                { type: t('assetTypes.silver', 'فضة'), pct: 16 },
                { type: t('assetTypes.diamond', 'ألماس'), pct: 12 },
                { type: t('assetTypes.other', 'أخرى'), pct: 7 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.type}</span>
                    <span className="text-johar-gray-light">{item.pct}%</span>
                  </div>
                  <div className="w-full bg-johar-black-lighter rounded-full h-2">
                    <div className="gold-gradient h-2 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
