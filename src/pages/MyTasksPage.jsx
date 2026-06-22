import { createPortal } from 'react-dom';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  FolderKanban,
  ListFilter,
  PlayCircle,
  TriangleAlert,
} from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { useMyTasks } from '../hooks/useTasks';
import { useTimer } from '../hooks/useTimer';
import { Badge } from '../components/ui/badge';
import { Card, CardBody } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/shared/EmptyState';
import { DropdownField } from '../components/shared/DropdownField';
import { FilterChips } from '../components/shared/FilterChips';
import { SearchInput } from '../components/shared/SearchInput';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { formatDuration } from '../store/timerStore';
import { useNavigate } from 'react-router-dom';

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Hold', value: 'hold' },
  { label: 'Canceled', value: 'canceled' },
];

const SORT_OPTIONS = [
  { label: 'Priority', value: 'priority' },
  { label: 'Due date', value: 'due' },
  { label: 'Title', value: 'title' },
  { label: 'Status', value: 'status' },
];

const SIDEBAR_DUE_OPTIONS = [
  { label: 'Any time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Due soon', value: 'due-soon' },
  { label: 'This week', value: 'week' },
  { label: 'No due date', value: 'no-date' },
];

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SIDEBAR_FILTERS = {
  project: 'all',
  assignee: 'all',
  priority: 'all',
  status: 'all',
  due: 'all',
};

const TASK_TABLE_GRID_TEMPLATE = 'minmax(260px,1.4fr) 104px 104px 150px 150px 170px 96px 132px';

