import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function SupportPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [mockTickets, setMockTickets] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const mockKB: any[] = []; // Replaced by real support docs later

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('support_tickets').select('*');
    if (data) setMockTickets(data);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('support_tickets').update({ status: newStatus }).eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchData();
    setIsTicketModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('support_tickets').delete().eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchData();
    setIsTicketModalOpen(false);
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('support_tickets').insert([{ user_id: 'system', subject: newSubject, message: newDesc, status: 'open' }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setIsNewTicketOpen(false);
      setNewSubject('');
      setNewDesc('');
      fetchData();
    }
  };

  return (
    <div dir="rtl" className="p-6">
      <h1 className="text-2xl font-bold johar-gold mb-6">{t('technical_support', 'الدعم الفني')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('total_tickets', 'التذاكر الكلية')}</div><div className="stat-value">1,540</div></div>
        <div className="stat-card"><div className="stat-label">{t('open', 'مفتوح')}</div><div className="stat-value">45</div></div>
        <div className="stat-card"><div className="stat-label">{t('in_progress', 'قيد المعالجة')}</div><div className="stat-value">12</div></div>
        <div className="stat-card"><div className="stat-label">{t('closed', 'مغلق')}</div><div className="stat-value">1,483</div></div>
      </div>

      <div className="flex space-x-4 space-x-reverse mb-6 border-b pb-2">
        <button className={`font-bold ${activeTab === 'tickets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} onClick={() => setActiveTab('tickets')}>{t('tickets', 'التذاكر')}</button>
        <button className={`font-bold ${activeTab === 'kb' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} onClick={() => setActiveTab('kb')}>{t('knowledge_base', 'قاعدة المعرفة')}</button>
      </div>

      {activeTab === 'tickets' && (
        <div>
          <button className="btn-primary mb-4" onClick={() => setIsNewTicketOpen(true)}>+ {t('new_ticket', 'تذكرة جديدة')}</button>
          <table className="table w-full mb-4">
            <thead><tr><th>{t('ticket_id', 'رقم التذكرة')}</th><th>{t('subject', 'الموضوع')}</th><th>{t('user', 'المستخدم')}</th><th>{t('priority', 'الأولوية')}</th><th>{t('status', 'الحالة')}</th><th>{t('creation_date', 'تاريخ الإنشاء')}</th><th>{t('actions', 'إجراءات')}</th></tr></thead>
            <tbody>
              {mockTickets.map((tck) => (
                <tr key={tck.id}>
                  <td>{tck.id}</td><td>{tck.subject}</td><td>{tck.user}</td>
                  <td><span className={`badge ${tck.priority === t('high', 'عالي') ? 'badge-danger' : 'badge-info'}`}>{tck.priority}</span></td>
                  <td><span className={`badge ${tck.status === t('closed', 'مغلق') ? 'badge-success' : 'badge-warning'}`}>{tck.status}</span></td>
                  <td>{tck.date}</td>
                  <td><button className="btn-secondary text-sm" onClick={() => { setSelectedTicket(tck); setIsTicketModalOpen(true); }}>{t('view', 'عرض')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'kb' && (
        <div>
          <input className="input w-full mb-4" placeholder={t('search_kb', 'بحث في قاعدة المعرفة...')} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockKB.map(kb => (
              <div key={kb.id} className="card p-4 flex justify-between items-center">
                <div><h3 className="font-bold">{kb.title}</h3><p className="text-sm text-gray-500">{kb.category}</p></div>
                <button className="btn-secondary text-sm" onClick={() => { setSelectedArticle(kb); setIsArticleModalOpen(true); }}>{t('view', 'عرض')}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title={t('ticket_details', 'تفاصيل التذكرة')}>
        {selectedTicket && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{selectedTicket.subject}</h3>
            <div className="h-64 overflow-y-auto bg-gray-50 p-4 rounded border space-y-4">
              <div className="bg-white p-2 rounded shadow w-3/4"><strong>{t('customer', 'العميل')}:</strong> {t('customer_msg_1', 'أواجه مشكلة في الدفع.')}</div>
              <div className="bg-blue-100 p-2 rounded shadow w-3/4 mr-auto"><strong>{t('support', 'الدعم')}:</strong> {t('support_msg_1', 'سنقوم بفحص المشكلة فوراً.')}</div>
            </div>
            <textarea className="input w-full h-20" placeholder={t('write_reply', 'اكتب ردك...')} value={replyText} onChange={e => setReplyText(e.target.value)}></textarea>
            <div className="flex justify-between items-center">
              <button className="btn-primary" onClick={() => { handleUpdateStatus(selectedTicket.id, 'Replied'); setReplyText(''); }}>{t('send_reply', 'إرسال الرد')}</button>
              <div className="space-x-2 space-x-reverse">
                <button className="btn-success text-sm" onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}>{t('close', 'إغلاق')}</button>
                <button className="btn-danger text-sm" onClick={() => handleUpdateStatus(selectedTicket.id, 'escalated')}>{t('escalate', 'تصعيد')}</button>
                <button className="btn-secondary text-sm" onClick={() => handleDelete(selectedTicket.id)}>{t('delete', 'حذف')}</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewTicketOpen} onClose={() => setIsNewTicketOpen(false)} title={t('new_ticket', 'تذكرة جديدة')}>
        <div className="space-y-4">
          <input className="input w-full" placeholder={t('subject', 'الموضوع')} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
          <textarea className="input w-full h-32" placeholder={t('issue_description', 'وصف المشكلة...')} value={newDesc} onChange={(e) => setNewDesc(e.target.value)}></textarea>
          <button className="btn-primary w-full" onClick={handleCreate}>{t('submit_ticket', 'إرسال التذكرة')}</button>
        </div>
      </Modal>

      <Modal isOpen={isArticleModalOpen} onClose={() => setIsArticleModalOpen(false)} title={selectedArticle?.title || t('article', 'مقال')}>
        <div className="p-4 space-y-4">
          <p>{t('article_content_placeholder', 'هذا نص افتراضي لمقال قاعدة المعرفة. يشرح الخطوات بالتفصيل لحل المشكلة.')}</p>
          <button className="btn-secondary w-full" onClick={() => setIsArticleModalOpen(false)}>{t('close', 'إغلاق')}</button>
        </div>
      </Modal>
    </div>
  );
}

