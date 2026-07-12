import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Download, FileText } from 'lucide-react';
import client from '../api/client';
import { reportApi } from '../api/resources';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { CATEGORICAL, CHART_INK } from '../utils/chartColors';

async function downloadFile(url, filename) {
  const res = await client.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export default function Reports() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    reportApi.vehicles().then(({ data }) => {
      setReport(data);
      setLoading(false);
    });
  }, []);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'csv') await downloadFile(reportApi.csvUrl, `transitops-vehicle-report-${Date.now()}.csv`);
      else await downloadFile(reportApi.pdfUrl, `transitops-vehicle-report-${Date.now()}.pdf`);
    } catch {
      alert('Export failed');
    } finally {
      setExporting('');
    }
  };

  const columns = [
    { key: 'registrationNumber', label: 'Reg. No.' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'totalDistanceKm', label: 'Distance (km)' },
    { key: 'fuelEfficiencyKmPerL', label: 'Fuel Eff. (km/L)', render: (r) => r.fuelEfficiencyKmPerL ?? '—' },
    { key: 'operationalCost', label: 'Operational Cost', render: (r) => `$${r.operationalCost.toLocaleString()}` },
    { key: 'totalRevenue', label: 'Revenue', render: (r) => `$${r.totalRevenue.toLocaleString()}` },
    { key: 'roi', label: 'ROI', render: (r) => (r.roi !== null ? `${(r.roi * 100).toFixed(1)}%` : '—') },
  ];

  const chartData = report.map((r) => ({ name: r.registrationNumber, ROI: r.roi !== null ? Number((r.roi * 100).toFixed(1)) : 0 }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Per-vehicle fuel efficiency, operational cost, and ROI</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleExport('csv')} disabled={exporting === 'csv'}>
            <Download size={16} /> {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button variant="secondary" onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'}>
            <FileText size={16} /> {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Vehicle ROI (%)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART_INK.muted }} />
                <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} unit="%" />
                <Tooltip />
                <Bar dataKey="ROI" fill={CATEGORICAL.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <DataTable columns={columns} rows={report} emptyMessage="No vehicle data yet." />
        </>
      )}
    </div>
  );
}