export default function MyTasksPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { elapsedSeconds, startTimer, resumeTimer, pausedTasks } = useTimer();
  const tasksQuery = useMyTasks();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [savedView, setSavedView] = useState('open');
  const [sidebarDraft, setSidebarDraft] = useState(DEFAULT_SIDEBAR_FILTERS);
  const [sidebarFilters, setSidebarFilters] = useState(DEFAULT_SIDEBAR_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const filtersRootRef = useRef(null);
  const filtersPanelRef = useRef(null);
  const [filtersPanelRect, setFiltersPanelRect] = useState(null);

  const tasks = tasksQuery.data || [];
  const pausedTaskList = pausedTasks || [];
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const hasAnySearch = Boolean(deferredSearch);
  const hasQuickFilters = filter !== 'all' || sortBy !== 'priority' || savedView !== 'open';
  const hasSidebarFilters = !areSidebarFiltersEqual(sidebarFilters, DEFAULT_SIDEBAR_FILTERS);
  const sidebarDirty = !areSidebarFiltersEqual(sidebarDraft, sidebarFilters);
  const hasActiveFilters = hasAnySearch || hasQuickFilters || hasSidebarFilters;

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!filtersRootRef.current) return;
      if (event.target?.closest?.('[data-dropdown-portal]')) return;
      if (filtersRootRef.current.contains(event.target)) return;
      if (filtersPanelRef.current?.contains(event.target)) return;
      setFiltersOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setFiltersOpen(false);
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!filtersOpen) {
      setFiltersPanelRect(null);
      return undefined;
    }

    const updateRect = () => {
      if (!filtersRootRef.current) return;
      setFiltersPanelRect(filtersRootRef.current.getBoundingClientRect());
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [filtersOpen]);

  const todayKey = useMemo(() => format(new Date(now), 'yyyy-MM-dd'), [now]);

  const normalizedTasks = useMemo(
    () =>
      tasks.map((task) => {
        const dueTs = toTimestamp(task.dueDate);
        const createdTs = toTimestamp(task.createdAt || task.updatedAt || task.startDate);
        const projectLabel = task.projectName || task.project?.projectName || 'Untitled Project';
        const assigneeLabel = task.assignee?.name || task.assigneeName || 'Unassigned';
        const reporterLabel = task.reporter?.name || task.reporterName || task.createdBy?.name || 'Unknown';
        const teamLabel = task.teamName || task.team?.name || 'No team';
        const stageLabel = task.stage?.stageName || task.stage?.name || task.projectStage || '';
        const priority = String(task.priority || 'Medium');
        const status = String(task.status || 'todo');
        const tags = Array.isArray(task.tags) ? task.tags.filter(Boolean) : [];
        const progress = getTaskProgress(task);
        const progressTone = getProgressTone(progress, status);
        const dueMeta = getDueMeta(dueTs, now, status);
        const searchableText = [
          task.title,
          task.description,
          projectLabel,
          assigneeLabel,
          reporterLabel,
          teamLabel,
          stageLabel,
          task.nextAction,
          priority,
          status,
          Array.isArray(tags) ? tags.join(' ') : '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return {
          task,
          taskId: task.id,
          projectId: task.project?.id || task.project?.dbId || task.projectId || null,
          stageId: task.stage?.id || task.stage?.dbId || task.stageId || null,
          dueTs,
          dueDayKey: dueTs ? format(new Date(dueTs), 'yyyy-MM-dd') : null,
          createdTs,
          projectLabel,
          assigneeLabel,
          reporterLabel,
          teamLabel,
          stageLabel,
          priorityKey: priority.toLowerCase(),
          statusKey: status.toLowerCase(),
          tags,
          tagsPreview: tags.slice(0, 2),
          tagsOverflow: Math.max(0, tags.length - 2),
          progress,
          progressTone,
          dueMeta,
          isOverdue: Boolean(dueTs && dueTs < now && status !== 'done'),
          isDueSoon: Boolean(dueTs && dueTs >= now && dueTs - now <= TWO_DAYS_MS && status !== 'done'),
          isDueThisWeek: Boolean(dueTs && dueTs >= now && dueTs - now <= WEEK_MS && status !== 'done'),
          hasDueDate: Boolean(dueTs),
          isBudgeted: Number(task.estimatedDurationMinutes || 0) > 0,
          remainingBudgetSeconds: Number(task.estimatedDurationMinutes || 0) * 60 - Number(task.totalTimeLogged || 0),
          searchableText,
          canStart: canStartTask(task, user),
        };
      }),
    [now, tasks, user],
  );

  const taskStats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let done = 0;

    for (const item of normalizedTasks) {
      if (item.isOverdue) overdue += 1;
      if (item.isDueSoon) dueSoon += 1;
      if (item.statusKey === 'done') done += 1;
    }

    return {
      total: normalizedTasks.length,
      overdue,
      dueSoon,
      done,
      open: normalizedTasks.length - done,
    };
  }, [normalizedTasks]);

  const projectOptions = useMemo(
    () => uniqueSorted(normalizedTasks.map((item) => item.projectLabel)),
    [normalizedTasks],
  );
  const assigneeOptions = useMemo(
    () => uniqueSorted(normalizedTasks.map((item) => item.assigneeLabel)),
    [normalizedTasks],
  );
  const priorityOptions = useMemo(
    () => uniqueSorted(normalizedTasks.map((item) => item.priorityKey), true),
    [normalizedTasks],
  );
  const statusOptions = useMemo(
    () => uniqueSorted(normalizedTasks.map((item) => item.statusKey), true),
    [normalizedTasks],
  );

  const savedViews = useMemo(
    () => [
      {
        id: 'open',
        label: 'My Open Tasks',
        count: normalizedTasks.filter((item) => item.statusKey !== 'done').length,
        description: 'Everything still in motion',
      },
      {
        id: 'overdue',
        label: 'Overdue Tasks',
        count: normalizedTasks.filter((item) => item.isOverdue).length,
        description: 'Needs attention now',
      },
      {
        id: 'week',
        label: 'Due This Week',
        count: normalizedTasks.filter((item) => item.isDueThisWeek).length,
        description: 'Upcoming deliveries',
      },
      {
        id: 'high-priority',
        label: 'High Priority',
        count: normalizedTasks.filter((item) => ['critical', 'high'].includes(item.priorityKey)).length,
        description: 'Top urgency items',
      },
    ],
    [normalizedTasks],
  );

  const filteredTasks = useMemo(() => {
    const filtered = normalizedTasks.filter((item) => {
      if (deferredSearch && !item.searchableText.includes(deferredSearch)) return false;
      if (!matchesScopeFilter(item, filter, todayKey, now)) return false;
      if (!matchesSavedView(item, savedView)) return false;
      if (!matchesSidebarFilter(item, sidebarFilters, todayKey, now)) return false;
      return true;
    });

    filtered.sort((a, b) => sortTasks(a, b, sortBy, now));
    return filtered;
  }, [deferredSearch, filter, now, normalizedTasks, savedView, sidebarFilters, sortBy, todayKey]);

  const lastTaskId = filteredTasks.at(-1)?.taskId || null;
  const sidebarCounts = useMemo(
    () => ({
      project: projectOptions.length,
      assignee: assigneeOptions.length,
      priority: priorityOptions.length,
      status: statusOptions.length,
    }),
    [assigneeOptions.length, priorityOptions.length, projectOptions.length, statusOptions.length],
  );

  function applySidebarFilters() {
    setSidebarFilters(sidebarDraft);
    setFiltersOpen(false);
  }

  function clearSidebarFilters() {
    setSidebarDraft(DEFAULT_SIDEBAR_FILTERS);
    setSidebarFilters(DEFAULT_SIDEBAR_FILTERS);
    setSavedView('open');
    setFilter('all');
    setSearch('');
    setSortBy('priority');
    setFiltersOpen(false);
  }

  function handleSavedViewChange(viewId) {
    setSavedView(viewId);
    setSidebarDraft(DEFAULT_SIDEBAR_FILTERS);
    setSidebarFilters(DEFAULT_SIDEBAR_FILTERS);
    setFilter('all');
  }

  const filtersPanel =
    filtersOpen && filtersPanelRect && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={filtersPanelRef}
            data-dropdown-portal="true"
            className="fixed z-[96] w-[min(100vw-1.5rem,980px)] rounded-[28px] border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.98)] p-0 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl"
            style={{
              left: Math.max(12, Math.min(filtersPanelRect.right - Math.min(window.innerWidth - 24, 980), window.innerWidth - Math.min(window.innerWidth - 24, 980) - 12)),
              top: filtersPanelRect.bottom + 12,
            }}
          >
            <div className="border-b border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel-2)/0.26)] px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Saved views</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">Quick presets and filters for the current task set.</div>
                </div>
                <Badge tone={sidebarDirty ? 'amber' : 'slate'}>{sidebarDirty ? 'Unsaved' : 'Synced'}</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {savedViews.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => handleSavedViewChange(view.id)}
                    className={`group flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      savedView === view.id
                        ? 'border-sky-300/60 bg-sky-500/10 shadow-[0_10px_24px_rgba(14,165,233,0.10)]'
                        : 'border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel))] hover:border-sky-200 hover:bg-[rgb(var(--panel-2)/0.80)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{view.label}</div>
                      <div className="mt-0.5 truncate text-xs text-[rgb(var(--muted))]">{view.description}</div>
                    </div>
                    <Badge tone={savedView === view.id ? 'blue' : 'slate'} className="shrink-0">
                      {view.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <div className="space-y-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Filters</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SidebarSelect
                    label={`Project (${sidebarCounts.project})`}
                    value={sidebarDraft.project}
                    onChange={(value) => setSidebarDraft((current) => ({ ...current, project: value }))}
                    options={['all', ...projectOptions]}
                    placeholder="All projects"
                    searchable
                  />
                  <SidebarSelect
                    label={`Assignee (${sidebarCounts.assignee})`}
                    value={sidebarDraft.assignee}
                    onChange={(value) => setSidebarDraft((current) => ({ ...current, assignee: value }))}
                    options={['all', ...assigneeOptions]}
                    placeholder="All assignees"
                    searchable
                  />
                  <SidebarSelect
                    label={`Priority (${sidebarCounts.priority})`}
                    value={sidebarDraft.priority}
                    onChange={(value) => setSidebarDraft((current) => ({ ...current, priority: value }))}
                    options={['all', 'critical', 'high', 'medium', 'low']}
                    placeholder="All priorities"
                  />
                  <SidebarSelect
                    label={`Status (${sidebarCounts.status})`}
                    value={sidebarDraft.status}
                    onChange={(value) => setSidebarDraft((current) => ({ ...current, status: value }))}
                    options={['all', 'todo', 'in-progress', 'review', 'blocked', 'done']}
                    placeholder="All statuses"
                  />
                  <SidebarSelect
                    label="Due date"
                    value={sidebarDraft.due}
                    onChange={(value) => setSidebarDraft((current) => ({ ...current, due: value }))}
                    options={SIDEBAR_DUE_OPTIONS}
                    placeholder="Any time"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="secondary" className="sm:w-[160px]" onClick={clearSidebarFilters} disabled={!hasActiveFilters}>
                    Clear
                  </Button>
                  <Button variant="primary" className="sm:w-[180px]" onClick={applySidebarFilters} disabled={!sidebarDirty}>
                    Apply filters
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 overflow-x-hidden pb-8">
      <section className="theme-hero theme-hero-blue overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="hero-kicker">My Tasks</p>
            <h1 className="hero-title">
              Welcome back, <span className="text-amber-300">{user?.name || 'there'}</span>!
            </h1>
            <p className="hero-subtitle">
              Today is {format(new Date(now), 'dd MMM yyyy')} | Logged time {formatDuration(elapsedSeconds)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
            <HeroStat label="Total" value={taskStats.total} tone="blue" icon={ListFilter} />
            <HeroStat label="Overdue" value={taskStats.overdue} tone="rose" icon={TriangleAlert} />
            <HeroStat label="Due Soon" value={taskStats.dueSoon} tone="amber" icon={Clock3} />
            <HeroStat label="Done" value={taskStats.done} tone="green" icon={CheckCircle2} />
          </div>
        </div>
      </section>

      {tasksQuery.isLoading ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
            <Card>
              <CardBody className="space-y-4 p-4 sm:p-5">
                <div className="h-12 rounded-2xl bg-[rgb(var(--panel-2)/0.7)]" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-2xl bg-[rgb(var(--panel-2)/0.55)]" />
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
          <SkeletonCard />
        </div>
      ) : tasksQuery.isError ? (
        <Card>
          <CardBody className="flex items-center gap-3 py-10">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[rgb(var(--text))]">{tasksQuery.error?.message || 'Failed to load tasks'}</div>
              <div className="text-xs text-slate-500">Retry after the API responds again.</div>
            </div>
            <Button variant="secondary" onClick={() => tasksQuery.refetch()}>
              Retry
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError ? (
        <div className="space-y-4">
          {pausedTaskList.length ? (
            <Card className="border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.97)] shadow-[0_18px_50px_-40px_rgba(15,23,42,0.48)] ring-1 ring-[rgb(var(--line)/0.05)] backdrop-blur">
              <CardBody className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Paused Tasks</div>
                    <div className="mt-1 text-sm text-[rgb(var(--muted))]">
                      {pausedTaskList.length} task{pausedTaskList.length === 1 ? '' : 's'} ready to resume
                    </div>
                  </div>
                  <Badge tone="amber">{pausedTaskList.length}</Badge>
                </div>

                <div className="grid gap-3">
                  {pausedTaskList.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel-2)/0.72)] px-4 py-3 transition hover:border-[rgb(var(--line)/0.22)] hover:bg-[rgb(var(--panel-2)/0.9)] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{task.title}</div>
                        <div className="mt-1 truncate text-xs text-[rgb(var(--muted))]">
                          {task.projectName || 'No project'}
                          {task.stageName ? ` - ${task.stageName}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <Badge tone="amber">{formatDuration(Math.max(0, Number(task.remainingSeconds || 0)))} left</Badge>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            resumeTimer(
                              task.id,
                              task.project?.id || task.projectId || undefined,
                              task.stage?.id || task.stageId || undefined,
                              '',
                            )
                          }
                        >
                          Resume
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}

          <Card className={`relative isolate ${filtersOpen ? 'z-50' : 'z-10'} overflow-visible border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.97)] shadow-[0_18px_50px_-40px_rgba(15,23,42,0.48)] ring-1 ring-[rgb(var(--line)/0.05)] backdrop-blur`}>
            <CardBody className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">Task feed</div>
                  <div className="mt-1 text-sm text-[rgb(var(--muted))]">
                    {filteredTasks.length} shown from {taskStats.total} total
                    {deferredSearch ? ` for "${search.trim()}"` : ''}
                  </div>
                </div>
                <div ref={filtersRootRef} className="relative flex min-w-0 flex-col gap-3 xl:min-w-[640px]">
                  <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start">
                    <div className="min-w-0 lg:flex-1">
                      <SearchInput
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search title, project, assignee..."
                        className="min-w-0"
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-[160px] flex-none">
                        <DropdownField
                          label="Sort tasks"
                          value={sortBy}
                          onChange={setSortBy}
                          options={SORT_OPTIONS}
                          placeholder="Sort by"
                          className="w-full [&>span]:hidden"
                        />
                      </div>

                      <div className="z-40">
                        <Button variant={filtersOpen ? 'primary' : 'secondary'} className="h-11 px-4" onClick={() => setFiltersOpen((current) => !current)}>
                          <Filter className="h-4 w-4" />
                          Filters
                          <Badge tone={hasActiveFilters ? 'blue' : 'slate'} className="ml-1">
                            {hasActiveFilters ? 'On' : 'Off'}
                          </Badge>
                        </Button>

                        {filtersPanel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="pb-1">
                  <FilterChips value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {hasActiveFilters ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSearch('');
                        setFilter('all');
                        setSortBy('priority');
                        setSavedView('open');
                        setSidebarDraft(DEFAULT_SIDEBAR_FILTERS);
                        setSidebarFilters(DEFAULT_SIDEBAR_FILTERS);
                      }}
                    >
                      Reset view
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardBody>
          </Card>

          {filteredTasks.length ? (
            <Card className="relative z-10 overflow-hidden border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.995)] shadow-[0_30px_90px_-48px_rgba(15,23,42,0.62)] ring-1 ring-[rgb(var(--line)/0.08)] backdrop-blur">
              <div className="relative bg-[rgb(var(--panel)/0.995)]">
                <div className="overflow-x-auto">
                  <div className="min-w-[1320px]">
                    <TaskTableHeader />
                    <div className="relative">
                      <div className="scrollbar-thin max-h-[calc(100dvh-30rem)] overflow-y-auto overflow-x-hidden pb-12 pr-1">
                        {filteredTasks.map((row) => (
                          <TaskTableRow
                            key={row.taskId}
                            row={row}
                            navigate={navigate}
                            startTimer={startTimer}
                            isLast={row.taskId === lastTaskId}
                          />
                        ))}
                      </div>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent via-[rgb(var(--panel)/0.06)] to-[rgb(var(--panel)/0.98)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              title={filter === 'overdue' || savedView === 'overdue' ? 'Great - no overdue tasks!' : 'No tasks found'}
              description={deferredSearch ? 'Try a different search term or clear the filter.' : 'Your personal task list will appear here.'}
            />
          )}
        </div>
      ) : null}
    </motion.div>
  );
}

