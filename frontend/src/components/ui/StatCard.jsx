export default function StatCard({ label, value, icon: Icon, accent = 'indigo' }) {
  const accentClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {Icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${accentClasses[accent]}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}
