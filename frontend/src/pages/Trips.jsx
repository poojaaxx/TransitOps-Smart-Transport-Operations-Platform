import { useEffect, useState, useCallback } from 'react';
import { Plus, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';
import { tripApi, vehicleApi, driverApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextField, SelectField } from '../components/ui/Field';
import Spinner, { ErrorBanner } from '../components/ui/Spinner';

const STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

const emptyForm = {
  source: '',
  destination: '',
  vehicle: '',
  driver: '',
  cargoWeightKg: '',
  plannedDistanceKm: '',
  revenue: '',
};

export default function Trips() {
  const { user } = useAuth();
  const canManage = user.role === ROLES.FLEET_MANAGER;

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tripApi.list({ status: statusFilter || undefined });
    const scoped = user.role === ROLES.DRIVER && user.driver ? data.filter((t) => t.driver?._id === user.driver) : data;
    setTrips(scoped);
    setLoading(false);
  }, [statusFilter, user]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = async () => {
    setError('');
    setForm(emptyForm);
    const [vRes, dRes] = await Promise.all([vehicleApi.available(), driverApi.available()]);
    setAvailableVehicles(vRes.data);
    setAvailableDrivers(dRes.data);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await tripApi.create({
        ...form,
        cargoWeightKg: Number(form.cargoWeightKg),
        plannedDistanceKm: Number(form.plannedDistanceKm),
        revenue: form.revenue ? Number(form.revenue) : 0,
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action, trip) => {
    setActionError('');
    try {
      if (action === 'dispatch') await tripApi.dispatch(trip._id);
      if (action === 'complete') await tripApi.complete(trip._id, {});
      if (action === 'cancel') await tripApi.cancel(trip._id);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${action} trip`);
    }
  };

  const columns = [
    { key: 'source', label: 'Source' },
    { key: 'destination', label: 'Destination' },
    { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.registrationNumber || '—' },
    { key: 'driver', label: 'Driver', render: (r) => r.driver?.name || '—' },
    { key: 'cargoWeightKg', label: 'Cargo (kg)' },
    { key: 'plannedDistanceKm', label: 'Distance (km)' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    ...(canManage
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (r) => (
              <div className="flex gap-1.5">
                {r.status === 'Draft' && (
                  <button title="Dispatch" onClick={() => runAction('dispatch', r)} className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                    <PlayCircle size={16} />
                  </button>
                )}
                {r.status === 'Dispatched' && (
                  <button title="Complete" onClick={() => runAction('complete', r)} className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                    <CheckCircle2 size={16} />
                  </button>
                )}
                {['Draft', 'Dispatched'].includes(r.status) && (
                  <button title="Cancel" onClick={() => runAction('cancel', r)} className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30">
                    <XCircle size={16} />
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {user.role === ROLES.DRIVER ? 'My Trips' : 'Trip Management'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{trips.length} trips</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus size={16} /> New Trip
          </Button>
        )}
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <SelectField className="w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Statuses' }, ...STATUSES]} />
      </div>

      {loading ? <Spinner /> : <DataTable columns={columns} rows={trips} emptyMessage="No trips found." />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Trip">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Source" required value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
            <TextField label="Destination" required value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} />
          </div>
          <SelectField
            label="Vehicle (Available pool only)"
            required
            value={form.vehicle}
            onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}
            options={[
              { value: '', label: availableVehicles.length ? 'Select a vehicle' : 'No available vehicles' },
              ...availableVehicles.map((v) => ({ value: v._id, label: `${v.registrationNumber} — ${v.name} (max ${v.maxLoadCapacityKg}kg)` })),
            ]}
          />
          <SelectField
            label="Driver (Available pool only)"
            required
            value={form.driver}
            onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))}
            options={[
              { value: '', label: availableDrivers.length ? 'Select a driver' : 'No available drivers' },
              ...availableDrivers.map((d) => ({ value: d._id, label: `${d.name} (${d.licenseCategory})` })),
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Cargo Weight (kg)" type="number" min="0" required value={form.cargoWeightKg} onChange={(e) => setForm((f) => ({ ...f, cargoWeightKg: e.target.value }))} />
            <TextField label="Planned Distance (km)" type="number" min="0" required value={form.plannedDistanceKm} onChange={(e) => setForm((f) => ({ ...f, plannedDistanceKm: e.target.value }))} />
          </div>
          <TextField label="Expected Revenue (optional)" type="number" min="0" value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} />
          <ErrorBanner message={error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Draft Trip'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
