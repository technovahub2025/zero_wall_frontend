import { Check, ChevronDown, Filter, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { SearchInput } from '../shared/SearchInput';
import { cn } from '../../lib/utils';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'On Hold', value: 'On Hold' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const SEGMENT_OPTIONS = [
  { label: 'All Segments', value: 'all' },
  { label: 'Residential', value: 'Residential' },
  { label: 'Commercial', value: 'Commercial' },
  { label: 'Industrial', value: 'Industrial' },
  { label: 'Manufacturing', value: 'Manufacturing' },
];

const PRIORITY_OPTIONS = [
  { label: 'All Priorities', value: 'all' },
  { label: 'Critical', value: 'Critical' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
];

export function ProjectFilters({
  search,
  onSearchChange,
  filters,
  onChange,
  showFilters,
  onToggleFilters,
  selectedCount = 0,
  allSelected = false,
  onToggleAllSelection,
  onDeleteSelected,
}) {
  const [openField, setOpenField] = useState(null);

  useEffect(() => {
    if (!showFilters) {
      setOpenField(null);
    }
  }, [showFilters]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-2xl flex-1 items-center gap-2">
          <SearchInput
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects, clients, stages..."
            className="min-w-0"
          />
          <SortToggle value={filters.sort} onChange={(value) => onChange('sort', value)} />
          <Button
            type="button"
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={onToggleFilters}
            title="Toggle filters"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {showFilters ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.86)] px-4 py-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.72)] px-3 py-2 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.78)]"
              onClick={() => onToggleAllSelection?.(allSelected)}
            >
              <span className={`inline-flex h-4 w-4 items-center justify-center rounded border ${allSelected ? 'border-sky-500 bg-sky-500' : selectedCount ? 'border-sky-400 bg-sky-500/10' : 'border-[rgb(var(--line)/0.28)] bg-[rgb(var(--panel)/0.82)]'}`}>
                {allSelected ? <CheckMark /> : selectedCount ? <MinusMark /> : null}
              </span>
              {allSelected ? 'Unselect all' : 'Select all'}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{selectedCount} selected</span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={onDeleteSelected}
                disabled={!selectedCount}
                title="Delete selected projects permanently"
                aria-label="Delete selected projects permanently"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.72)] p-3 lg:grid-cols-3">
            <FilterField
              label="Status"
              value={filters.status}
              options={STATUS_OPTIONS}
              onChange={(value) => onChange('status', value)}
              placeholder="Select status"
              isOpen={openField === 'status'}
              onToggle={() => setOpenField((current) => (current === 'status' ? null : 'status'))}
              onClose={() => setOpenField(null)}
            />
            <FilterField
              label="Segment"
              value={filters.segment}
              options={SEGMENT_OPTIONS}
              onChange={(value) => onChange('segment', value)}
              placeholder="Select segment"
              isOpen={openField === 'segment'}
              onToggle={() => setOpenField((current) => (current === 'segment' ? null : 'segment'))}
              onClose={() => setOpenField(null)}
            />
            <FilterField
              label="Priority"
              value={filters.priority}
              options={PRIORITY_OPTIONS}
              onChange={(value) => onChange('priority', value)}
              placeholder="Select priority"
              isOpen={openField === 'priority'}
              onToggle={() => setOpenField((current) => (current === 'priority' ? null : 'priority'))}
              onClose={() => setOpenField(null)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckMark() {
  return <span className="block h-2 w-2 rounded-[2px] bg-white" />;
}

function MinusMark() {
  return <span className="block h-0.5 w-2 rounded-full bg-sky-500" />;
}

function SortToggle({ value, onChange }) {
  const isNewest = value !== 'oldest';

  return (
    <div className="relative inline-grid shrink-0 grid-cols-2 overflow-hidden rounded-full border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.86)] p-1 shadow-sm">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-sky-500 shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: isNewest ? 'translateX(100%)' : 'translateX(0%)' }}
      />
      <button
        type="button"
        className={cn(
          'relative z-10 rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-300 ease-out motion-reduce:transition-none',
          !isNewest ? 'text-white' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]',
        )}
        onClick={() => onChange('oldest')}
      >
        Oldest
      </button>
      <button
        type="button"
        className={cn(
          'relative z-10 rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-300 ease-out motion-reduce:transition-none',
          isNewest ? 'text-white' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]',
        )}
        onClick={() => onChange('newest')}
      >
        Newest
      </button>
    </div>
  );
}

function FilterField({ label, value, options, onChange, placeholder, isOpen, onToggle, onClose }) {
  const rootRef = useRef(null);
  const currentOption = useMemo(() => options.find((option) => option.value === value) || null, [options, value]);
  const isAllSelected = value === 'all';

  useEffect(() => {
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleEscape);
      };
    }

    return undefined;
  }, [isOpen, onClose]);

  return (
    <div ref={rootRef} className="relative rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.9)] p-4 shadow-[0_1px_0_rgba(255,255,255,0.5)_inset]">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">{label}</div>
      <button
        type="button"
        className={cn(
          'input flex w-full items-center justify-between gap-3 bg-[rgb(var(--panel)/0.98)] pr-3 text-left text-[rgb(var(--text))] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors',
          isOpen && 'ring-2 ring-sky-400/50',
        )}
        onClick={onToggle}
      >
        <span className={cn('truncate', currentOption || isAllSelected ? 'text-[rgb(var(--text))]' : 'text-[rgb(var(--muted))]')}>
          {currentOption?.label || placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-[rgb(var(--muted))] transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen ? (
        <div className="absolute left-4 right-4 top-[calc(100%-0px)] z-30 mt-2 overflow-hidden rounded-none border border-[rgb(var(--line)/0.22)] bg-[rgb(var(--panel)/0.98)] shadow-[0_18px_36px_rgba(15,23,42,0.14)] backdrop-blur">
          {options.map((option) => {
            const selected = option.value === value || (option.value === 'all' && isAllSelected);
            return (
              <button
                key={option.value || 'empty'}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors',
                  selected ? 'bg-sky-500/10 text-sky-500' : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--panel-2)/0.78)]',
                )}
                onClick={() => {
                  if (option.value === 'all') {
                    onChange(isAllSelected ? null : 'all');
                  } else {
                    onChange(option.value);
                  }
                  onClose();
                }}
              >
                <span>{option.label}</span>
                {selected ? <Check className="h-4 w-4 text-sky-600" /> : <span className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
