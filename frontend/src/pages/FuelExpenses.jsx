import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { fuelApi, expenseApi, vehicleApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { TextField, SelectField, TextAreaField } from '../components/ui/Field';
import Spinner from '../components/ui/Spinner';
import StatCard from '../components/ui/StatCard';

const EXPENSE_CATEGORIES = ['Toll', 'Maintenance', 'Insurance', 'Permit', 'Fine', 'Other'];

const emptyFuelForm = { vehicle: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10), odometerKm: '' };
const emptyExpenseForm = { vehicle: '', category: 'Toll', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' };

export default function FuelExpenses() {
  const { user } = useAuth();
  const canManage = user.role === ROLES.FLEET_MANAGER || user.role === ROLES.FINANCIAL_ANALYST;
  const canDelete = user.role === ROLES.FLEET_MANAGER;

  const [tab, setTab] = useState('fuel');
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState(emptyFuelForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [fRes, eRes, vRes] = await Promise.all([fuelApi.list(), expenseApi.list(), vehicleApi.list()]);
    setFuelLogs(fRes.data);
    setExpenses(eRes.data);
    setVehicles(vRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalExpenseAmount = expenses.reduce((s, e) => s + e.amount, 0);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fuelApi.create({
        ...fuelForm,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        odometerKm: fuelForm.odometerKm ? Number(fuelForm.odometerKm) : undefined,
      });
      setFuelModalOpen(false);
      setFuelForm(emptyFuelForm);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await expenseApi.create({ ...expenseForm, amount: Number(expenseForm.amount), vehicle: expenseForm.vehicle || undefined });
      setExpenseModalOpen(false);
      setExpenseForm(emptyExpenseForm);
      load();
    } finally {
      setSaving(false);
    }
  };

  const fuelColumns = [
    { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.registrationNumber || '—' },
    { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'liters', label: 'Liters' },
    { key: 'cost', label: 'Cost', render: (r) => `$${r.cost.toLocaleString()}` },
    { key: 'odometerKm', label: 'Odometer (km)', render: (r) => r.odometerKm ?? '—' },
    ...(canDelete
      ? [
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <button onClick={async () => { if (window.confirm('Delete this fuel log?')) { await fuelApi.remove(r._id); load(); } }} className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30">
                <Trash2 size={15} />
              </button>
            ),
          },
        ]
      : []),
  ];

  const expenseColumns = [
    { key: 'vehicle', label: 'Vehicle', render: (r) => r.vehicle?.registrationNumber || 'Fleet-wide' },
    { key: 'category', label: 'Category' },
    { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'amount', label: 'Amount', render: (r) => `$${r.amount.toLocaleString()}` },
    { key: 'notes', label: 'Notes', render: (r) => r.notes || '—' },
    ...(canDelete
      ? [
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <button onClick={async () => { if (window.confirm('Delete this expense?')) { await expenseApi.remove(r._id); load(); } }} className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30">
                <Trash2 size={15} />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fuel & Expense Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track fuel logs and other operational expenses</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatCard label="Total Fuel Cost" value={`$${totalFuelCost.toLocaleString()}`} accent="amber" />
        <StatCard label="Total Other Expenses" value={`$${totalExpenseAmount.toLocaleString()}`} accent="rose" />
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setTab('fuel')} className={`px-3 py-2 text-sm font-medium ${tab === 'fuel' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
          Fuel Logs
        </button>
        <button onClick={() => setTab('expenses')} className={`px-3 py-2 text-sm font-medium ${tab === 'expenses' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
          Expenses
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : tab === 'fuel' ? (
        <div className="space-y-3">
          {canManage && (
            <div className="flex justify-end">
              <Button onClick={() => setFuelModalOpen(true)}>
                <Plus size={16} /> Log Fuel
              </Button>
            </div>
          )}
          <DataTable columns={fuelColumns} rows={fuelLogs} emptyMessage="No fuel logs yet." />
        </div>
      ) : (
        <div className="space-y-3">
          {canManage && (
            <div className="flex justify-end">
              <Button onClick={() => setExpenseModalOpen(true)}>
                <Plus size={16} /> Log Expense
              </Button>
            </div>
          )}
          <DataTable columns={expenseColumns} rows={expenses} emptyMessage="No expenses logged yet." />
        </div>
      )}

      <Modal open={fuelModalOpen} onClose={() => setFuelModalOpen(false)} title="Log Fuel">
        <form onSubmit={handleFuelSubmit} className="space-y-3">
          <SelectField
            label="Vehicle"
            required
            value={fuelForm.vehicle}
            onChange={(e) => setFuelForm((f) => ({ ...f, vehicle: e.target.value }))}
            options={[{ value: '', label: 'Select a vehicle' }, ...vehicles.map((v) => ({ value: v._id, label: v.registrationNumber }))]}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Liters" type="number" min="0" required value={fuelForm.liters} onChange={(e) => setFuelForm((f) => ({ ...f, liters: e.target.value }))} />
            <TextField label="Cost" type="number" min="0" required value={fuelForm.cost} onChange={(e) => setFuelForm((f) => ({ ...f, cost: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Date" type="date" value={fuelForm.date} onChange={(e) => setFuelForm((f) => ({ ...f, date: e.target.value }))} />
            <TextField label="Odometer (km, optional)" type="number" min="0" value={fuelForm.odometerKm} onChange={(e) => setFuelForm((f) => ({ ...f, odometerKm: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFuelModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="Log Expense">
        <form onSubmit={handleExpenseSubmit} className="space-y-3">
          <SelectField
            label="Vehicle (optional — leave blank for fleet-wide expense)"
            value={expenseForm.vehicle}
            onChange={(e) => setExpenseForm((f) => ({ ...f, vehicle: e.target.value }))}
            options={[{ value: '', label: 'Fleet-wide' }, ...vehicles.map((v) => ({ value: v._id, label: v.registrationNumber }))]}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Category" value={expenseForm.category} onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))} options={EXPENSE_CATEGORIES} />
            <TextField label="Amount" type="number" min="0" required value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <TextField label="Date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} />
          <TextAreaField label="Notes" value={expenseForm.notes} onChange={(e) => setExpenseForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