function TaskTableHeader() {
  return (
    <div className="sticky top-0 z-20 border-b border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.995)] shadow-[0_1px_0_rgba(255,255,255,0.75)_inset,0_10px_26px_-20px_rgba(15,23,42,0.22)] backdrop-blur">
      <div
        className="grid gap-4 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--text))]/78 sm:px-5"
        style={{
          gridTemplateColumns: TASK_TABLE_GRID_TEMPLATE,
        }}
      >
        <div>Task / Project</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Assignee</div>
        <div>Due Date</div>
        <div>Progress</div>
        <div>Tags</div>
        <div>Actions</div>
      </div>
    </div>
  );
}

function TaskTableRow({ row, navigate, startTimer, isLast = false }) {
  const task = row.task;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/tasks/${row.taskId}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/tasks/${row.taskId}`);
        }
      }}
      className={`grid min-h-[112px] cursor-pointer items-center gap-4 border-b border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel)/0.98)] px-4 py-4 transition hover:bg-[rgb(var(--panel-2)/0.78)] sm:px-5 ${
        isLast ? 'border-b-0 pb-8' : ''
      }`}
      style={{ gridTemplateColumns: TASK_TABLE_GRID_TEMPLATE }}
    >
      <div className="min-w-0 self-start">
        <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{task.title}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
          <FolderKanban className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{row.projectLabel}</span>
        </div>
        <div className="mt-1 line-clamp-2 text-xs text-[rgb(var(--muted))]">{task.description || 'No description provided.'}</div>
      </div>

      <div className="flex items-center">
        <TaskStatusPill value={row.statusKey} />
      </div>

      <div className="flex items-center">
        <TaskPriorityPill value={row.priorityKey} />
      </div>

      <div className="min-w-0 self-center">
        <div className="flex items-center gap-2">
          <AvatarDot label={row.assigneeLabel} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[rgb(var(--text))]">{row.assigneeLabel}</div>
            <div className="truncate text-xs text-[rgb(var(--muted))]">{row.reporterLabel}</div>
          </div>
        </div>
      </div>

      <div className="min-w-0 self-center">
        <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">
          {row.dueMeta.label}
        </div>
        <div className={`mt-1 text-xs ${row.dueMeta.tone}`}>
          {row.dueMeta.subLabel}
        </div>
      </div>

      <div className="min-w-0 self-center">
        <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
          <span>Progress</span>
          <span className="font-semibold text-[rgb(var(--text))]">{row.progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgb(var(--line)/0.14)]">
          <div
            className={`h-full rounded-full transition-all ${row.progressTone.bar}`}
            style={{ width: `${row.progress}%` }}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5 self-center">
        {row.tagsPreview.length ? (
          <>
            {row.tagsPreview.map((tag) => (
              <Badge key={tag} tone="slate" className="max-w-full truncate">
                {tag}
              </Badge>
            ))}
            {row.tagsOverflow > 0 ? <Badge tone="blue">+{row.tagsOverflow}</Badge> : null}
          </>
        ) : (
          <span className="text-sm text-[rgb(var(--muted))]">-</span>
        )}
      </div>

      <div className="flex min-w-0 items-center justify-start gap-2 self-center whitespace-nowrap">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 shrink-0 px-3"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/tasks/${row.taskId}`);
          }}
        >
          <Eye className="h-4 w-4" />
          Open
        </Button>
        {row.canStart && row.statusKey !== 'done' ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 shrink-0 px-2"
            onClick={async (event) => {
              event.stopPropagation();
              await startTimer(row.taskId, row.projectId, row.stageId, '');
            }}
            title="Start timer"
            aria-label={`Start timer for ${task.title}`}
          >
            <PlayCircle className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function TaskStatusPill({ value }) {
  const normalized = String(value || '').toLowerCase();
  const tone =
    normalized === 'done'
      ? 'green'
      : normalized === 'in-progress'
        ? 'blue'
        : normalized === 'review'
          ? 'amber'
          : normalized === 'blocked'
            ? 'rose'
            : 'slate';
  return <Badge tone={tone}>{formatTaskStatus(normalized)}</Badge>;
}

function TaskPriorityPill({ value }) {
  const tone = value === 'critical' ? 'rose' : value === 'high' ? 'amber' : value === 'low' ? 'green' : 'blue';
  return <Badge tone={tone}>{formatTaskPriority(value)}</Badge>;
}

function AvatarDot({ label }) {
  const initials = String(label || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-bold text-sky-300 ring-1 ring-sky-400/20">
      {initials || 'U'}
    </div>
  );
}

function HeroStat({ label, value, tone = 'blue', icon: Icon }) {
  const tones = {
    blue: 'bg-sky-500/12 text-sky-300 ring-sky-400/20',
    amber: 'bg-amber-500/12 text-amber-300 ring-amber-400/20',
    rose: 'bg-rose-500/12 text-rose-300 ring-rose-400/20',
    green: 'bg-emerald-500/12 text-emerald-300 ring-emerald-400/20',
  };

  return (
    <div className={`rounded-2xl border border-[rgb(var(--line)/0.14)] px-4 py-3 shadow-sm ring-1 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
        </div>
        {Icon ? (
          <div className="rounded-xl bg-white/10 p-2 ring-1 ring-white/10">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SidebarSelect({ label, value, onChange, options, placeholder, searchable = false }) {
  const normalizedOptions = options
    .filter((option) => (typeof option === 'string' ? option !== 'all' : option.value !== 'all'))
    .map((option) => {
      const optionValue = typeof option === 'string' ? option : option.value;
      const optionLabel = typeof option === 'string' ? formatOptionLabel(option) : option.label;
      return { value: optionValue, label: optionLabel };
    });

  return (
    <DropdownField
      label={label}
      value={value}
      onChange={onChange}
      options={normalizedOptions}
      placeholder={placeholder || 'All'}
      searchable={searchable}
      className="w-full"
    />
  );
}

function matchesScopeFilter(item, filter, todayKey, now) {
  if (filter === 'in-progress') return item.statusKey === 'in-progress';
  if (filter === 'completed') return item.statusKey === 'done' || item.statusKey === 'completed';
  if (filter === 'pending') return item.statusKey === 'todo' || item.statusKey === 'pending';
  if (filter === 'hold') return item.statusKey === 'blocked' || item.statusKey === 'hold' || item.statusKey === 'on-hold';
  if (filter === 'canceled') return item.statusKey === 'canceled' || item.statusKey === 'cancelled' || item.statusKey === 'cancel';
  return true;
}

function matchesSavedView(item, viewId) {
  if (viewId === 'overdue') return item.isOverdue;
  if (viewId === 'week') return item.isDueThisWeek;
  if (viewId === 'high-priority') return ['critical', 'high'].includes(item.priorityKey);
  return true;
}

function matchesSidebarFilter(item, filters, todayKey, now) {
  if (filters.project !== 'all' && item.projectLabel !== filters.project) return false;
  if (filters.assignee !== 'all' && item.assigneeLabel !== filters.assignee) return false;
  if (filters.priority !== 'all' && item.priorityKey !== filters.priority) return false;
  if (filters.status !== 'all' && item.statusKey !== filters.status) return false;

  if (filters.due === 'today' && item.dueDayKey !== todayKey) return false;
  if (filters.due === 'overdue' && !item.isOverdue) return false;
  if (filters.due === 'due-soon' && !item.isDueSoon) return false;
  if (filters.due === 'week' && !item.isDueThisWeek) return false;
  if (filters.due === 'no-date' && item.hasDueDate) return false;

  return true;
}

function sortTasks(a, b, sortBy, now) {
  const dueA = a.dueTs ?? Number.MAX_SAFE_INTEGER;
  const dueB = b.dueTs ?? Number.MAX_SAFE_INTEGER;

  if (sortBy === 'due') {
    return (
      dueA - dueB ||
      getPriorityScore(a.task, a.dueTs, now) - getPriorityScore(b.task, b.dueTs, now) ||
      a.createdTs - b.createdTs ||
      String(a.task.title || '').localeCompare(String(b.task.title || ''))
    );
  }

  if (sortBy === 'title') {
    return String(a.task.title || '').localeCompare(String(b.task.title || ''));
  }

  if (sortBy === 'status') {
    return (
      String(a.statusKey || '').localeCompare(String(b.statusKey || '')) ||
      dueA - dueB ||
      a.createdTs - b.createdTs
    );
  }

  return (
    getPriorityScore(a.task, a.dueTs, now) - getPriorityScore(b.task, b.dueTs, now) ||
    dueA - dueB ||
    a.createdTs - b.createdTs ||
    String(a.task.title || '').localeCompare(String(b.task.title || ''))
  );
}

function getTaskProgress(task) {
  const budgetSeconds = Number(task.estimatedDurationMinutes || 0) * 60;
  const loggedSeconds = Number(task.totalTimeLogged || 0);
  const status = String(task.status || '').toLowerCase();
  const explicitProgress = Number(task.progress);

  if (Number.isFinite(explicitProgress) && explicitProgress >= 0) {
    return Math.min(100, Math.round(explicitProgress));
  }

  if (budgetSeconds > 0 && loggedSeconds > 0) {
    return Math.max(0, Math.min(100, Math.round((loggedSeconds / budgetSeconds) * 100)));
  }

  const fallback = {
    done: 100,
    review: 82,
    'in-progress': 62,
    blocked: 18,
    todo: 0,
  };

  return fallback[status] ?? 0;
}

function getProgressTone(progress, status) {
  if (status === 'done' || progress >= 100) return { bar: 'bg-emerald-500' };
  if (status === 'blocked') return { bar: 'bg-rose-500' };
  if (progress >= 60) return { bar: 'bg-sky-500' };
  if (progress >= 30) return { bar: 'bg-amber-500' };
  return { bar: 'bg-slate-400' };
}

function getDueMeta(dueTs, now, status) {
  if (!dueTs) {
    return {
      label: 'No due date',
      subLabel: 'Flexible timeline',
      tone: 'text-[rgb(var(--muted))]',
    };
  }

  const diff = dueTs - now;
  const dateLabel = format(new Date(dueTs), 'dd MMM yyyy');

  if (status === 'done') {
    return {
      label: dateLabel,
      subLabel: 'Completed task',
      tone: 'text-emerald-400',
    };
  }

  if (diff < 0) {
    return {
      label: dateLabel,
      subLabel: `Overdue by ${formatDuration(Math.max(0, Math.round(Math.abs(diff) / 1000)))}`,
      tone: 'text-rose-400',
    };
  }

  if (diff <= 24 * 60 * 60 * 1000) {
    return {
      label: dateLabel,
      subLabel: 'Due today',
      tone: 'text-amber-300',
    };
  }

  if (diff <= TWO_DAYS_MS) {
    return {
      label: dateLabel,
      subLabel: `Due in ${formatDuration(Math.max(0, Math.round(diff / 1000)))}`,
      tone: 'text-amber-300',
    };
  }

  return {
    label: dateLabel,
    subLabel: `Due in ${formatDuration(Math.max(0, Math.round(diff / 1000)))}`,
    tone: 'text-[rgb(var(--muted))]',
  };
}

function areSidebarFiltersEqual(left, right) {
  return (
    left.project === right.project &&
    left.assignee === right.assignee &&
    left.priority === right.priority &&
    left.status === right.status &&
    left.due === right.due
  );
}

function uniqueSorted(values, preservePriorityOrder = false) {
  const items = Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    ),
  );

  if (preservePriorityOrder) {
    const order = ['critical', 'high', 'medium', 'low', 'todo', 'in-progress', 'review', 'blocked', 'done'];
    return items.sort((left, right) => {
      const leftIndex = order.indexOf(left.toLowerCase());
      const rightIndex = order.indexOf(right.toLowerCase());
      if (leftIndex !== -1 || rightIndex !== -1) {
        return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
      }
      return left.localeCompare(right);
    });
  }

  return items.sort((left, right) => left.localeCompare(right));
}

function formatOptionLabel(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return 'All';
  return normalized
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatTaskStatus(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'todo') return 'To Do';
  if (normalized === 'in-progress') return 'In Progress';
  if (normalized === 'review') return 'In Review';
  if (normalized === 'done') return 'Done';
  if (normalized === 'blocked') return 'Blocked';
  return formatOptionLabel(normalized);
}

function formatTaskPriority(value) {
  return formatOptionLabel(value || 'Medium');
}

function toTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function getPriorityScore(task, dueTs, now) {
  if (dueTs && dueTs < now && task.status !== 'done') return 0;
  if (dueTs && dueTs >= now && dueTs - now <= TWO_DAYS_MS) return 1;
  if (task.status === 'in-progress') return 2;
  if (task.status === 'done') return 4;
  return 3;
}

function canStartTask(task, user) {
  const assigneeId = task.assignee?._id || task.assignee?.id || task.assignee;
  const reporterId = task.reporter?._id || task.reporter?.id || task.reporter || task.createdBy?._id || task.createdBy?.id || task.createdBy;
  const teamIds = Array.isArray(task.assignedTeam) ? task.assignedTeam.map((member) => member?._id || member?.id || member) : [];
  const teamMemberIds = Array.isArray(task.teamMembers) ? task.teamMembers.map((member) => member?._id || member?.id || member) : [];

  return (
    ['superadmin', 'admin'].includes(user?.role) ||
    String(assigneeId) === String(user?.id) ||
    String(reporterId) === String(user?.id) ||
    teamIds.some((memberId) => String(memberId) === String(user?.id)) ||
    teamMemberIds.some((memberId) => String(memberId) === String(user?.id))
  );
}
