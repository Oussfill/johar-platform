import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function UsersPage() {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [mockUsers, setMockUsers] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const roles = [
    t('super_admin', 'Super Admin'), 
    t('compliance_officer', 'Compliance Officer'), 
    t('kyc_analyst', 'KYC Analyst'), 
    t('lab_manager', 'Lab Manager'), 
    t('finance_manager', 'Finance Manager'), 
    t('logistics_officer', 'Logistics Officer')
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setMockUsers(data);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchData();
    setIsProfileModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchData();
    setIsProfileModalOpen(false);
  };

  const handleUpdate = async () => {
    const roleSelect = document.getElementById('edit-role-select') as HTMLSelectElement;
    const statusSelect = document.getElementById('edit-status-select') as HTMLSelectElement;
    const { error } = await supabase.from('profiles').update({ role: roleSelect?.value, status: statusSelect?.value }).eq('id', selectedUser.id);
    if (error) { alert("Error: " + error.message); return; }
    fetchData();
    setIsEditModalOpen(false);
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.from('profiles').insert([{ full_name: newName, email: newEmail, role: newRole }]).select();
    if (error) { alert("Error: " + error.message); return; }
    if (data) {
      setIsNewModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewRole('');
      setNewPassword('');
      fetchData();
    }
  };

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('manage_users', 'إدارة المستخدمين')}</h1>
        <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>+ {t('new_user', 'مستخدم جديد')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('total', 'الكلي')}</div><div className="stat-value">145</div></div>
        <div className="stat-card"><div className="stat-label">{t('active', 'نشط')}</div><div className="stat-value">120</div></div>
        <div className="stat-card"><div className="stat-label">{t('inactive', 'غير نشط')}</div><div className="stat-value">20</div></div>
        <div className="stat-card"><div className="stat-label">{t('suspended', 'مُعلَّق')}</div><div className="stat-value">5</div></div>
      </div>

      <div className="flex space-x-2 space-x-reverse mb-4">
        <input type="text" placeholder={t('search_by_name', 'بحث بالاسم...')} className="input w-1/3" />
        <select className="input w-1/4"><option value="">{t('all_roles', 'كل الأدوار')}</option>{roles.map(r => <option key={r}>{r}</option>)}</select>
        <select className="input w-1/4"><option value="">{t('all_statuses', 'كل الحالات')}</option><option>{t('active', 'نشط')}</option><option>{t('inactive', 'غير نشط')}</option></select>
      </div>

      <table className="table w-full mb-4">
        <thead>
          <tr>
            <th>{t('name', 'الاسم')}</th><th>{t('email', 'البريد الإلكتروني')}</th><th>{t('role', 'الدور')}</th><th>{t('permissions', 'الإذونات')}</th><th>{t('last_active', 'آخر نشاط')}</th><th>{t('status', 'الحالة')}</th><th>{t('actions', 'إجراءات')}</th>
          </tr>
        </thead>
        <tbody>
          {mockUsers.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.permissions}</td><td>{u.lastActive}</td>
              <td><span className={`badge ${u.status === t('active', 'نشط') ? 'badge-success' : u.status === t('suspended', 'مُعلَّق') ? 'badge-danger' : 'badge-warning'}`}>{u.status}</span></td>
              <td className="space-x-2 space-x-reverse">
                <button className="btn-secondary text-sm" onClick={() => { setSelectedUser(u); setIsProfileModalOpen(true); }}>{t('view', 'عرض')}</button>
                <button className="btn-primary text-sm" onClick={() => { setSelectedUser(u); setIsEditModalOpen(true); }}>{t('edit', 'تعديل')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title={t('user_profile', 'ملف المستخدم')}>
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div><h3 className="font-bold text-xl">{selectedUser.name}</h3><p>{selectedUser.email}</p></div>
            </div>
            <p><strong>{t('role', 'الدور')}:</strong> {selectedUser.role}</p>
            <p><strong>{t('last_active', 'آخر نشاط')}:</strong> {selectedUser.lastActive}</p>
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button className="btn-warning flex-1" onClick={() => handleUpdateStatus(selectedUser.id, 'suspended')}>{t('suspend_account', 'تعليق الحساب')}</button>
              <button className="btn-secondary flex-1" onClick={() => alert(t('reset_link_sent', 'تم إرسال رابط الإعادة'))}>{t('reset_password', 'إعادة تعيين كلمة المرور')}</button>
              <button className="btn-danger flex-1" onClick={() => handleDelete(selectedUser.id)}>{t('delete', 'حذف')}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('edit_user', 'تعديل المستخدم')}>
        {selectedUser && (
          <div className="space-y-4">
            <select id="edit-role-select" className="input w-full" defaultValue={selectedUser.role}>{roles.map(r => <option key={r}>{r}</option>)}</select>
            <select id="edit-status-select" className="input w-full" defaultValue={selectedUser.status}><option>{t('active', 'نشط')}</option><option>{t('inactive', 'غير نشط')}</option><option>{t('suspended', 'مُعلَّق')}</option></select>
            <button className="btn-primary w-full" onClick={handleUpdate}>{t('save_changes', 'حفظ التعديلات')}</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title={t('new_user', 'مستخدم جديد')}>
        <div className="space-y-4">
          <input className="input w-full" placeholder={t('full_name', 'الاسم الكامل')} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="input w-full" placeholder={t('email', 'البريد الإلكتروني')} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <select className="input w-full" value={newRole} onChange={(e) => setNewRole(e.target.value)}><option value="">{t('select_role', 'اختر الدور')}</option>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select>
          <input className="input w-full" placeholder={t('temp_password', 'كلمة المرور المؤقتة')} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button className="btn-primary w-full" onClick={handleCreate}>{t('create_user', 'إنشاء المستخدم')}</button>
        </div>
      </Modal>
    </div>
  );
}

