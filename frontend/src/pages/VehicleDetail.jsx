import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Trash2 } from 'lucide-react';
import { vehicleApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user.role === ROLES.FLEET_MANAGER;
  const fileInputRef = useRef(null);

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await vehicleApi.get(id);
    setVehicle(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      await vehicleApi.uploadDocument(id, formData);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Remove this document?')) return;
    await vehicleApi.deleteDocument(id, docId);
    load();
  };

  if (loading || !vehicle) return <Spinner />;

  const { costSummary } = vehicle;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/vehicles')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeft size={15} /> Back to Vehicle Registry
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {vehicle.registrationNumber} <span className="font-normal text-slate-500">— {vehicle.name}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{vehicle.type} · {vehicle.region}</p>
        </div>
        <Badge value={vehicle.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Fuel Cost" value={`$${costSummary.totalFuelCost.toLocaleString()}`} accent="amber" />
        <StatCard label="Total Maintenance Cost" value={`$${costSummary.totalMaintenanceCost.toLocaleString()}`} accent="rose" />
        <StatCard label="Total Operational Cost" value={`$${costSummary.totalOperationalCost.toLocaleString()}`} accent="indigo" />
        <StatCard label="Total Revenue" value={`$${costSummary.totalRevenue.toLocaleString()}`} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Vehicle Details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Max Load Capacity" value={`${vehicle.maxLoadCapacityKg.toLocaleString()} kg`} />
            <Row label="Odometer" value={`${vehicle.odometerKm.toLocaleString()} km`} />
            <Row label="Acquisition Cost" value={`$${vehicle.acquisitionCost.toLocaleString()}`} />
            <Row label="Completed Trips" value={costSummary.completedTrips} />
            <Row label="Total Distance" value={`${costSummary.totalDistance.toLocaleString()} km`} />
            <Row label="Total Fuel Used" value={`${costSummary.totalLiters.toLocaleString()} L`} />
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Documents</h2>
            {canManage && (
              <>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.png,.jpg,.jpeg,.webp" />
                <Button type="button" variant="secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </>
            )}
          </div>
          {vehicle.documents.length === 0 ? (
            <p className="text-sm text-slate-400">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {vehicle.documents.map((doc) => (
                <li key={doc._id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400">
                    <FileText size={15} /> {doc.name}
                  </a>
                  {canManage && (
                    <button onClick={() => handleDeleteDoc(doc._id)} className="text-rose-500 hover:text-rose-700">
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}
