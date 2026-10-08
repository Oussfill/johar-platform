import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import Modal from './Modal';

export default function HRPage() {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({ full_name: '', worker_type: 'Full-Time', department: '', salary_payment: 0, status: 'Active' });

  const fetchWorkers = async () => {
    const { data } = await supabase.from('workers').select('*').order('created_at', { ascending: false });
    if (data) setWorkers(data);
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleSave = async () => {
    const { error } = await supabase.from('workers').insert([newWorker]);
    if (!error) {
      setIsModalOpen(false);
      fetchWorkers();
      setNewWorker({ full_name: '', worker_type: 'Full-Time', department: '', salary_payment: 0, status: 'Active' });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('workers').delete().eq('id', id);
    fetchWorkers();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-johar-white">{t('hr_management', 'HR Management')}</h2>
          <p className="text-johar-gray-light text-sm mt-1">{t('hr_desc', 'Manage workers, types, and salaries.')}</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>{t('add_worker', '+ Add Worker')}</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>{t('name', 'Name')}</th>
              <th>{t('type', 'Type')}</th>
              <th>{t('department', 'Department')}</th>
              <th>{t('salary', 'Salary')}</th>
              <th>{t('status', 'Status')}</th>
              <th>{t('actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id}>
                <td>{w.full_name}</td>
                <td>{w.worker_type}</td>
                <td>{w.department}</td>
                <td>${w.salary_payment}</td>
                <td>{w.status}</td>
                <td>
                  <button className="btn-danger px-3 py-1 text-sm" onClick={() => handleDelete(w.id)}>{t('delete', 'Delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('add_worker', 'Add Worker')}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('name', 'Name')}</label>
            <input className="input w-full" value={newWorker.full_name} onChange={(e) => setNewWorker({ ...newWorker, full_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('type', 'Type')}</label>
            <input className="input w-full" value={newWorker.worker_type} onChange={(e) => setNewWorker({ ...newWorker, worker_type: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('department', 'Department')}</label>
            <input className="input w-full" value={newWorker.department} onChange={(e) => setNewWorker({ ...newWorker, department: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-johar-gray-light mb-1">{t('salary', 'Salary')}</label>
            <input type="number" className="input w-full" value={newWorker.salary_payment} onChange={(e) => setNewWorker({ ...newWorker, salary_payment: parseFloat(e.target.value) })} />
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn-primary" onClick={handleSave}>{t('save', 'Save')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
