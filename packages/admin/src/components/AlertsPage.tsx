import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

type AlertType = 'critical' | 'warning' | 'info';

interface Alert {
  id: number;
  type: AlertType;
  title: string;
  description: string;
  time: string;
  entity: string;
  isRead: boolean;
}

export default function AlertsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | AlertType | 'read'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchData = () => {
    supabase.from('alerts').select('*').then(({ data }) => {
      if (data) setAlerts(data);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from('alerts').update({ status: newStatus }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const stats = {
    critical: alerts.filter(a => a.type === 'critical' && !a.isRead).length,
    warning: alerts.filter(a => a.type === 'warning' && !a.isRead).length,
    info: alerts.filter(a => a.type === 'info' && !a.isRead).length,
  };

  const markAsRead = async (id: number) => {
    const { error } = await supabase.from('alerts').update({ isRead: true }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const clearAll = () => {
    setAlerts(alerts.map(a => ({ ...a, isRead: true })));
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return !a.isRead;
    if (filter === 'read') return a.isRead;
    return a.type === filter && !a.isRead;
  });

  const filterOptions = [
    { value: 'all', label: t('filter_all', 'Ø§Ù„ÙƒÙ„') },
    { value: 'critical', label: t('filter_critical', 'Ø­Ø±Ø¬') },
    { value: 'warning', label: t('filter_warning', 'ØªØ­Ø°ÙŠØ±') },
    { value: 'info', label: t('filter_info', 'Ù…Ø¹Ù„ÙˆÙ…Ø©') },
    { value: 'read', label: t('filter_read', 'Ù…Ù‚Ø±ÙˆØ¡') },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen johar-black-lighter text-johar-gray-light" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gold-text">{t('alerts_title', 'Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª')}</h1>
        <button className="btn-secondary" onClick={clearAll}>{t('clear_all', 'Ù…Ø³Ø­ Ø§Ù„ÙƒÙ„')}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card card">
          <div className="stat-label">{t('critical_alerts', 'ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø­Ø±Ø¬Ø©')}</div>
          <div className="stat-value text-johar-danger">{stats.critical}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('warnings', 'ØªØ­Ø°ÙŠØ±Ø§Øª')}</div>
          <div className="stat-value text-johar-warning">{stats.warning}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">{t('informations', 'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª')}</div>
          <div className="stat-value text-johar-info">{stats.info}</div>
        </div>
      </div>

      <div className="flex space-x-4 space-x-reverse mb-4 border-b border-johar-gray-dark pb-2">
        {filterOptions.map(f => (
          <button 
            key={f.value} 
            className={`px-4 py-2 rounded ${filter === f.value ? 'bg-johar-gold text-johar-black' : 'text-johar-gray-mid hover:text-johar-gold'}`}
            onClick={() => setFilter(f.value as any)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-10 text-johar-gray-mid">{t('no_alerts', 'Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙ†Ø¨ÙŠÙ‡Ø§Øª')}</div>
        ) : (
          filteredAlerts.map(alert => (
            <div key={alert.id} className="card card-hover p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className={`w-3 h-3 rounded-full ${alert.type === 'critical' ? 'bg-johar-danger' : alert.type === 'warning' ? 'bg-johar-warning' : 'bg-johar-info'}`}></div>
                <div>
                  <h3 className="font-semibold text-lg">{alert.title}</h3>
                  <p className="text-sm text-johar-gray-mid">{alert.description} - {alert.entity}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <span className="text-xs text-johar-gray-mid">{alert.time}</span>
                {!alert.isRead && (
                  <>
                    <button className="btn-primary py-1 px-3 text-sm" onClick={() => setSelectedAlert(alert)}>{t('take_action', 'Ø§ØªØ®Ø§Ø° Ø¥Ø¬Ø±Ø§Ø¡')}</button>
                    <button className="btn-secondary py-1 px-3 text-sm" onClick={() => markAsRead(alert.id)}>{t('mark_as_read', 'ØªØ¹Ù„ÙŠÙ… ÙƒÙ…Ù‚Ø±ÙˆØ¡')}</button>
                    <button className="btn-danger py-1 px-3 text-sm" onClick={() => handleDelete(alert.id)}>{t('delete', 'Ø­Ø°Ù')}</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={!!selectedAlert} onClose={() => setSelectedAlert(null)} title={t('take_action_title', 'Ø§ØªØ®Ø§Ø° Ø¥Ø¬Ø±Ø§Ø¡')}>
        {selectedAlert && (
          <div className="space-y-4">
            <p><strong>{t('alert_label', 'Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡:')}</strong> {selectedAlert.title}</p>
            <p><strong>{t('description_label', 'Ø§Ù„ÙˆØµÙ:')}</strong> {selectedAlert.description}</p>
            <p><strong>{t('entity_label', 'Ø§Ù„ÙƒÙŠØ§Ù†:')}</strong> {selectedAlert.entity}</p>
            
            <div className="mt-6 flex space-x-2 space-x-reverse">
              <button className="btn-primary" onClick={() => { markAsRead(selectedAlert.id); setSelectedAlert(null); }}>{t('resolve_and_close', 'Ù…Ø¹Ø§Ù„Ø¬Ø© ÙˆØ¥ØºÙ„Ø§Ù‚')}</button>
              <button className="btn-secondary" onClick={() => setSelectedAlert(null)}>{t('postpone', 'ØªØ£Ø¬ÙŠÙ„')}</button>
              <button className="btn-danger" onClick={() => { handleDelete(selectedAlert.id); setSelectedAlert(null); }}>{t('ignore', 'ØªØ¬Ø§Ù‡Ù„')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}




