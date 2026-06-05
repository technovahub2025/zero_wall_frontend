import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../ui/button';

export function KanbanAddColumn({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  function handleSubmit() {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onAdd?.(nextTitle);
    setTitle('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        className="flex h-[calc(100vh-22rem)] min-h-[28rem] min-w-[280px] items-center justify-center rounded-[1.4rem] border border-dashed border-sky-300/30 bg-white/40 p-3 text-sm font-medium text-sky-600/90 shadow-sm transition hover:border-sky-400/50 hover:bg-sky-50/80"
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/70 px-4 py-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add column
        </span>
      </button>
    );
  }

  return (
    <div className="flex h-[calc(100vh-22rem)] min-h-[28rem] min-w-[280px] flex-col rounded-[1.4rem] border border-sky-300/30 bg-white/70 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-2 pb-3">
        <div className="text-sm font-semibold text-[rgb(var(--text))]">New column</div>
        <Button type="button" size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Cancel add column">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Column name</label>
        <input
          className="input mt-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="E.g. QA Review"
          autoFocus
        />
        <div className="mt-auto flex gap-2 pt-4">
          <Button type="button" size="sm" onClick={handleSubmit}>
            Add
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
