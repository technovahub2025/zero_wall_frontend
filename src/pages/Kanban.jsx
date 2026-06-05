import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock3, ListTodo, LayoutGrid, Search, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { useEmployees } from '../hooks/useEmployees';
import { useProjects } from '../hooks/useProjects';
import { useKanbanOverview, useMyTasksKanban, useProjectTasks, useTaskCounts } from '../hooks/useTasks';
import { ProjectKanbanBoard } from '../components/kanban/ProjectKanbanBoard';
import { MyTasksKanbanBoard } from '../components/kanban/MyTasksKanbanBoard';
import { KanbanOverviewBoard } from '../components/kanban/KanbanOverviewBoard';
import { Card, CardBody } from '../components/ui/card';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { cn } from '../lib/utils';

const MODE_DEFS = {
  project: { label: 'Project Board', icon: LayoutGrid },
  mine: { label: 'My Tasks', icon: ListTodo },
  overview: { label: 'Overview', icon: LayoutGrid },
};

const ROLE_MODE_VISIBILITY = {
  superadmin: ['project', 'mine', 'overview'],
  admin: ['project', 'mine', 'overview'],
  project_manager: ['project', 'mine', 'overview'],
  employee: ['mine'],
};

export default function Kanban() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'employee';
  const [searchParams, setSearchParams] = useSearchParams();
  const projectsQuery = useProjects();
  const employeesQuery = useEmployees();
  const overviewQuery = useKanbanOverview();
  const myTasksQuery = useMyTasksKanban();
  const availableModes = ROLE_MODE_VISIBILITY[role] || ['mine'];
  const modeParam = searchParams.get('mode');
  const defaultMode = availableModes.includes('project') ? 'project' : 'mine';
  const activeMode = availableModes.includes(modeParam) ? modeParam : defaultMode;
  const projectIdParam = searchParams.get('project') || '';

  const projects = projectsQuery.data || [];
  const employees = employeesQuery.data || [];
  const selectedProjectId = useMemo(() => {
    if (activeMode !== 'project') return projectIdParam || '';
    return projectIdParam || projects[0]?.id || '';
  }, [activeMode, projectIdParam, projects]);
  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId],
  );
  const projectTasksQuery = useProjectTasks(selectedProjectId);
  const taskCountsQuery = useTaskCounts(selectedProjectId);

  useEffect(() => {
    if (!availableModes.includes(activeMode)) {
      const next = new URLSearchParams(searchParams);
      next.set('mode', defaultMode);
      setSearchParams(next, { replace: true });
    }
  }, [activeMode, availableModes, defaultMode, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeMode === 'project' && projects.length && !projectIdParam) {
      const next = new URLSearchParams(searchParams);
      next.set('project', projects[0].id);
      next.set('mode', 'project');
      setSearchParams(next, { replace: true });
    }
  }, [activeMode, projectIdParam, projects, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeMode !== 'project' && searchParams.has('project')) {
      const next = new URLSearchParams(searchParams);
      next.delete('project');
      setSearchParams(next, { replace: true });
    }
  }, [activeMode, searchParams, setSearchParams]);

  const projectTasks = projectTasksQuery.data || [];
  const myTasks = myTasksQuery.data || [];
  const overview = overviewQuery.data || {};
  const overviewProjects = overview.projects || [];
  const overviewColumns = overview.columns || [];
  const taskCounts = taskCountsQuery.data || {};

  const boardStats = useMemo(() => {
    if (activeMode === 'project') {
      return [
        { label: 'Tasks', value: taskCounts.total || projectTasks.length, icon: ListTodo },
        { label: 'Open', value: taskCounts.open || projectTasks.filter((task) => task.status !== 'done').length, icon: Clock3 },
        { label: 'Overdue', value: taskCounts.overdue || 0, icon: ShieldAlert, tone: 'rose' },
        { label: 'Critical', value: (taskCounts.byPriority?.Critical || 0) || projectTasks.filter((task) => String(task.priority).toLowerCase() === 'critical').length, icon: AlertCircle, tone: 'amber' },
      ];
    }

    if (activeMode === 'overview') {
      return [
        { label: 'Projects', value: overview.stats?.totalProjects || overviewProjects.length, icon: LayoutGrid },
        { label: 'Active', value: overview.stats?.activeProjects || 0, icon: Clock3 },
        { label: 'Completed', value: overview.stats?.completedProjects || 0, icon: ListTodo, tone: 'emerald' },
        { label: 'Critical', value: overview.stats?.criticalProjects || 0, icon: AlertCircle, tone: 'rose' },
      ];
    }

    const open = myTasks.filter((task) => task.status !== 'done');
    const overdue = open.filter((task) => task.dueDate && new Date(task.dueDate).getTime() < Date.now());
    const critical = myTasks.filter((task) => String(task.priority).toLowerCase() === 'critical');
    return [
      { label: 'Tasks', value: myTasks.length, icon: ListTodo },
      { label: 'Open', value: open.length, icon: Clock3 },
      { label: 'Overdue', value: overdue.length, icon: ShieldAlert, tone: 'rose' },
      { label: 'Critical', value: critical.length, icon: AlertCircle, tone: 'amber' },
    ];
  }, [activeMode, myTasks, overview.stats, overviewColumns, overviewProjects.length, projectTasks, taskCounts.byPriority, taskCounts.open, taskCounts.overdue, taskCounts.total]);

  const modeOptions = availableModes.map((mode) => ({
    value: mode,
    label: MODE_DEFS[mode]?.label || mode,
    icon: MODE_DEFS[mode]?.icon,
  }));

  function updateSearchParams(nextMode, nextProjectId = selectedProjectId) {
    const next = new URLSearchParams(searchParams);
    next.set('mode', nextMode);
    if (nextMode === 'project' && nextProjectId) next.set('project', nextProjectId);
    else next.delete('project');
    setSearchParams(next, { replace: true });
  }

  function handleModeChange(nextMode) {
    if (!availableModes.includes(nextMode)) return;
    updateSearchParams(nextMode);
  }

  function handleProjectChange(nextProjectId) {
    updateSearchParams(activeMode, nextProjectId);
  }

  const isLoading = projectsQuery.isLoading || employeesQuery.isLoading || overviewQuery.isLoading || myTasksQuery.isLoading || (activeMode === 'project' && projectTasksQuery.isLoading);
  const isError = projectsQuery.isError || employeesQuery.isError || overviewQuery.isError || myTasksQuery.isError || (activeMode === 'project' && projectTasksQuery.isError);
  const errorMessage = projectsQuery.error?.message || employeesQuery.error?.message || overviewQuery.error?.message || myTasksQuery.error?.message || projectTasksQuery.error?.message;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-green p-5 sm:p-6">
        <p className="hero-kicker">Kanban</p>
        <h1 className="hero-title">Task board</h1>
        <p className="hero-subtitle max-w-3xl">
          Switch between the project board, your own tasks, and the portfolio overview. All boards keep scrolling contained inside the view.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {boardStats.map((item) => (
          <ModeStat key={item.label} {...item} />
        ))}
      </div>

      {isError ? (
        <Card>
          <CardBody className="flex items-center gap-3 py-10">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[rgb(var(--text))]">{errorMessage || 'Failed to load kanban data'}</div>
              <div className="text-xs text-slate-500">Try again after a moment.</div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {isLoading ? <SkeletonCard /> : null}

      <Card>
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {modeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleModeChange(option.value)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                      activeMode === option.value
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80',
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {option.label}
                  </button>
                );
              })}
            </div>

          {activeMode === 'project' && projects.length ? (
            <label className="ml-auto flex min-w-[280px] flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Project</span>
              <div className="relative flex-1">
                <select
                  className="input pr-10"
                    value={selectedProjectId}
                    onChange={(event) => handleProjectChange(event.target.value)}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.projectName} · {project.clientName}
                      </option>
                    ))}
                  </select>
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>
            ) : null}
          </div>

            {activeMode === 'project' ? (
              selectedProject ? (
                <ProjectKanbanBoard project={selectedProject} tasks={projectTasks} employees={employees} />
            ) : (
              <EmptyState
                title="Choose a project"
                description="Select a project from the dropdown to see the 4-column project board."
              />
            )
          ) : null}

          {activeMode === 'mine' ? <MyTasksKanbanBoard tasks={myTasks} /> : null}

          {activeMode === 'overview' ? (
            <KanbanOverviewBoard projects={overviewProjects} columns={overviewColumns} stats={overview.stats || {}} />
          ) : null}
        </CardBody>
      </Card>
    </motion.div>
  );
}

function ModeStat({ label, value, icon: Icon, tone = 'blue' }) {
  const toneMap = {
    blue: 'border-sky-200 bg-sky-50/80 text-sky-600',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-600',
    rose: 'border-rose-200 bg-rose-50/80 text-rose-600',
    emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-600',
  };

  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm', toneMap[tone] || toneMap.blue)}>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
    </div>
  );
}
