import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { vehicleApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextField, SelectField } from '../components/ui/Field';
import Spinner, { ErrorBanner } from '../components/ui/Spinner';

const TYPES = ['Truck', 'Van', 'Bus', 'Car', 'Trailer', 'Other'];
const STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

const emptyForm = {
  registrationNumber: '',
  name: '',
  type: 'Truck',
  maxLoadCapacityKg: '',
  odometerKm: '',
  acquisitionCost: '',
  status: 'Available',
  region: '',
};

export default function Vehicles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user.role === ROLES.FLEET_MANAGER;

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await vehicleApi.list({
      search: search || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      sortBy,
      sortDir,
    });
    setVehicles(data);
    setLoading(false);
  }, [search, typeFilter, statusFilter, sortBy, sortDir]);

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

  const openEdit = (vehicle) => {
    setEditing(vehicle);
    setForm({ ...vehicle });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        maxLoadCapacityKg: Number(form.maxLoadCapacityKg),
        odometerKm: Number(form.odometerKm),
        acquisitionCost: Number(form.acquisitionCost),
      };
      if (editing) await vehicleApi.update(editing._id, payload);
      else await vehicleApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Delete vehicle ${vehicle.registrationNumber}? This cannot be undone.`)) return;
    try {
      await vehicleApi.remove(vehicle._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const columns = [
    { key: 'registrationNumber', label: 'Reg. No.', sortKey: 'registrationNumber', render: (r) => <button className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" onClick={() => navigate(`/vehicles/${r._id}`)}>{r.registrationNumber}</button> },
    { key: 'name', label: 'Name / Model', sortKey: 'name' },
    { key: 'type', label: 'Type', sortKey: 'type' },
    { key: 'maxLoadCapacityKg', label: 'Max Load (kg)', sortKey: 'maxLoadCapacityKg' },
    { key: 'odometerKm', label: 'Odometer (km)', sortKey: 'odometerKm' },
    { key: 'acquisitionCost', label: 'Acquisition Cost', sortKey: 'acquisitionCost', render: (r) => `$${r.acquisitionCost.toLocaleString()}` },
    { key: 'region', label: 'Region' },
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
                <button onClick={() => handleDelete(r)} className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30">
                  <Trash2 size={15} />
                </button>
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Vehicle Registry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{vehicles.length} vehicles</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Vehicle
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="relative w-56">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" />
          <input
            className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
            placeholder="Search reg. no. or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SelectField className="w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={[{ value: '', label: 'All Types' }, ...TYPES]} />
        <SelectField className="w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Statuses' }, ...STATUSES]} />
      </div>

      {loading ? <Spinner /> : <DataTable columns={columns} rows={vehicles} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <TextField label="Registration Number" required value={form.registrationNumber} onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))} />
          <TextField label="Vehicle Name / Model" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={TYPES} />
            <SelectField label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} options={STATUSES} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Max Load Capacity (kg)" type="number" min="0" required value={form.maxLoadCapacityKg} onChange={(e) => setForm((f) => ({ ...f, maxLoadCapacityKg: e.target.value }))} />
            <TextField label="Odometer (km)" type="number" min="0" required value={form.odometerKm} onChange={(e) => setForm((f) => ({ ...f, odometerKm: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Acquisition Cost" type="number" min="0" required value={form.acquisitionCost} onChange={(e) => setForm((f) => ({ ...f, acquisitionCost: e.target.value }))} />
            <TextField label="Region" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
          </div>
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
