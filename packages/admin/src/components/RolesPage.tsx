import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { supabase } from '../supabase';

const MODULES = ['users', 'finance', 'lab', 'assets', 'kyc', 'contracts'];
const ACTIONS = ['view', 'add', 'edit', 'delete'];

export default function RolesPage() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<any>({});

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const { data } = await supabase.from('roles').select('*');
    if (data) setRoles(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete', 'هل أنت متأكد من الحذف؟'))) return;
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    fetchRoles();
  };

  const handleOpenNew = () => {
    setRoleName('');
    const defaultPerms: any = {};
    MODULES.forEach(m => {
      defaultPerms[m] = { view: false, add: false, edit: false, delete: false };
    });
    setRolePermissions(defaultPerms);
    setSelectedRole(null);
    setEditMode(false);
    setIsMatrixModalOpen(true);
  };

  const handleOpenEdit = (role: any) => {
    setRoleName(role.role_name);
    
    const perms = role.permissions || {};
    const loadedPerms: any = {};
    MODULES.forEach(m => {
      loadedPerms[m] = {
        view: perms[m]?.view || false,
        add: perms[m]?.add || false,
        edit: perms[m]?.edit || false,
        delete: perms[m]?.delete || false
      };
    });
    setRolePermissions(loadedPerms);
    setSelectedRole(role);
    setEditMode(true);
    setIsMatrixModalOpen(true);
  };

  const handleTogglePermission = (moduleName: string, actionName: string) => {
    setRolePermissions((prev: any) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [actionName]: !prev[moduleName][actionName]
      }
    }));
  };

  const handleSaveRole = async () => {
    if (!roleName) {
      alert(t('role_name_required', 'اسم الدور مطلوب'));
      return;
    }

    if (editMode && selectedRole) {
      const { error } = await supabase.from('roles').update({
        role_name: roleName,
        permissions: rolePermissions
      }).eq('id', selectedRole.id);
      if (error) { alert("Error: " + error.message); return; }
    } else {
      const { error } = await supabase.from('roles').insert([{
        role_name: roleName,
        permissions: rolePermissions
      }]);
      if (error) { alert("Error: " + error.message); return; }
    }

    setIsMatrixModalOpen(false);
    fetchRoles();
  };

  const countActivePermissions = (perms: any) => {
    if (!perms) return 0;
    let count = 0;
    Object.keys(perms).forEach(m => {
      Object.keys(perms[m]).forEach(a => {
        if (perms[m][a]) count++;
      });
    });
    return count;
  };

  return (
    <div dir="rtl" className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold johar-gold">{t('roles_and_permissions', 'الأدوار والصلاحيات')}</h1>
        <button className="btn-primary" onClick={handleOpenNew}>+ {t('new_role', 'دور جديد')}</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-label">{t('total_roles', 'الأدوار الكلية')}</div><div className="stat-value">{roles.length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('active_users', 'المستخدمون النشطون')}</div><div className="stat-value">26</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="card p-4 flex flex-col justify-between h-48 border border-gray-200 shadow-sm rounded-lg hover:shadow-md transition">
            <div>
              <h3 className="font-bold text-xl text-gray-800">{role.role_name}</h3>
              <p className="text-gray-500 text-sm mt-2">{t('permissions_count', 'عدد الصلاحيات الممنوحة')}: {countActivePermissions(role.permissions)}</p>
              <p className="text-gray-400 text-xs mt-1">{t('created_at', 'تاريخ الإنشاء')}: {new Date(role.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button className="btn-secondary flex-1 text-sm" onClick={() => handleOpenEdit(role)}>{t('edit_permissions', 'تعديل الصلاحيات')}</button>
              <button className="btn-danger flex-1 text-sm" onClick={() => handleDelete(role.id)}>{t('delete', 'حذف')}</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isMatrixModalOpen} onClose={() => setIsMatrixModalOpen(false)} title={editMode ? t('edit_role', 'تعديل الدور') : t('new_role', 'دور جديد')}>
        <div className="space-y-4 max-w-2xl w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('role_name', 'اسم الدور')}</label>
            <input 
              className="input w-full border-gray-300 rounded-md shadow-sm" 
              placeholder={t('role_name_placeholder', 'مثال: مدير النظام')} 
              value={roleName} 
              onChange={(e) => setRoleName(e.target.value)} 
            />
          </div>

          <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
            <table className="table w-full text-center text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-right text-gray-600 font-semibold">{t('module', 'الوحدة')}</th>
                  {ACTIONS.map(a => <th key={a} className="py-3 px-2 text-gray-600 font-semibold">{t(a, a.toUpperCase())}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {MODULES.map(mod => (
                  <tr key={mod} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-right text-gray-700">{t(`module_${mod}`, mod.toUpperCase())}</td>
                    {ACTIONS.map(act => (
                      <td key={act} className="py-3 px-2">
                        <input 
                          type="checkbox" 
                          className="form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                          checked={rolePermissions[mod]?.[act] || false} 
                          onChange={() => handleTogglePermission(mod, act)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse mt-6">
            <button className="btn-secondary px-6" onClick={() => setIsMatrixModalOpen(false)}>{t('cancel', 'إلغاء')}</button>
            <button className="btn-primary px-6" onClick={handleSaveRole}>{t('save_role', 'حفظ الدور')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
