const baseInput =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

export function TextField({ label, error, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <input className={baseInput} {...props} />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function SelectField({ label, options, error, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <select className={baseInput} {...props}>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function TextAreaField({ label, error, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <textarea className={baseInput} rows={3} {...props} />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
