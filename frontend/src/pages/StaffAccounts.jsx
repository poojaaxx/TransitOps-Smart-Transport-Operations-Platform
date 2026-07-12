import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { userApi } from '../api/resources';
import { ROLES, ROLE_LABELS } from '../utils/roles';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextField, SelectField } from '../components/ui/Field';
import Spinner, { ErrorBanner } from '../components/ui/Spinner';

const emptyForm = { name: '', email: '', password: '', role: ROLES.FLEET_MANAGER };

export default function StaffAccounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await userApi.list();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await userApi.create(form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    await userApi.update(u._id, { isActive: !u.isActive });
    load();
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => ROLE_LABELS[r.role] || r.role },
    { key: 'isActive', label: 'Status', render: (r) => <Badge value={r.isActive ? 'Available' : 'Suspended'} label={r.isActive ? 'Active' : 'Disabled'} /> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button onClick={() => toggleActive(r)} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          {r.isActive ? 'Disable' : 'Enable'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Staff Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Provision logins for the 4 roles</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Account
        </Button>
      </div>

      {loading ? <Spinner /> : <DataTable columns={columns} rows={users} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Account">
        <form onSubmit={handleSubmit} className="space-y-3">
          <TextField label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <TextField label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <TextField label="Password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <SelectField
            label="Role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            options={Object.values(ROLES).map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          />
          <ErrorBanner message={error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
