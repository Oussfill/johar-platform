import { supabase } from '../supabase';
﻿import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

export default function AuditPage() {
  const { t } = useTranslation();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  
  const [mockLogs, setMockLogs] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).then(({data}) => {
      if (data) setMockLogs(data);
    });
  }, []);
  

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('audit_log', 'سجل المراجعة (Audit Log)')}</h1>
        <button className="btn-secondary" onClick={() => alert(t('export_success', 'تم التصدير بنجاح'))}>{t('export_csv', 'تصدير CSV')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('total_records', 'الإجمالي')}</div><div className="stat-value">1,205,430</div></div>
        <div className="stat-card"><div className="stat-label">{t('today', 'اليوم')}</div><div className="stat-value">4,320</div></div>
        <div className="stat-card"><div className="stat-label">{t('warnings', 'تحذيرات')}</div><div className="stat-value text-yellow-500">12</div></div>
        <div className="stat-card"><div className="stat-label">{t('critical_events', 'أحداث حرجة')}</div><div className="stat-value text-red-500">3</div></div>
      </div>

      <div className="flex space-x-2 space-x-reverse mb-4">
        <select className="input w-1/5"><option value="">{t('all_users', 'كل المستخدمين')}</option></select>
        <select className="input w-1/5"><option value="">{t('all_actions', 'كل الإجراءات')}</option></select>
        <select className="input w-1/5"><option value="">{t('all_modules', 'كل الوحدات')}</option></select>
        <input type="date" className="input w-1/5" />
        <input type="date" className="input w-1/5" />
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('time', 'الوقت')}</th><th>{t('user', 'المستخدم')}</th><th>{t('action', 'الإجراء')}</th><th>{t('module', 'الوحدة')}</th><th>{t('affected_entity', 'الكيان المتأثر')}</th><th>{t('ip_address', 'IP')}</th><th>{t('details', 'التفاصيل')}</th><th>{t('actions', 'إجراء')}</th>
          </tr>
        </thead>
        <tbody>
          {mockLogs.map((log) => (
            <tr key={log.id}>
              <td>{log.time}</td><td>{log.user}</td><td>{log.action}</td><td>{log.module}</td><td>{log.entity}</td><td>{log.ip}</td><td className="truncate max-w-xs">{log.details}</td>
              <td><button className="btn-secondary text-sm" onClick={() => { setSelectedLog(log); setIsModalOpen(true); }}>{t('details_btn', 'تفاصيل')}</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('audit_log_details', 'تفاصيل سجل المراجعة')}>
        {selectedLog && (
          <div className="space-y-4">
            <p><strong>{t('id', 'الرقم')}:</strong> {selectedLog.id} | <strong>{t('time', 'الوقت')}:</strong> {selectedLog.time}</p>
            <p><strong>{t('user', 'المستخدم')}:</strong> {selectedLog.user} | <strong>{t('ip_address', 'IP')}:</strong> {selectedLog.ip}</p>
            <p><strong>{t('action', 'الإجراء')}:</strong> {selectedLog.action} | <strong>{t('module', 'الوحدة')}:</strong> {selectedLog.module}</p>
            <h3 className="font-bold mt-4">{t('changes_comparison', 'مقارنة التغييرات (JSON)')}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-sm">
              <div className="bg-red-50 p-2 rounded border border-red-200">
                <p className="font-bold mb-2">{t('old_value', 'القيمة القديمة')}</p>
                <pre>{"{\n  \"status\": \"pending\",\n  \"limit\": 5000\n}"}</pre>
              </div>
              <div className="bg-green-50 p-2 rounded border border-green-200">
                <p className="font-bold mb-2">{t('new_value', 'القيمة الجديدة')}</p>
                <pre>{"{\n  \"status\": \"approved\",\n  \"limit\": 10000\n}"}</pre>
              </div>
            </div>
            <button className="btn-secondary w-full mt-4" onClick={() => setIsModalOpen(false)}>{t('close', 'إغلاق')}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

