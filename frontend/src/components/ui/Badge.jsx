const COLOR_MAP = {
  Available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  'On Trip': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'In Shop': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Retired: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  'Off Duty': 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  Suspended: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  Draft: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Dispatched: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  Active: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

export default function Badge({ value, label }) {
  const classes = COLOR_MAP[value] || 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {label ?? value}
    </span>
  );
}
