import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

interface Operation {
  id: string;
  type: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal';
  waitTime: string;
  actionRequired: string;
}

export default function PendingPage() {
  const { t } = useTranslation();
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);

  const [operations, setOperations] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('alerts').select('*').then(({ data }) => {
      if (data) setOperations(data);
    });
  }, []);

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return t('priority_urgent', 'عاجل');
      case 'high': return t('priority_high', 'مرتفع');
      case 'normal': return t('priority_normal', 'عادي');
      default: return priority;
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('pending_operations_title', 'العمليات المعلقة')}</h1>
        <button className="btn-primary">{t('process_all', 'معالجة الكل')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('total_pending', 'إجمالي المعلق')}</div>
          <div className="stat-value text-johar-gold">24</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">KYC</div>
          <div className="stat-value">12</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('exams', 'فحوصات')}</div>
          <div className="stat-value">5</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('payments', 'مدفوعات')}</div>
          <div className="stat-value">7</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-right">
          <thead>
            <tr className="border-b border-johar-gray-dark">
              <th className="p-4">{t('operation_id', 'رقم العملية')}</th>
              <th className="p-4">{t('operation_type', 'النوع')}</th>
              <th className="p-4">{t('operation_desc', 'الوصف')}</th>
              <th className="p-4">{t('priority', 'الأولوية')}</th>
              <th className="p-4">{t('wait_time', 'الوقت المنتظر')}</th>
              <th className="p-4">{t('action_required', 'الإجراء المطلوب')}</th>
              <th className="p-4">{t('actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op.id} className="border-b border-johar-gray-dark hover:bg-johar-gray-dark/50 transition">
                <td className="p-4">{op.id}</td>
                <td className="p-4">{op.type}</td>
                <td className="p-4">{op.description}</td>
                <td className="p-4">
                  <span className={`badge ${op.priority === 'urgent' ? 'badge-danger' : op.priority === 'high' ? 'badge-warning' : 'badge-info'}`}>
                    {getPriorityLabel(op.priority)}
                  </span>
                </td>
                <td className="p-4">{op.waitTime}</td>
                <td className="p-4">{op.actionRequired}</td>
                <td className="p-4">
                  <button className="btn-secondary text-sm py-1 px-3" onClick={() => setSelectedOp(op)}>{t('process', 'معالجة')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedOp} onClose={() => setSelectedOp(null)} title={t('process_operation', 'معالجة العملية')}>
        {selectedOp && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div><span className="text-johar-gray-mid">{t('operation_id_label', 'رقم العملية:')}</span> {selectedOp.id}</div>
              <div><span className="text-johar-gray-mid">{t('operation_type_label', 'النوع:')}</span> {selectedOp.type}</div>
              <div className="col-span-2"><span className="text-johar-gray-mid">{t('operation_desc_label', 'الوصف:')}</span> {selectedOp.description}</div>
            </div>
            <div className="mt-6 flex space-x-2 space-x-reverse">
              <button className="btn-success bg-johar-success text-white px-4 py-2 rounded" onClick={() => setSelectedOp(null)}>{t('approve', 'موافقة')}</button>
              <button className="btn-danger" onClick={() => setSelectedOp(null)}>{t('reject', 'رفض')}</button>
              <button className="btn-secondary" onClick={() => setSelectedOp(null)}>{t('request_more_info', 'طلب معلومات إضافية')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

