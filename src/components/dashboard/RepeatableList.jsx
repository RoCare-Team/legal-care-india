'use client';

import { Plus, Trash2 } from 'lucide-react';

/**
 * RepeatableList — generic add/remove list editor used for education,
 * certificates, awards and timing rows on the dashboard.
 *
 * @param {object} props
 * @param {Array} props.items
 * @param {(next:Array)=>void} props.onChange
 * @param {object} props.template            blank item appended on "Add"
 * @param {string} props.addLabel
 * @param {(item:object, update:(patch:object)=>void, index:number)=>import('react').ReactNode} props.renderRow
 */
export default function RepeatableList({ items, onChange, template, addLabel, renderRow }) {
  const update = (index) => (patch) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, { ...template }]);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="relative rounded-xl border border-ink/8 bg-muted/30 p-4 pr-12"
        >
          {renderRow(item, update(index), index)}
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label="Remove"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ink/20 px-3 py-2 text-sm font-medium text-ink/60 hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  );
}
