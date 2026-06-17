import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronDown, Download, Filter, Plus, Table2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DropdownField } from '../shared/DropdownField';
import { ModalShell } from '../shared/ModalShell';
import { TimesheetCalendar } from '../timer/TimesheetCalendar';
import { TimesheetInsights } from './TimesheetInsights';
import { TimesheetTable } from './TimesheetTable';
import { TimerManualEntry } from '../timer/TimerManualEntry';
import { timesheetService } from '../../services/timesheetService';
import { timerService } from '../../services/timerService';
import { formatDuration } from '../../store/timerStore';

const DEFAULT_FILTERS = {
  preset: 'last-30-days',
  start: '',
  end: '',
  project: 'all',
  task: 'all',
  entryType: 'all',
  billable: 'all',
  search: '',
};

function toManualProjectOptions(projects = []) {
  return projects.map((project) => ({
    id: project.value || project.id,
    projectName: project.label || project.projectName || 'Project',
  }));
}

function toManualTaskOptions(tasks = []) {
  return tasks.map((task) => ({
    id: task.value || task.id,
    title: task.label || task.title || 'Task',
    projectId: task.projectId || task.project || '',
  }));
}

function normalizeRange(range = {}) {
  return {
    start: range.start ? format(new Date(range.start), 'yyyy-MM-dd') : '',
    end: range.end ? format(new Date(range.end), 'yyyy-MM-dd') : '',
  };
}

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function getIndiaMonthRange() {
  const today = getIndiaToday();
  return {
    start: format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'),
    end: format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd'),
  };
}

function buildQuery(filters) {
  return {
    ...filters,
    start: filters.start || undefined,
    end: filters.end || undefined,
    project: filters.project === 'all' ? undefined : filters.project,
    task: filters.task === 'all' ? undefined : filters.task,
    type: filters.entryType === 'all' ? undefined : filters.entryType,
    billable: filters.billable === 'all' ? undefined : filters.billable,
    search: filters.search || undefined,
    preset: filters.preset || undefined,
  };
}

function buildExportName(scope, range, selected = false) {
  const prefix = scope === 'employee' ? 'employee-timesheets' : 'my-timesheets';
  const suffix = range.start && range.end ? `${format(new Date(range.start), 'yyyyMMdd')}-${format(new Date(range.end), 'yyyyMMdd')}` : 'range';
  return `${prefix}${selected ? '-selected' : ''}-${suffix}.csv`;
}

