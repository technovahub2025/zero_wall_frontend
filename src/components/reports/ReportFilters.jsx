import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarRange, ChevronDown, Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { DropdownField } from '../shared/DropdownField';
import { FilterChips } from '../shared/FilterChips';
import { DatePickerField } from '../shared/DatePickerField';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'last-12-months', label: 'Last 12 months' },
  { value: 'this-year', label: 'This year' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
];

const PROJECT_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active', tone: 'blue' },
  { value: 'Completed', label: 'Completed', tone: 'emerald' },
  { value: 'Delayed', label: 'Delayed', tone: 'rose' },
  { value: 'On Hold', label: 'On Hold', tone: 'amber' },
];

const PRIORITY_OPTIONS = [
  { value: 'Critical', label: 'Critical', tone: 'rose' },
  { value: 'High', label: 'High', tone: 'amber' },
  { value: 'Medium', label: 'Medium', tone: 'blue' },
  { value: 'Low', label: 'Low', tone: 'emerald' },
];

const TASK_STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo', tone: 'blue' },
  { value: 'in-progress', label: 'In Progress', tone: 'amber' },
  { value: 'review', label: 'Review', tone: 'violet' },
  { value: 'done', label: 'Done', tone: 'emerald' },
];

function countActiveFilters(filters) {
  return (
    ['project', 'client', 'team'].reduce((sum, key) => sum + (filters[key] ? 1 : 0), 0) +
    ['projectStatuses', 'priorities', 'taskStatuses'].reduce((sum, key) => sum + (filters[key] || []).length, 0) +
    (filters.period && filters.period !== 'all' ? 1 : 0)
  );
}

