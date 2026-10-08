import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

export default function SettingsPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(t('users_tab', 'المستخدمون'));
  
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setUsers(data.map((u: any) => ({ id: u.id, name: u.full_name, role: u.role, status: u.status || 'active', email: u.email })));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [settings, setSettings] = useState({
    mfa: true,
    maintenanceMode: false,
    autoBackup: true,
    emailNotifications: true
  });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSaveUser = async () => {
    if (editingUser.id) {
      const { error } = await supabase.from('profiles').update({ full_name: editingUser.name, role: editingUser.role, status: editingUser.status, email: editingUser.email }).eq('id', editingUser.id);
      if (error) { alert("Error: " + error.message); return; }
    } else {
      const { error } = await supabase.from('profiles').insert([{ full_name: editingUser.name, role: editingUser.role, status: editingUser.status, email: editingUser.email }]);
      if (error) { alert("Error: " + error.message); return; }
    }
    fetchUsers();
    setUserModalOpen(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm(t('confirm_delete_user', 'هل أنت متأكد من حذف هذا المستخدم؟'))) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) { alert("Error: " + error.message); return; }
      fetchUsers();
    }
  };

  const openNewUser = () => {
    setEditingUser({ name: '', role: t('support_officer', 'موظف دعم'), status: t('active', 'نشط'), email: '' });
    setUserModalOpen(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-johar-gold mb-6">{t('settings_system_title', 'الإعدادات والنظام')}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">{t('active_users', 'المستخدمين النشطين')}</div>
          <div className="stat-value">{users.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('system_status', 'حالة النظام')}</div>
          <div className="stat-value text-johar-success">{t('stable', 'مستقر')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('last_backup', 'آخر نسخة احتياطية')}</div>
          <div className="stat-value">{t('today_3am', 'اليوم 03:00 ص')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('version', 'الإصدار')}</div>
          <div className="stat-value">v1.0.0</div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-johar-gray-dark mb-6">
        <button 
          className={`pb-2 px-4 ${activeTab === t('users_tab', 'المستخدمون') ? 'border-b-2 border-johar-gold text-johar-gold' : 'text-johar-gray-light hover:text-white'}`}
          onClick={() => setActiveTab(t('users_tab', 'المستخدمون'))}
        >
          {t('users_tab', 'المستخدمون')}
        </button>
        <button 
          className={`pb-2 px-4 ${activeTab === t('system_settings_tab', 'إعدادات النظام') ? 'border-b-2 border-johar-gold text-johar-gold' : 'text-johar-gray-light hover:text-white'}`}
          onClick={() => setActiveTab(t('system_settings_tab', 'إعدادات النظام'))}
        >
          {t('system_settings_tab', 'إعدادات النظام')}
        </button>
      </div>

      {activeTab === t('users_tab', 'المستخدمون') && (
        <>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={openNewUser}>{t('new_user', '+ مستخدم جديد')}</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>{t('name', 'الاسم')}</th>
                  <th>{t('email', 'البريد الإلكتروني')}</th>
                  <th>{t('role', 'الصلاحية')}</th>
                  <th>{t('status', 'الحالة')}</th>
                  <th>{t('actions', 'إجراءات')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td><span className={`badge ${user.status === t('active', 'نشط') ? 'badge-success' : 'badge-danger'}`}>{user.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-secondary text-sm px-2 py-1" onClick={() => { setEditingUser(user); setUserModalOpen(true); }}>{t('edit', 'تعديل')}</button>
                        <button className="btn-danger text-sm px-2 py-1" onClick={() => handleDeleteUser(user.id)}>{t('delete', 'حذف')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === t('system_settings_tab', 'إعدادات النظام') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card flex flex-col gap-4">
            <h3 className="font-bold text-johar-gold border-b border-johar-gray-dark pb-2">{t('security_alerts_title', 'الأمان والتنبيهات')}</h3>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">{t('mfa_title', 'المصادقة الثنائية (MFA)')}</p>
                <p className="text-sm text-johar-gray-light">{t('mfa_desc', 'إلزام جميع الموظفين بتفعيل المصادقة الثنائية')}</p>
              </div>
              <button className={`px-4 py-1 rounded ${settings.mfa ? 'bg-johar-success text-black' : 'bg-johar-gray-dark'}`} onClick={() => handleToggle('mfa')}>
                {settings.mfa ? t('enabled', 'مفعل') : t('disabled', 'معطل')}
              </button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">{t('email_notif_title', 'إشعارات البريد الإلكتروني')}</p>
                <p className="text-sm text-johar-gray-light">{t('email_notif_desc', 'إرسال التنبيهات المهمة عبر الإيميل')}</p>
              </div>
              <button className={`px-4 py-1 rounded ${settings.emailNotifications ? 'bg-johar-success text-black' : 'bg-johar-gray-dark'}`} onClick={() => handleToggle('emailNotifications')}>
                {settings.emailNotifications ? t('enabled', 'مفعل') : t('disabled', 'معطل')}
              </button>
            </div>
          </div>

          <div className="card flex flex-col gap-4">
            <h3 className="font-bold text-johar-gold border-b border-johar-gray-dark pb-2">{t('system_maintenance_title', 'النظام والصيانة')}</h3>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">{t('maintenance_mode_title', 'وضع الصيانة')}</p>
                <p className="text-sm text-johar-gray-light">{t('maintenance_mode_desc', 'إيقاف النظام مؤقتاً للمستخدمين العاديين')}</p>
              </div>
              <button className={`px-4 py-1 rounded ${settings.maintenanceMode ? 'bg-johar-warning text-black' : 'bg-johar-gray-dark'}`} onClick={() => handleToggle('maintenanceMode')}>
                {settings.maintenanceMode ? t('enabled', 'مفعل') : t('disabled', 'معطل')}
              </button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">{t('auto_backup_title', 'النسخ الاحتياطي التلقائي')}</p>
                <p className="text-sm text-johar-gray-light">{t('auto_backup_desc', 'أخذ نسخة من قاعدة البيانات يومياً')}</p>
              </div>
              <button className={`px-4 py-1 rounded ${settings.autoBackup ? 'bg-johar-success text-black' : 'bg-johar-gray-dark'}`} onClick={() => handleToggle('autoBackup')}>
                {settings.autoBackup ? t('enabled', 'مفعل') : t('disabled', 'معطل')}
              </button>
            </div>
          </div>

          <div className="card col-span-2">
            <h3 className="font-bold text-johar-gold border-b border-johar-gray-dark pb-2 mb-4">{t('system_info', 'معلومات النظام')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div><span className="text-johar-gray-light block">{t('version', 'الإصدار')}:</span> <span className="font-mono">v1.0.0</span></div>
              <div><span className="text-johar-gray-light block">{t('last_update', 'آخر تحديث')}:</span> <span>{t('update_date', '18 سبتمبر 2026')}</span></div>
              <div><span className="text-johar-gray-light block">{t('db_provider', 'مزود قاعدة البيانات')}:</span> <span>Supabase</span></div>
              <div><span className="text-johar-gray-light block">{t('runtime_env', 'بيئة التشغيل')}:</span> <span>Production</span></div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser?.id ? t('edit_user', "تعديل مستخدم") : t('new_user', "مستخدم جديد")}>
        {editingUser && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-johar-gray-light mb-1">{t('name', 'الاسم')}</label>
              <input type="text" className="input w-full" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-johar-gray-light mb-1">{t('email', 'البريد الإلكتروني')}</label>
              <input type="email" className="input w-full" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-johar-gray-light mb-1">{t('role', 'الصلاحية')}</label>
              <select className="input w-full" value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}>
                <option value={t('system_admin', 'مدير نظام')}>{t('system_admin', 'مدير نظام')}</option>
                <option value={t('compliance_officer', 'موظف امتثال')}>{t('compliance_officer', 'موظف امتثال')}</option>
                <option value={t('support_officer', 'موظف دعم')}>{t('support_officer', 'موظف دعم')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-johar-gray-light mb-1">{t('status', 'الحالة')}</label>
              <select className="input w-full" value={editingUser.status} onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}>
                <option value={t('active', 'نشط')}>{t('active', 'نشط')}</option>
                <option value={t('suspended', 'موقوف')}>{t('suspended', 'موقوف')}</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn-primary" onClick={handleSaveUser}>{t('save_changes', 'حفظ التغييرات')}</button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