function toLogTimestamp(log) {
  const value = log?.date || log?.startTime || log?.createdAt;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortNewestFirst(logs = []) {
  return [...logs].sort((a, b) => {
    const timeDiff = toLogTimestamp(b) - toLogTimestamp(a);
    if (timeDiff) return timeDiff;
    return String(b.id || b._id || '').localeCompare(String(a.id || a._id || ''));
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function getExportFileName(responseHeader, fallbackName) {
  const match = String(responseHeader || '').match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  if (!match?.[1]) return fallbackName;
  try {
    return decodeURIComponent(match[1].replace(/"/g, ''));
  } catch {
    return match[1].replace(/"/g, '');
  }
}

export function TimesheetExplorer({ scope = 'mine', employeeId, allowManualEntry = false }) {
  const queryClient = useQueryClient();
  const searchRef = useRef(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activePanel, setActivePanel] = useState('heatmap');
  const [manualOpen, setManualOpen] = useState(false);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedFilterId, setSavedFilterId] = useState('');
  const [calendarResetToken, setCalendarResetToken] = useState(0);
  const deferredSearch = useDeferredValue(filters.search);

  const queryFilters = useMemo(() => ({ ...filters, search: deferredSearch }), [deferredSearch, filters]);
  const queryArgs = useMemo(() => buildQuery(queryFilters), [queryFilters]);
  const queryKey = useMemo(() => ['timesheets', scope, employeeId || 'self', queryArgs], [employeeId, queryArgs, scope]);

  const timesheetQuery = useQuery({
    queryKey,
    queryFn: () => (scope === 'employee' && employeeId ? timesheetService.listEmployee(employeeId, queryArgs) : timesheetService.listMine(queryArgs)),
  });

  const savedFiltersQuery = useQuery({
    queryKey: ['timesheet-filters', scope],
    queryFn: () => timesheetService.listFilters(scope),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (payload) => (scope === 'employee' && employeeId ? timesheetService.bulkUpdateEmployee(employeeId, payload) : timesheetService.bulkUpdateMine(payload)),
    onSuccess: () => {
      toast.success('Timesheets updated');
      queryClient.invalidateQueries({ queryKey: ['timesheets', scope, employeeId || 'self'] });
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
    },
    onError: () => toast.error('Failed to update timesheets'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (payload) => (scope === 'employee' && employeeId ? timesheetService.bulkDeleteEmployee(employeeId, payload) : timesheetService.bulkDeleteMine(payload)),
    onSuccess: () => {
      toast.success('Timesheets deleted');
      queryClient.invalidateQueries({ queryKey: ['timesheets', scope, employeeId || 'self'] });
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to delete timesheets'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => (scope === 'employee' && employeeId ? timesheetService.bulkDeleteEmployee(employeeId, { ids: [id] }) : timesheetService.deleteMine(id)),
    onSuccess: (_, deletedId) => {
      toast.success('Timesheet row deleted');
      queryClient.invalidateQueries({ queryKey: ['timesheets', scope, employeeId || 'self'] });
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
      setSelectedIds((current) => current.filter((item) => String(item) !== String(deletedId)));
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to delete timesheet row'),
  });

  const saveFilterMutation = useMutation({
    mutationFn: (payload) => timesheetService.createFilter(payload),
    onSuccess: () => {
      toast.success('Saved filter created');
      queryClient.invalidateQueries({ queryKey: ['timesheet-filters', scope] });
      setSaveName('');
    },
    onError: () => toast.error('Failed to save filter'),
  });

  const deleteFilterMutation = useMutation({
    mutationFn: (id) => timesheetService.deleteFilter(id),
    onSuccess: () => {
      toast.success('Saved filter deleted');
      queryClient.invalidateQueries({ queryKey: ['timesheet-filters', scope] });
      setSavedFilterId('');
    },
    onError: () => toast.error('Failed to delete filter'),
  });

  const updateFilterMutation = useMutation({
    mutationFn: ({ id, payload }) => timesheetService.updateFilter(id, payload),
    onSuccess: () => {
      toast.success('Saved filter updated');
      queryClient.invalidateQueries({ queryKey: ['timesheet-filters', scope] });
    },
    onError: () => toast.error('Failed to update saved filter'),
  });

  const manualMutation = useMutation({
    mutationFn: (payload) => timerService.manual(payload),
    onSuccess: () => {
      toast.success('Manual entry added');
      queryClient.invalidateQueries({ queryKey: ['timesheets', scope, employeeId || 'self'] });
      queryClient.invalidateQueries({ queryKey: ['timer-logs'] });
      setManualOpen(false);
    },
    onError: () => toast.error('Failed to save manual entry'),
  });

  const data = timesheetQuery.data || {};
  const items = useMemo(() => sortNewestFirst(data.items || []), [data.items]);
  const allLogs = useMemo(() => sortNewestFirst(data.allLogs || []), [data.allLogs]);
  const summary = data.summary || {};
  const dailySummary = data.dailySummary || [];
  const insights = data.insights || {};
  const filterOptions = data.filterOptions || {};
  const totalRows = data.total ?? summary.totalEntries ?? items.length;
  const savedFilters = savedFiltersQuery.data || [];
  const savedFilterOptions = savedFilters.map((filter) => ({
    value: filter.id || filter._id,
    label: filter.name,
  }));
  const selectedRange = normalizeRange(data.range || {});
  const hasSelection = selectedIds.length > 0;
  const selectedRows = useMemo(() => {
    if (!selectedIds.length) return [];
    const selectedSet = new Set(selectedIds.map(String));
    return allLogs.filter((log) => selectedSet.has(String(log.id || log._id)));
  }, [allLogs, selectedIds]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filters.preset, filters.project, filters.task, filters.entryType, filters.billable, filters.start, filters.end, deferredSearch]);

  useEffect(() => {
    function handleShortcuts(event) {
      if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        handleExport(hasSelection);
      }
    }

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [hasSelection]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyPresetFilter(filter) {
    setFilters({
      preset: filter.preset || 'custom',
      start: filter.start ? format(new Date(filter.start), 'yyyy-MM-dd') : '',
      end: filter.end ? format(new Date(filter.end), 'yyyy-MM-dd') : '',
      project: filter.project || 'all',
      task: filter.task || 'all',
      entryType: filter.entryType || 'all',
      billable: filter.billable || 'all',
      search: filter.search || '',
    });
    setSavedFilterId(filter.id || filter._id || '');
  }

  function handleRangeChange(nextRange) {
    if (!nextRange.start || !nextRange.end) {
      const next = getIndiaMonthRange();
      setFilters((current) => ({
        ...current,
        preset: 'custom',
        start: next.start,
        end: next.end,
      }));
      return;
    }

    setFilters((current) => ({
      ...current,
      preset: 'custom',
      start: nextRange.start ? format(new Date(nextRange.start), 'yyyy-MM-dd') : '',
      end: nextRange.end ? format(new Date(nextRange.end), 'yyyy-MM-dd') : '',
    }));
  }

  function clearFilters() {
    const next = getIndiaMonthRange();
    setFilters({
      ...DEFAULT_FILTERS,
      preset: 'custom',
      start: next.start,
      end: next.end,
    });
    setSelectedIds([]);
    setSavedFilterId('');
    setCalendarResetToken((current) => current + 1);
  }

  function toggleRow(id) {
    const nextId = String(id);
    setSelectedIds((current) => (current.includes(nextId) ? current.filter((item) => item !== nextId) : [...current, nextId]));
  }

  function toggleAllPage(checked) {
    if (!checked) {
    setSelectedIds((current) => current.filter((id) => !items.some((item) => String(item.id || item._id) === String(id))));
      return;
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...items.map((item) => String(item.id || item._id))])));
  }

  function selectAllFiltered() {
    setSelectedIds(allLogs.map((log) => String(log.id || log._id)));
  }

  function clearAllSelected() {
    setSelectedIds([]);
  }

  function getSelectedRowLabel(row) {
    const dateLabel = row.date || row.startTime ? format(new Date(row.date || row.startTime), 'dd MMM') : 'Log';
    const projectLabel = row.project?.projectName || row.projectName || 'Project';
    const taskLabel = row.task?.title || row.taskTitle || '';
    const durationLabel = formatDuration(row.duration);
    return [dateLabel, projectLabel, taskLabel].filter(Boolean).join(' • ') || durationLabel;
  }

  function handleBulkBillable(isBillable) {
    if (!selectedIds.length) return;
    if (!window.confirm(`Update ${selectedIds.length} selected logs?`)) return;
    bulkUpdateMutation.mutate({ ids: selectedIds, isBillable });
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected logs? This cannot be undone.`)) return;
    const deletedIds = [...selectedIds];
    await bulkDeleteMutation.mutateAsync({ ids: deletedIds });
    setSelectedIds((current) => current.filter((id) => !deletedIds.includes(id)));
  }

  function handleRowBillable(row) {
    const logId = String(row.id || row._id);
    bulkUpdateMutation.mutate({ ids: [logId], isBillable: !row.isBillable });
  }

  async function handleRowDelete(row) {
    if (!window.confirm('Delete this timesheet row?')) return;
    const logId = String(row.id || row._id);
    await deleteMutation.mutateAsync(logId);
  }

  async function handleExport(selectedOnly = false) {
    if (selectedOnly && !selectedIds.length) {
      toast.error('Select at least one row to export');
      return;
    }

    const params = { ...queryArgs };
    if (selectedOnly && selectedIds.length) {
      params.ids = selectedIds.join(',');
    }

    try {
      const result = scope === 'employee' && employeeId
        ? await timesheetService.exportEmployee(employeeId, params)
        : await timesheetService.exportMine(params);
      downloadBlob(result.blob, getExportFileName(result.fileName, buildExportName(scope, selectedRange, selectedOnly)));
      toast.success(selectedOnly ? 'Selected logs exported' : 'Timesheets exported');
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to export timesheets');
    }
  }

  async function handleSaveFilter() {
    if (!saveName.trim()) {
      toast.error('Enter a filter name');
      return;
    }

    const payload = {
      name: saveName.trim(),
      scope,
      employee: employeeId || undefined,
      preset: filters.preset,
      start: filters.start || undefined,
      end: filters.end || undefined,
      project: filters.project === 'all' ? undefined : filters.project,
      task: filters.task === 'all' ? undefined : filters.task,
      entryType: filters.entryType,
      billable: filters.billable,
      search: filters.search,
    };

    if (savedFilterId) {
      await updateFilterMutation.mutateAsync({ id: savedFilterId, payload });
      return;
    }

    await saveFilterMutation.mutateAsync(payload);
  }

  function handleDeleteSavedFilter() {
    const selected = savedFilters.find((item) => String(item.id || item._id) === String(savedFilterId));
    if (!selected) return;
    if (!window.confirm(`Delete saved filter ${selected.name}?`)) return;
    deleteFilterMutation.mutate(selected.id || selected._id);
  }

  function handleApplySavedFilter() {
    const selected = savedFilters.find((item) => String(item.id || item._id) === String(savedFilterId));
    if (!selected) return;
    setSaveName(selected.name || '');
    applyPresetFilter(selected);
  }

  const hasData = items.length > 0;
  const showLoadingState = timesheetQuery.isLoading && !hasData;
  const manualProjects = toManualProjectOptions(filterOptions.projects || []);
  const manualTasks = toManualTaskOptions(filterOptions.tasks || []);

  return (
    <div className="space-y-6">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="hero-kicker">Timesheets</p>
            <h1 className="hero-title">{scope === 'employee' ? 'Employee logs and analytics' : 'My timesheets'}</h1>
            <p className="hero-subtitle">Filter, inspect, and export logged time across projects, tasks, and billable states.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {allowManualEntry ? (
              <Button variant="secondary" onClick={() => setManualOpen(true)}>
                <Plus className="h-4 w-4" />
                Manual Entry
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => handleExport(false)}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </section>

      {manualOpen ? (
        <ModalShell
          title="Manual Entry"
          description="Add a timesheet record without leaving the page."
          onClose={() => setManualOpen(false)}
          widthClassName="max-w-5xl"
        >
          <TimerManualEntry
            projects={manualProjects}
            tasks={manualTasks}
            onCancel={() => setManualOpen(false)}
            onSubmit={async (payload) => {
              await manualMutation.mutateAsync(payload);
            }}
          />
        </ModalShell>
      ) : null}

      {showLoadingState ? (
        <TimesheetLoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total hours" value={formatDuration(summary.totalSeconds || 0)} helper={`${Number(summary.totalEntries || 0)} entries`} />
            <SummaryCard label="Billable" value={formatDuration(summary.billableSeconds || 0)} helper={`${Number(summary.billableRate || 0)}% billable`} />
            <SummaryCard label="Active days" value={String(summary.activeDays || 0)} helper="Days with activity" />
            <SummaryCard label="Peak day" value={summary.peakDay?.duration ? formatDuration(summary.peakDay.duration) : '-'} helper={summary.peakDay?.date ? format(new Date(summary.peakDay.date), 'dd MMM yyyy') : 'No peak data'} />
          </div>

          <Card>
            <CardHeader className="justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((current) => !current)}
                    aria-expanded={filtersOpen}
                    aria-controls="timesheet-filters-panel"
                    className={`group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${
                      filtersOpen
                        ? 'border-sky-300/80 bg-sky-50 text-sky-700 shadow-[0_10px_24px_rgba(14,165,233,0.12)]'
                        : 'border-[rgb(var(--line)/0.12)] bg-white/70 text-[rgb(var(--text))] hover:border-sky-200 hover:bg-sky-50/80 hover:text-sky-700'
                    }`}
                  >
                    <Filter className={`h-4 w-4 transition-colors ${filtersOpen ? 'text-sky-600' : 'text-sky-500 group-hover:text-sky-600'}`} />
                    <CardTitle className="flex items-center gap-2">
                      Smart filters
                      <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                    </CardTitle>
                  </button>
                  <Badge tone="blue">{totalRows || 0} rows</Badge>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {filtersOpen ? 'Saved filters, quick presets, and keyboard search.' : 'Filters are collapsed. Click Smart filters to expand the timesheet view.'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={clearFilters}>Reset</Button>
                <Button
                  size="sm"
                  variant={bulkActionsOpen ? 'primary' : 'secondary'}
                  onClick={() => setBulkActionsOpen((current) => !current)}
                  aria-expanded={bulkActionsOpen}
                  aria-controls="bulk-actions-panel"
                  className={`relative overflow-hidden whitespace-nowrap border transition-all duration-200 ${
                    bulkActionsOpen
                      ? 'border-sky-300/60 shadow-[0_10px_24px_rgba(14,165,233,0.24)]'
                      : 'border-sky-200/70 bg-sky-50 text-sky-700 hover:bg-sky-100'
                  }`}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${bulkActionsOpen ? 'rotate-180' : ''}`} />
                  Bulk actions
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    bulkActionsOpen ? 'bg-white/30 text-slate-950' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {selectedIds.length ? `${selectedIds.length} selected` : 'Panel'}
                  </span>
                </Button>
              </div>
            </CardHeader>
            {filtersOpen ? (
              <div id="timesheet-filters-panel" className="space-y-4 border-t border-[rgb(var(--line)/0.12)] px-4 py-4 sm:px-5">
                <div className="grid gap-3 xl:grid-cols-6">
                  <DropdownField
                    label="Preset"
                    value={filters.preset}
                    onChange={(value) => updateFilter('preset', value)}
                    options={filterOptions.presets || []}
                    placeholder="Select preset"
                    className="xl:col-span-1"
                  />
                  <input className="input" type="date" value={filters.start} onChange={(event) => updateFilter('start', event.target.value)} />
                  <input className="input" type="date" value={filters.end} onChange={(event) => updateFilter('end', event.target.value)} />
                  <DropdownField
                    label="Project"
                    value={filters.project}
                    onChange={(value) => updateFilter('project', value)}
                    options={[{ value: 'all', label: 'All projects' }, ...(filterOptions.projects || [])]}
                    placeholder="All projects"
                    className="xl:col-span-1"
                  />
                  <DropdownField
                    label="Task"
                    value={filters.task}
                    onChange={(value) => updateFilter('task', value)}
                    options={[{ value: 'all', label: 'All tasks' }, ...(filterOptions.tasks || [])]}
                    placeholder="All tasks"
                    className="xl:col-span-1"
                  />
                  <input
                    ref={searchRef}
                    className="input"
                    value={filters.search}
                    onChange={(event) => updateFilter('search', event.target.value)}
                    placeholder="Search notes or task titles"
                  />
                  <DropdownField
                    label="Entry type"
                    value={filters.entryType}
                    onChange={(value) => updateFilter('entryType', value)}
                    options={filterOptions.entryTypes || []}
                    placeholder="All entries"
                    className="xl:col-span-1"
                  />
                  <DropdownField
                    label="Billable"
                    value={filters.billable}
                    onChange={(value) => updateFilter('billable', value)}
                    options={filterOptions.billableOptions || []}
                    placeholder="All billability"
                    className="xl:col-span-1"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <DropdownField
                    label="Saved filters"
                    value={savedFilterId}
                    onChange={(value) => {
                      setSavedFilterId(value);
                      const selected = savedFilters.find((filter) => String(filter.id || filter._id) === String(value));
                      if (selected) setSaveName(selected.name || '');
                    }}
                    options={savedFilterOptions}
                    placeholder="Saved filters"
                    className="w-auto min-w-[200px]"
                  />
                  <Button variant="secondary" size="sm" onClick={handleApplySavedFilter} disabled={!savedFilterId}>Apply</Button>
                  <Button variant="secondary" size="sm" onClick={handleDeleteSavedFilter} disabled={!savedFilterId}>Delete</Button>
                  <input className="input w-auto min-w-[220px]" value={saveName} onChange={(event) => setSaveName(event.target.value)} placeholder="Save current filter as..." />
                  <Button size="sm" onClick={handleSaveFilter}>Save</Button>
                </div>
              </div>
            ) : null}
          </Card>

          <div className="relative grid gap-6">
            <Card className="relative z-0">
              <CardHeader className="justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-sky-500" />
                    Heatmap and insights
                  </CardTitle>
                  <div className="mt-1 text-xs text-slate-500">Drag or shift-click the heatmap to refine the active date range.</div>
                </div>
                <div className="relative flex overflow-hidden rounded-full bg-[rgb(var(--panel-2)/0.72)] p-1 ring-1 ring-[rgb(var(--line)/0.12)]">
                  <span
                    className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-sky-500 shadow-[0_10px_24px_rgba(14,165,233,0.24)] transition-transform duration-300 ease-out"
                    style={{ transform: activePanel === 'insights' ? 'translateX(100%)' : 'translateX(0)' }}
                  />
                  {[
                    { key: 'heatmap', label: 'Heatmap' },
                    { key: 'insights', label: 'Insights' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActivePanel(tab.key)}
                      aria-pressed={activePanel === tab.key}
                      className={`relative z-10 w-1/2 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-300 ${activePanel === tab.key ? 'text-slate-950' : 'text-[rgb(var(--text))] hover:text-slate-900'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardBody>
                {activePanel === 'heatmap' ? <TimesheetCalendar dailySummary={dailySummary} allLogs={allLogs} range={selectedRange} onRangeChange={handleRangeChange} resetViewToken={calendarResetToken} /> : <TimesheetInsights insights={insights} summary={summary} range={selectedRange} />}
              </CardBody>
            </Card>

            {bulkActionsOpen ? (
              <div
                id="bulk-actions-panel"
                className="xl:absolute xl:right-4 xl:top-4 xl:z-20 xl:w-[380px] xl:max-w-[calc(100vw-2rem)]"
              >
                <Card className="h-fit self-start shadow-2xl shadow-slate-900/10">
                  <CardHeader className="justify-between">
                  <div>
                    <CardTitle>Bulk actions</CardTitle>
                    <div className="mt-1 text-xs text-slate-500">{selectedIds.length ? `${selectedIds.length} selected` : 'Select rows to bulk edit.'}</div>
                  </div>
                  <Badge tone={hasSelection ? 'amber' : 'slate'}>{selectedIds.length || 0} selected</Badge>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleBulkBillable(true)} disabled={!selectedIds.length}>Mark billable</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleBulkBillable(false)} disabled={!selectedIds.length}>Mark non-billable</Button>
                      <Button size="sm" variant="danger" onClick={handleBulkDelete} disabled={!selectedIds.length}>Delete</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleExport(true)} disabled={!selectedIds.length}>
                        <Download className="h-4 w-4" />
                        Export selected
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <button type="button" onClick={() => toggleAllPage(true)} className="rounded-2xl border border-[rgb(var(--line)/0.14)] bg-white/70 p-4 text-left text-sm transition hover:bg-white">
                        Select all loaded
                      </button>
                      <button type="button" onClick={selectAllFiltered} className="rounded-2xl border border-[rgb(var(--line)/0.14)] bg-white/70 p-4 text-left text-sm transition hover:bg-white">
                        Select all filtered
                      </button>
                    </div>
                    {selectedRows.length ? (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Selected rows</div>
                        <div className="max-h-56 space-y-2 overflow-auto pr-1">
                          {selectedRows.slice(0, 8).map((row) => (
                            <div key={row.id || row._id} className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/80 px-4 py-3 text-sm">
                              <div className="min-w-0">
                                <div className="truncate font-medium text-[rgb(var(--text))]">{getSelectedRowLabel(row)}</div>
                                <div className="mt-0.5 text-xs text-slate-500">{formatDuration(row.duration)}</div>
                              </div>
                              <Badge tone="blue">Selected</Badge>
                            </div>
                          ))}
                          {selectedRows.length > 8 ? (
                            <div className="px-4 text-xs text-slate-500">+{selectedRows.length - 8} more selected rows</div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.16)] bg-white/60 p-4 text-sm text-slate-500">
                      Use `/` to focus search and `Ctrl/Cmd + E` to export.
                    </div>
                  </CardBody>
                </Card>
              </div>
            ) : null}
          </div>

          <Card>
            <CardHeader className="justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle>Timesheet rows</CardTitle>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={hasSelection ? clearAllSelected : () => toggleAllPage(true)}
                      disabled={!items.length}
                    >
                      {hasSelection ? 'Clear All' : 'Select All'}
                    </Button>
                    {hasSelection ? (
                      <Button size="sm" variant="danger" onClick={handleBulkDelete} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{totalRows || 0} result{(totalRows || 0) === 1 ? '' : 's'}</div>
                  {hasSelection ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedRows.slice(0, 4).map((row) => (
                        <Badge key={row.id || row._id} tone="blue">
                          {getSelectedRowLabel(row)}
                        </Badge>
                      ))}
                      {selectedRows.length > 4 ? <Badge tone="slate">+{selectedRows.length - 4} more</Badge> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <TimesheetTable
                rows={items}
                selectedIds={selectedIds}
                onToggleRow={toggleRow}
                onToggleAll={toggleAllPage}
                onDelete={handleRowDelete}
                onToggleBillable={handleRowBillable}
                canEditBillable
                canDelete
                showSelectionColumn={hasSelection}
                scrollClassName="scrollbar-none max-h-[62vh] pb-2"
              />
            </CardBody>
          </Card>
        </>
      )}

    </div>
  );
}

function SummaryCard({ label, value, helper }) {
  return (
    <Card>
      <CardBody>
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-semibold text-[rgb(var(--text))]">{value}</div>
        <div className="mt-1 text-xs text-slate-500">{helper}</div>
      </CardBody>
    </Card>
  );
}

function TimesheetLoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`summary-skel-${index}`}>
            <CardBody className="space-y-3">
              <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200/80" />
              <div className="h-8 w-2/3 animate-pulse rounded-2xl bg-slate-200/70" />
              <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200/60" />
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200/80" />
            <div className="h-3 w-72 max-w-full animate-pulse rounded-full bg-slate-200/60" />
          </div>
          <div className="h-10 w-44 animate-pulse rounded-full bg-slate-200/70" />
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`filter-skel-${index}`} className="h-11 rounded-2xl bg-slate-100/90 ring-1 ring-[rgb(var(--line)/0.08)]" />
            ))}
          </div>
          <div className="h-12 w-full rounded-2xl bg-slate-100/90 ring-1 ring-[rgb(var(--line)/0.08)]" />
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200/80" />
              <div className="h-3 w-72 max-w-full animate-pulse rounded-full bg-slate-200/60" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200/70" />
          </CardHeader>
          <CardBody className="h-[320px]">
            <div className="h-full rounded-3xl border border-dashed border-[rgb(var(--line)/0.12)] bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.85))] p-5">
              <div className="h-full animate-pulse rounded-2xl bg-gradient-to-br from-slate-200/70 via-slate-100/70 to-slate-200/40" />
            </div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200/80" />
              <div className="h-3 w-72 max-w-full animate-pulse rounded-full bg-slate-200/60" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200/70" />
          </CardHeader>
          <CardBody className="h-[320px]">
            <div className="h-full rounded-3xl border border-dashed border-[rgb(var(--line)/0.12)] bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.85))] p-5">
              <div className="h-full animate-pulse rounded-2xl bg-gradient-to-br from-slate-200/70 via-slate-100/70 to-slate-200/40" />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
        <Card className="overflow-hidden">
          <CardHeader className="justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200/80" />
              <div className="h-3 w-64 max-w-full animate-pulse rounded-full bg-slate-200/60" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200/70" />
          </CardHeader>
          <CardBody className="space-y-4 p-5">
            <div className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-white/60 p-3">
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={`task-skel-${index}`} className="flex items-center gap-4">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200/80" />
                    <div className="h-4 flex-1 animate-pulse rounded-full bg-slate-200/70" />
                  </div>
                ))}
              </div>
              <div className="mt-4 h-[180px] animate-pulse rounded-2xl bg-gradient-to-br from-slate-200/70 via-slate-100/70 to-slate-200/40" />
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-4 self-stretch">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={`side-skel-${index}`} className="h-fit self-start overflow-hidden">
              <CardHeader className="justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200/80" />
                  <div className="h-3 w-56 max-w-full animate-pulse rounded-full bg-slate-200/60" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-full bg-slate-200/70" />
              </CardHeader>
              <CardBody className="space-y-3">
                {Array.from({ length: 4 }).map((__, rowIndex) => (
                  <div key={`side-row-${index}-${rowIndex}`} className="h-12 rounded-2xl bg-slate-100/90 ring-1 ring-[rgb(var(--line)/0.08)]" />
                ))}
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200/80" />
            <div className="h-3 w-60 max-w-full animate-pulse rounded-full bg-slate-200/60" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-full bg-slate-200/70" />
        </CardHeader>
        <CardBody className="space-y-3 p-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`row-skel-${index}`} className="h-16 border-t border-[rgb(var(--line)/0.08)] bg-white/70" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}


