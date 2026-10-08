import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function SecurityPage() {
  const { t } = useTranslation();
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  
  const [mockSessions, setMockSessions] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('security_sessions').select('*').order('login_time', { ascending: false }).then(({data}) => {
      if (data) setMockSessions(data);
    });
  }, []);
  

  useEffect(() => {
    fetchLogs();
  }, []);

  
  const handleDelete = async (id: any) => {
    const { error } = await supabase.from('security_logs').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchLogs();
  };

  const handleUpdateStatus = async (id: any, newStatus: string) => {
    const { error } = await supabase.from('security_logs').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchLogs();
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from('security_logs').select('*');
    if (data) setSecurityLogs(data);
  };

  return (
    <div dir="rtl" className="p-6">
      <h1 className="text-2xl font-bold johar-gold mb-6">{t('security_title', 'الأمن السيبراني')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('security_login_attempts', 'محاولات الدخول')}</div><div className="stat-value">1,024</div></div>
        <div className="stat-card"><div className="stat-label">{t('security_blocked', 'محظور')}</div><div className="stat-value">45</div></div>
        <div className="stat-card"><div className="stat-label">{t('security_active_sessions_stat', 'جلسات نشطة')}</div><div className="stat-value">12</div></div>
        <div className="stat-card"><div className="stat-label">{t('security_events_stat', 'أحداث الأمن')}</div><div className="stat-value">3</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-4">{t('security_incidents_title', 'حوادث الأمن')}</h2>
          <table className="table w-full">
            <thead><tr><th>{t('security_type', 'النوع')}</th><th>IP</th><th>{t('security_time', 'الوقت')}</th><th>{t('security_action', 'إجراء')}</th></tr></thead>
            <tbody>
              {securityLogs.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.type}</td><td>{ev.ip}</td><td>{ev.time}</td>
                  <td><button className="btn-secondary text-sm" onClick={() => { setSelectedIncident(ev); setIsIncidentModalOpen(true); }}>{t('security_details', 'تفاصيل')}</button>
    <button className="btn-danger ml-2" onClick={() => handleDelete(ev.id)}>{t('delete', 'حذف')}</button>
    <button className="btn-primary ml-2" onClick={() => {
      const s = prompt(t('enter_status', 'أدخل الحالة الجديدة'));
      if(s) handleUpdateStatus(ev.id, s);
    }}>{t('update_status', 'تحديث الحالة')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('security_active_sessions_title', 'الجلسات النشطة')}</h2>
            <button className="btn-danger text-sm" onClick={() => alert(t('security_all_sessions_terminated', 'تم إنهاء جميع الجلسات'))}>{t('security_terminate_all', 'إنهاء الكل')}</button>
          </div>
          <table className="table w-full">
            <thead><tr><th>{t('security_user', 'المستخدم')}</th><th>{t('security_ip_browser', 'IP / المتصفح')}</th><th>{t('security_login_time', 'الدخول')}</th><th>{t('security_action', 'إجراء')}</th></tr></thead>
            <tbody>
              {mockSessions.map(ses => (
                <tr key={ses.id}>
                  <td>{ses.user}</td><td>{ses.ip}<br/><span className="text-xs text-gray-500">{ses.browser}</span></td><td>{ses.loginTime}</td>
                  <td><button className="btn-danger text-sm" onClick={() => alert(t('security_session_terminated', 'إنهاء جلسة') + ` ${ses.id}`)}>{t('security_terminate_session', 'إنهاء الجلسة')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">{t('security_settings_title', 'إعدادات الأمن')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4"><h3>{t('security_2fa', 'المصادقة الثنائية (2FA)')}</h3><p className="text-green-500">{t('security_2fa_enabled', 'مفعلة إجبارياً')}</p></div>
          <div className="card p-4"><h3>{t('security_session_timeout', 'مهلة الجلسة')}</h3><p>{t('security_15_mins', '15 دقيقة')}</p></div>
          <div className="card p-4"><h3>{t('security_ip_whitelist', 'القائمة البيضاء للـ IP')}</h3><p>{t('security_3_addresses', '3 عناوين مسجلة')}</p></div>
          <div className="card p-4"><h3>{t('security_api_keys', 'مفاتيح API')}</h3><p>{t('security_2_keys', '2 مفتاح نشط')}</p></div>
        </div>
      </div>

      <Modal isOpen={isIncidentModalOpen} onClose={() => setIsIncidentModalOpen(false)} title={t('security_incident_details_title', 'تفاصيل حادث الأمن')}>
        {selectedIncident && (
          <div className="space-y-4">
            <p><strong>{t('security_type_label', 'النوع:')}</strong> {selectedIncident.type}</p>
            <p><strong>{t('security_ip_label', 'عنوان IP:')}</strong> {selectedIncident.ip}</p>
            <p><strong>{t('security_time_label', 'الوقت:')}</strong> {selectedIncident.time}</p>
            <div className="bg-gray-100 p-2 rounded text-sm font-mono">
              GET /api/admin/login HTTP/1.1<br/>
              User-Agent: curl/7.68.0
            </div>
            <button className="btn-danger w-full mt-4" onClick={() => alert(t('security_ip_blocked', 'تم حظر IP'))}>{t('security_block_ip', 'حظر IP')}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

