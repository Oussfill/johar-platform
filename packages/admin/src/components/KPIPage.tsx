import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from './Modal';

export default function KPIPage() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [assetsStats, setAssetsStats] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  
  useEffect(() => {
    supabase.from('kpi_metrics').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setAssetsStats(data.filter(d => d.category === 'assets'));
        setFinancialStats(data.filter(d => d.category === 'financial'));
        setUserStats(data.filter(d => d.category === 'users'));
        setChartData(data.filter(d => d.category === 'chart'));
        setProgressData(data.filter(d => d.category === 'progress'));
      } else {
        setAssetsStats([]);
        setFinancialStats([]);
        setUserStats([]);
        setChartData([]);
        setProgressData([]);
      }
    });
  }, []);

  const kpiCategories = [
    t('assets', 'Assets'),
    t('financials', 'Financials'),
    t('users', 'Users'),
    t('transactions', 'Transactions')
  ];

  return (
    <div className="space-y-6 text-johar-gray-light animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold gold-text">{t('key_performance_indicators', 'KPIs')}</h1>
        <div className="flex gap-2">
          <button className="btn-secondary">{t('export_report', 'Export')}</button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>{t('customize_indicators', 'Customize')}</button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('asset_indicators', 'Asset Indicators')}</h2>
        {assetsStats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assetsStats.map((stat, idx) => (
              <div key={idx} className="card flex flex-col justify-center">
                <div className="text-sm text-johar-gray-light">{stat.label}</div>
                <div className="text-2xl font-bold text-white my-1">{stat.value}</div>
                <div className={`text-xs ${String(stat.trend).startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stat.trend}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8 text-johar-gray-light">{t('no_data', 'No Data Available')}</div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('financial_indicators', 'Financial Indicators')}</h2>
        {financialStats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {financialStats.map((stat, idx) => (
              <div key={idx} className="card flex flex-col justify-center">
                <div className="text-sm text-johar-gray-light">{stat.label}</div>
                <div className="text-2xl font-bold text-white my-1">{stat.value}</div>
                <div className={`text-xs ${String(stat.trend).startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stat.trend}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8 text-johar-gray-light">{t('no_data', 'No Data Available')}</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="text-xl font-semibold mb-4">{t('goals_progress', 'Progress')}</h2>
          {progressData.length > 0 ? progressData.map((item, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between mb-1 text-sm">
                <span>{item.label}</span>
                <span>{item.current}{item.unit} / {item.target}{item.unit}</span>
              </div>
              <div className="w-full bg-[#1f1f1f] rounded-full h-2">
                <div className="bg-[#D4AF37] h-2 rounded-full" style={{ width: `${item.percent}%` }}></div>
              </div>
            </div>
          )) : <div className="text-center py-4">{t('no_data', 'No Data Available')}</div>}
        </div>

        <div className="card p-4 h-64">
          <h2 className="text-xl font-semibold mb-4">{t('monthly_revenue_chart', 'Revenue Chart')}</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} />
                <YAxis stroke="#cbd5e1" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #333' }} />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-4">{t('no_data', 'No Data Available')}</div>}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('customize_indicators_modal_title', 'Customize')}>
        <div className="space-y-2">
          {kpiCategories.map(item => (
            <label key={item} className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="accent-johar-gold" defaultChecked />
              <span>{item}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button className="btn-primary" onClick={() => setIsModalOpen(false)}>{t('save', 'Save')}</button>
        </div>
      </Modal>
    </div>
  );
}
