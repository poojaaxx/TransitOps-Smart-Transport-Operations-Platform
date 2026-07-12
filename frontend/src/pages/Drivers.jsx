import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, MailCheck } from 'lucide-react';
import { driverApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextField, SelectField } from '../components/ui/Field';
import Spinner, { ErrorBanner } from '../components/ui/Spinner';

const CATEGORIES = ['LMV', 'HMV', 'HGV', 'PSV', 'Motorcycle', 'Other'];
const STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const emptyForm = {
  name: '',
  licenseNumber: '',
  licenseCategory: 'LMV',
  licenseExpiryDate: '',
  contactNumber: '',
  email: '',
  safetyScore: 100,
  status: 'Available',
};

const REMINDER_WINDOW_DAYS = 30;

function licenseFlag(dateStr) {
  const expiry = new Date(dateStr);
  const now = new Date();
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Expired', className: 'text-rose-600 dark:text-rose-400 font-medium' };
  if (daysLeft <= REMINDER_WINDOW_DAYS) return { label: `${daysLeft}d left`, className: 'text-amber-600 dark:text-amber-400 font-medium' };
  return { label: `${daysLeft}d left`, className: 'text-slate-500 dark:text-slate-400' };
}

export default function Drivers() {
  const { user } = useAuth();
  const canManage = user.role === ROLES.FLEET_MANAGER || user.role === ROLES.SAFETY_OFFICER;
  const canDelete = user.role === ROLES.FLEET_MANAGER;

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reminderStatus, setReminderStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await driverApi.list({ search: search || undefined, status: statusFilter || undefined, sortBy, sortDir });
    setDrivers(data);
    setLoading(false);
  }, [search, statusFilter, sortBy, sortDir]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (driver) => {
    setEditing(driver);
    setForm({ ...driver, licenseExpiryDate: driver.licenseExpiryDate.slice(0, 10) });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, safetyScore: Number(form.safetyScore) };
      if (editing) await driverApi.update(editing._id, payload);
      else await driverApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Delete driver ${driver.name}? This cannot be undone.`)) return;
    try {
      await driverApi.remove(driver._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete driver');
    }
  };

  const handleCheckReminders = async () => {
    setReminderStatus('Checking...');
    try {
      const { data } = await driverApi.checkLicenseReminders();
      setReminderStatus(`Checked ${data.checked} driver(s) within the reminder window. See server console / email log for details.`);
    } catch (err) {
      setReminderStatus(err.response?.data?.message || 'Failed to run reminder check');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortKey: 'name' },
    { key: 'licenseNumber', label: 'License No.', sortKey: 'licenseNumber' },
    { key: 'licenseCategory', label: 'Category' },
    {
      key: 'licenseExpiryDate',
      label: 'License Expiry',
      sortKey: 'licenseExpiryDate',
      render: (r) => {
        const flag = licenseFlag(r.licenseExpiryDate);
        return (
          <span>
            {new Date(r.licenseExpiryDate).toLocaleDateString()} <span className={`ml-1 text-xs ${flag.className}`}>({flag.label})</span>
          </span>
        );
      },
    },
    { key: 'contactNumber', label: 'Contact' },
    { key: 'safetyScore', label: 'Safety Score', sortKey: 'safetyScore' },
    { key: 'status', label: 'Status', sortKey: 'status', render: (r) => <Badge value={r.status} /> },
    ...(canManage
      ? [
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(r)} className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Pencil size={15} />
                </button>
                {canDelete && (
                  <button onClick={() => handleDelete(r)} className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Driver Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{drivers.length} drivers</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="secondary" onClick={handleCheckReminders}>
              <MailCheck size={16} /> Check License Reminders
            </Button>
          )}
          {canManage && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Add Driver
            </Button>
          )}
        </div>
      </div>

      {reminderStatus && <ErrorBanner message={reminderStatus} />}

      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="relative w-56">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" />
          <input
            className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
            placeholder="Search name or license no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SelectField className="w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Statuses' }, ...STATUSES]} />
      </div>

      {loading ? <Spinner /> : <DataTable columns={columns} rows={drivers} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <TextField label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="License Number" required value={form.licenseNumber} onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))} />
            <SelectField label="License Category" value={form.licenseCategory} onChange={(e) => setForm((f) => ({ ...f, licenseCategory: e.target.value }))} options={CATEGORIES} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="License Expiry Date" type="date" required value={form.licenseExpiryDate} onChange={(e) => setForm((f) => ({ ...f, licenseExpiryDate: e.target.value }))} />
            <SelectField label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} options={STATUSES} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Contact Number" required value={form.contactNumber} onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))} />
            <TextField label="Email (for reminders)" type="email" value={form.email || ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <TextField label="Safety Score (0-100)" type="number" min="0" max="100" value={form.safetyScore} onChange={(e) => setForm((f) => ({ ...f, safetyScore: e.target.value }))} />
          <ErrorBanner message={error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
