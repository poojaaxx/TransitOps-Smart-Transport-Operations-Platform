import { useEffect, useState, useCallback } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { maintenanceApi, vehicleApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextField, SelectField, TextAreaField } from '../components/ui/Field';
import Spinner, { ErrorBanner } from '../components/ui/Spinner';

const emptyForm = { vehicle: '', description: '', cost: '', startDate: new Date().toISOString().slice(0, 10) };

export default function Maintenance() {
  const { user } = useAuth();
  const canManage = user.role === ROLES.FLEET_MANAGER;

  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await maintenanceApi.list({ status: statusFilter || undefined });
    setRecords(data);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = async () => {
    setError('');
    setForm(emptyForm);
    const { data } = await vehicleApi.list();
    setVehicles(data.filter((v) => v.status !== 'On Trip'));
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await maintenanceApi.create({ ...form, cost: Number(form.cost) || 0 });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create maintenance record');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (record) => {
    setActionError('');
    const cost = window.prompt('Final maintenance cost (optional, leave blank to keep current value):', record.cost);
    try {
      await maintenanceApi.close(record._id, cost !== null && cost !== '' ? { cost: Number(cost) } : {});
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to close maintenance record');
    }
  };

  const columns = [
    { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.registrationNumber || '—' },
    { key: 'description', label: 'Description' },
    { key: 'cost', label: 'Cost', render: (r) => `$${r.cost.toLocaleString()}` },
    { key: 'startDate', label: 'Start Date', render: (r) => new Date(r.startDate).toLocaleDateString() },
    { key: 'endDate', label: 'End Date', render: (r) => (r.endDate ? new Date(r.endDate).toLocaleDateString() : '—') },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ...(canManage
      ? [
          {
            key: 'actions',
            label: '',
            render: (r) =>
              r.status === 'Active' ? (
                <button title="Close" onClick={() => handleClose(r)} className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                  <CheckCircle2 size={16} />
                </button>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Maintenance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{records.length} records</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus size={16} /> New Maintenance Record
          </Button>
        )}
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <SelectField
          className="w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ value: '', label: 'All Statuses' }, { value: 'Active', label: 'Active' }, { value: 'Completed', label: 'Completed' }]}
        />
      </div>

      {loading ? <Spinner /> : <DataTable columns={columns} rows={records} emptyMessage="No maintenance records found." />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Maintenance Record">
        <form onSubmit={handleSubmit} className="space-y-3">
          <SelectField
            label="Vehicle"
            required
            value={form.vehicle}
            onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}
            options={[{ value: '', label: 'Select a vehicle' }, ...vehicles.map((v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.name} (${v.status})` }))]}
          />
          <TextAreaField label="Description" required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Cost" type="number" min="0" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} />
            <TextField label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Creating this record will set the vehicle's status to "In Shop" and remove it from dispatch selection.</p>
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
