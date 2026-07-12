import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Truck, CheckCircle2, Wrench, Route, Clock, Users, Gauge } from 'lucide-react';
import { dashboardApi, vehicleApi } from '../api/resources';
import StatCard from '../components/ui/StatCard';
import { SelectField } from '../components/ui/Field';
import Spinner from '../components/ui/Spinner';
import { VEHICLE_STATUS_COLORS, TRIP_STATUS_COLORS, CHART_INK } from '../utils/chartColors';

const VEHICLE_TYPES = ['Truck', 'Van', 'Bus', 'Car', 'Trailer', 'Other'];
const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

export default function Dashboard() {
  const [filters, setFilters] = useState({ type: '', status: '', region: '' });
  const [kpis, setKpis] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const [kpiRes, breakdownRes, trendRes] = await Promise.all([
      dashboardApi.kpis(params),
      dashboardApi.statusBreakdown(params),
      dashboardApi.tripsTrend({ days: 14 }),
    ]);
    setKpis(kpiRes.data);
    setBreakdown(breakdownRes.data);
    setTrend(trendRes.data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    vehicleApi.list().then(({ data }) => {
      setRegions([...new Set(data.map((v) => v.region).filter(Boolean))]);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Fleet overview and live operational KPIs</p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <SelectField
          className="w-40"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          options={[{ value: '', label: 'All Types' }, ...VEHICLE_TYPES.map((t) => ({ value: t, label: t }))]}
        />
        <SelectField
          className="w-40"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          options={[{ value: '', label: 'All Statuses' }, ...VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))]}
        />
        <SelectField
          className="w-40"
          value={filters.region}
          onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
          options={[{ value: '', label: 'All Regions' }, ...regions.map((r) => ({ value: r, label: r }))]}
        />
      </div>

      {loading || !kpis ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Active Vehicles" value={kpis.activeVehicles} icon={Truck} accent="indigo" />
            <StatCard label="Available Vehicles" value={kpis.availableVehicles} icon={CheckCircle2} accent="emerald" />
            <StatCard label="In Maintenance" value={kpis.inMaintenanceVehicles} icon={Wrench} accent="amber" />
            <StatCard label="Active Trips" value={kpis.activeTrips} icon={Route} accent="blue" />
            <StatCard label="Pending Trips" value={kpis.pendingTrips} icon={Clock} accent="amber" />
            <StatCard label="Drivers On Duty" value={kpis.driversOnDuty} icon={Users} accent="indigo" />
            <StatCard label="Fleet Utilization" value={`${kpis.fleetUtilization}%`} icon={Gauge} accent="rose" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Vehicle Status Breakdown</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={breakdown} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {breakdown.map((entry) => (
                      <Cell key={entry.status} fill={VEHICLE_STATUS_COLORS[entry.status] || CHART_INK.muted} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Trip Activity (last 14 days)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART_INK.muted }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Dispatched" stackId="a" fill={TRIP_STATUS_COLORS.Dispatched} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Completed" stackId="a" fill={TRIP_STATUS_COLORS.Completed} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Cancelled" stackId="a" fill={TRIP_STATUS_COLORS.Cancelled} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
