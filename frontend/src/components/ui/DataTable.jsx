import { ChevronUp, ChevronDown } from 'lucide-react';

export default function DataTable({ columns, rows, sortBy, sortDir, onSort, emptyMessage = 'No records found.' }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800/60">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={col.sortKey ? () => onSort(col.sortKey) : undefined}
                className={`whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${
                  col.sortKey ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200' : ''
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortKey && sortBy === col.sortKey && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
