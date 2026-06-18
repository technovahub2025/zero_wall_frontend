import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SearchInput({ className = '', onClear, value, ...props }) {
  const showClear = Boolean(onClear && String(value || '').length);

  return (
    <label
      className={cn(
        'group flex h-14 items-center gap-3 rounded-3xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] px-4 text-sm text-slate-400 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.45)] transition focus-within:border-sky-400/40 focus-within:bg-[rgb(var(--panel-2)/0.96)] focus-within:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.55)]',
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 transition group-focus-within:text-sky-500" />
      <input
        {...props}
        value={value}
        className="min-w-0 flex-1 bg-transparent text-[rgb(var(--text))] outline-none placeholder:text-slate-400"
      />
      {showClear ? (
        <button
          type="button"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--panel)/0.72)] text-slate-400 transition hover:bg-[rgb(var(--panel)/0.96)] hover:text-[rgb(var(--text))]"
          onClick={onClear}
          aria-label="Clear search"
          title="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </label>
  );
}
