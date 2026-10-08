import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function AMLPage() {
  const { t } = useTranslation();
  const [amlChecks, setAmlChecks] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [newEntity, setNewEntity] = useState('');
  const [newType, setNewType] = useState('INDIVIDUAL');

  useEffect(() => {
    fetchAmlChecks();
  }, []);

  const fetchAmlChecks = async () => {
    const { data } = await supabase.from('aml_checks').select('*');
    if (data) setAmlChecks(data);
  };

  const handleDelete = async (id: any) => {
    const { error } = await supabase.from('aml_checks').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchAmlChecks();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    const { error } = await supabase.from('aml_checks').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchAmlChecks();
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('aml_checks').insert([{ 
      entity: newEntity, 
      entity_type: newType, 
      risk_score: Math.floor(Math.random() * 100), 
      status: 'INVESTIGATING' 
    }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setIsNewModalOpen(false);
      setNewEntity('');
      fetchAmlChecks();
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 34) return 'bg-green-500';
    if (score < 67) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const mapStatusToText = (status: string) => {
    if (status === 'CLEAN') return t('clean', 'نظيف');
    if (status === 'INVESTIGATING') return t('under_investigation', 'قيد التحقيق');
    if (status === 'SUSPICIOUS') return t('suspicious', 'مشبوه');
    return status;
  };

  const mapStatusToBadge = (status: string) => {
    if (status === 'CLEAN') return 'badge-success';
    if (status === 'SUSPICIOUS') return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('aml', 'مكافحة غسل الأموال (AML)')}</h1>
        <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>+ {t('new_check', 'فحص جديد')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('total_checks', 'الفحوصات الكلية')}</div><div className="stat-value">{amlChecks.length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('clean', 'نظيف')}</div><div className="stat-value">{amlChecks.filter(a => a.status === 'CLEAN').length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('suspicious', 'مشبوه')}</div><div className="stat-value">{amlChecks.filter(a => a.status === 'SUSPICIOUS').length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('under_investigation', 'قيد التحقيق')}</div><div className="stat-value">{amlChecks.filter(a => a.status === 'INVESTIGATING').length}</div></div>
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('check_number', 'رقم الفحص')}</th><th>{t('entity', 'الكيان')}</th><th>{t('type', 'النوع')}</th><th>{t('result', 'النتيجة')}</th><th>{t('risk_score', 'درجة المخاطر')}</th><th>{t('date', 'التاريخ')}</th><th>{t('action', 'الإجراء')}</th>
          </tr>
        </thead>
        <tbody>
          {amlChecks.map((row) => (
            <tr key={row.id}>
              <td>{row.id.slice(0, 8)}...</td>
              <td>{row.entity}</td>
              <td>{row.entity_type === 'COMPANY' ? t('company', 'شركة') : t('individual', 'فرد')}</td>
              <td><span className={`badge ${mapStatusToBadge(row.status)}`}>{mapStatusToText(row.status)}</span></td>
              <td className="w-48">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${getRiskColor(row.risk_score)}`} style={{ width: `${row.risk_score || 0}%` }}></div>
                </div>
                <span className="text-xs">{row.risk_score || 0}/100</span>
              </td>
              <td>{new Date(row.created_at).toLocaleDateString()}</td>
              <td><button className="btn-secondary text-sm" onClick={() => { setSelectedRecord(row); setIsDetailModalOpen(true); }}>{t('details', 'تفاصيل')}</button>
    <button className="btn-danger ml-2" onClick={() => handleDelete(row.id)}>{t('delete', 'حذف')}</button>
    <button className="btn-primary ml-2" onClick={() => {
      const s = prompt(t('enter_status', 'أدخل الحالة الجديدة (CLEAN, SUSPICIOUS, INVESTIGATING)'));
      if(s) handleUpdateStatus(row.id, s);
    }}>{t('update_status', 'تحديث الحالة')}</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={t('aml_investigation_details', 'تفاصيل تحقيق AML')}>
        {selectedRecord && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{selectedRecord.entity}</h3>
            <p>{t('transaction_patterns', 'أنماط المعاملات: تحويلات متكررة عالية القيمة')}</p>
            <ul className="list-disc list-inside text-red-500">
              <li>{t('ofac_partial_match', 'تطابق جزئي مع قائمة OFAC')}</li>
              <li>{t('unusual_financial_activity', 'نشاط مالي غير معتاد')}</li>
            </ul>
            <div className="flex space-x-2 space-x-reverse mt-6">
              <button className="btn-danger flex-1" onClick={() => { handleUpdateStatus(selectedRecord.id, 'SUSPICIOUS'); setIsDetailModalOpen(false); }}>{t('open_case', 'فتح قضية')}</button>
              <button className="btn-success flex-1" onClick={() => { handleUpdateStatus(selectedRecord.id, 'CLEAN'); setIsDetailModalOpen(false); }}>{t('close_as_clean', 'إغلاق النظيف')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title={t('new_aml_check', 'فحص AML جديد')}>
        <div className="space-y-4">
          <input className="input w-full" placeholder={t('entity_name', 'اسم الكيان')} value={newEntity} onChange={e => setNewEntity(e.target.value)} />
          <select className="input w-full" value={newType} onChange={e => setNewType(e.target.value)}><option value="INDIVIDUAL">{t('individual', 'فرد')}</option><option value="COMPANY">{t('company', 'شركة')}</option></select>
          <button className="btn-primary w-full" onClick={handleCreate}>{t('start_check', 'بدء الفحص')}</button>
        </div>
      </Modal>
    </div>
  );
}