export function ReportFilters({
  value,
  onChange,
  projectOptions = [],
  clientOptions = [],
  teamOptions = [],
}) {
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const activeCount = countActiveFilters(value || {});

  const updateFilters = (patch) => {
    onChange((current = {}) => ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }));
  };

  useEffect(() => {
    if (!open) return undefined;

    const updateRect = () => {
      if (!wrapRef.current) return;
      setRect(wrapRef.current.getBoundingClientRect());
    };
    updateRect();

    const onPointerDown = (event) => {
      const target = event.target;
      const clickedTrigger = wrapRef.current && wrapRef.current.contains(target);
      const clickedPanel = panelRef.current && panelRef.current.contains(target);
      const clickedChildPortal = target?.closest?.('[data-dropdown-portal]');
      if (!clickedTrigger && !clickedPanel && !clickedChildPortal) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const currentLabel = useMemo(() => {
    const current = PERIOD_OPTIONS.find((item) => item.value === value.period);
    return current?.label || 'All time';
  }, [value.period]);

  const projectStatusCount = value.projectStatuses?.length || 0;
  const priorityCount = value.priorities?.length || 0;
  const taskStatusCount = value.taskStatuses?.length || 0;

  const menu =
    open && rect && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className="fixed z-[96] w-[min(100vw-1.5rem,980px)] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[28px] border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.98)] p-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl"
            style={{ left: Math.max(12, Math.min(rect.left, window.innerWidth - Math.min(window.innerWidth - 24, 980) - 12)), top: rect.bottom + 12 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--line)/0.1)] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-500">
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                </div>
                <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--text))]">Refine reports</h3>
                <p className="mt-1 text-sm text-slate-500">Adjust the reporting window and entity scope without leaving the dashboard.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateFilters({
                    period: 'all',
                    from: '',
                    to: '',
                    project: '',
                    client: '',
                    team: '',
                    projectStatuses: [],
                    priorities: [],
                    taskStatuses: [],
                  })
                }
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-5">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    <CalendarRange className="h-3.5 w-3.5" />
                    Date range
                  </div>
                  <FilterChips
                    options={PERIOD_OPTIONS}
                    value={value.period}
                    onChange={(period) => updateFilters({ period })}
                    toneMap={{
                      slate: 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-[rgb(var(--line)/0.16)]',
                    }}
                  />
                </div>

                {value.period === 'custom' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DatePickerField label="From" value={value.from} onChange={(from) => updateFilters({ from })} />
                    <DatePickerField label="To" value={value.to} onChange={(to) => updateFilters({ to })} />
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4">
                <DropdownField
                  label="Project"
                  value={value.project}
                  onChange={(project) => updateFilters({ project })}
                  options={projectOptions}
                  placeholder="All projects"
                  searchable
                />
                <DropdownField
                  label="Client"
                  value={value.client}
                  onChange={(client) => updateFilters({ client })}
                  options={clientOptions}
                  placeholder="All clients"
                  searchable
                />
                <DropdownField
                  label="Team"
                  value={value.team}
                  onChange={(team) => updateFilters({ team })}
                  options={teamOptions}
                  placeholder="All teams"
                  searchable
                />
              </div>
            </div>

            <button
              type="button"
              className="mt-1 flex w-full items-center justify-between rounded-[24px] border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--panel-2)/0.28)] px-4 py-3 text-left transition hover:bg-[rgb(var(--panel-2)/0.4)]"
              onClick={() => setAdvancedOpen((current) => !current)}
              aria-expanded={advancedOpen}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-500">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Advanced filters
              </span>
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                {advancedOpen ? 'Hide' : 'Show'}
                <ChevronDown className={cn('h-4 w-4 transition-transform', advancedOpen && 'rotate-180')} />
              </span>
            </button>

            {advancedOpen ? (
              <div className="mt-3 rounded-[24px] border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--panel-2)/0.28)] p-4">
                <div className="grid gap-5 xl:grid-cols-3">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Project status
                      {projectStatusCount ? <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-500">{projectStatusCount}</span> : null}
                    </div>
                    <FilterChips
                      options={PROJECT_STATUS_OPTIONS}
                      value={value.projectStatuses || []}
                      onChange={(projectStatuses) => updateFilters({ projectStatuses })}
                      toneMap={{
                        blue: 'bg-sky-500/10 text-sky-700 ring-sky-200',
                        emerald: 'bg-emerald-500/10 text-emerald-700 ring-emerald-200',
                        rose: 'bg-rose-500/10 text-rose-700 ring-rose-200',
                        amber: 'bg-amber-500/10 text-amber-700 ring-amber-200',
                        slate: 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-[rgb(var(--line)/0.16)]',
                      }}
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Priority
                      {priorityCount ? <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-500">{priorityCount}</span> : null}
                    </div>
                    <FilterChips
                      options={PRIORITY_OPTIONS}
                      value={value.priorities || []}
                      onChange={(priorities) => updateFilters({ priorities })}
                      toneMap={{
                        blue: 'bg-sky-500/10 text-sky-700 ring-sky-200',
                        emerald: 'bg-emerald-500/10 text-emerald-700 ring-emerald-200',
                        rose: 'bg-rose-500/10 text-rose-700 ring-rose-200',
                        amber: 'bg-amber-500/10 text-amber-700 ring-amber-200',
                        slate: 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-[rgb(var(--line)/0.16)]',
                      }}
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Task status
                      {taskStatusCount ? <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-500">{taskStatusCount}</span> : null}
                    </div>
                    <FilterChips
                      options={TASK_STATUS_OPTIONS}
                      value={value.taskStatuses || []}
                      onChange={(taskStatuses) => updateFilters({ taskStatuses })}
                      toneMap={{
                        blue: 'bg-sky-500/10 text-sky-700 ring-sky-200',
                        emerald: 'bg-emerald-500/10 text-emerald-700 ring-emerald-200',
                        violet: 'bg-violet-500/10 text-violet-700 ring-violet-200',
                        amber: 'bg-amber-500/10 text-amber-700 ring-amber-200',
                        slate: 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-[rgb(var(--line)/0.16)]',
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--line)/0.1)] pt-4">
              <div className="flex items-center gap-2">
                <Badge tone="blue">Balanced</Badge>
                <span className="text-sm text-slate-500">{activeCount ? `${activeCount} active filters` : 'No active filters'}</span>
                <span className="text-sm text-slate-500">•</span>
                <span className="text-sm text-slate-500">{currentLabel}</span>
              </div>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapRef} className="relative">
      <Button variant="secondary" onClick={() => setOpen((current) => !current)}>
        <Filter className="h-4 w-4" />
        Filters
        <Badge tone="blue" className="ml-1 hidden sm:inline-flex">
          {currentLabel}
        </Badge>
        {activeCount ? <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-500">{activeCount}</span> : null}
      </Button>
      {menu}
    </div>
  );
}
