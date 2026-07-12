const VARIANTS = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-indigo-300 dark:disabled:bg-indigo-900',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white disabled:bg-rose-300',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200',
};

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
