import { Inbox } from 'lucide-react';

/**
 * AdminPageHeader — title + count for an admin section.
 */
export function AdminPageHeader({ title, subtitle, count }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink/55">{subtitle}</p>}
      </div>
      {typeof count === 'number' && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-sm font-semibold text-ink/70 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {count} total
        </span>
      )}
    </div>
  );
}

/**
 * AdminAvatar — small initials chip used in the first column of tables.
 */
export function AdminAvatar({ name = '', tone = 'bg-primary/10 text-primary' }) {
  const initial = name.replace(/^Adv\.?\s*/i, '').charAt(0).toUpperCase() || '?';
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${tone}`}>
      {initial}
    </span>
  );
}

/**
 * DataTable — a polished, responsive read-only table for the admin panel.
 *
 * @param {object} props
 * @param {Array<{key:string,label:string,render?:(row:any)=>any,className?:string}>} props.columns
 * @param {Array} props.rows
 * @param {(row:any)=>string} [props.rowKey]
 * @param {string} [props.empty]
 */
export default function DataTable({ columns, rows, rowKey, empty = 'Nothing here yet.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-surface py-20 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
          <Inbox className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-ink/60">{empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-gradient-to-b from-ink/[0.03] to-ink/[0.01] text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-ink/40"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row) : row.id || i}
                className="border-b border-ink/6 transition-colors last:border-0 hover:bg-primary/[0.03]"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-4 align-middle text-ink/75 ${c.className || ''}`}>
                    {c.render ? c.render(row) : row[c.key] || <span className="text-ink/30">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
