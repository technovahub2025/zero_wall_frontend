import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check, ChevronDown, Clock3, ListTodo, LayoutGrid, Search, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { useEmployees } from '../hooks/useEmployees';
import { useProjects } from '../hooks/useProjects';
import { useTeams } from '../hooks/useTeams';
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
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef(null);
  const projectsQuery = useProjects();
  const teamsQuery = useTeams();
  const employeesQuery = useEmployees();
  const overviewQuery = useKanbanOverview();
  const myTasksQuery = useMyTasksKanban();
  const availableModes = ROLE_MODE_VISIBILITY[role] || ['mine'];
  const modeParam = searchParams.get('mode');
  const defaultMode = availableModes.includes('project') ? 'project' : 'mine';
  const activeMode = availableModes.includes(modeParam) ? modeParam : defaultMode;
  const projectIdParam = searchParams.get('project') || '';

  const projects = projectsQuery.data || [];
  const teams = teamsQuery.data || [];
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
  const selectedProjectLabel = selectedProject ? `${selectedProject.projectName} · ${selectedProject.clientName}` : 'Choose a project';

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
    setProjectDropdownOpen(false);
  }

  function handleSelectProject(nextProjectId) {
    if (!nextProjectId) return;
    handleProjectChange(nextProjectId);
  }

  useEffect(() => {
    if (activeMode !== 'project') {
      setProjectDropdownOpen(false);
    }
  }, [activeMode]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!projectDropdownRef.current) return;
      if (!projectDropdownRef.current.contains(event.target)) {
        setProjectDropdownOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setProjectDropdownOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const isLoading = projectsQuery.isLoading || teamsQuery.isLoading || employeesQuery.isLoading || overviewQuery.isLoading || myTasksQuery.isLoading || (activeMode === 'project' && projectTasksQuery.isLoading);
  const isError = projectsQuery.isError || teamsQuery.isError || employeesQuery.isError || overviewQuery.isError || myTasksQuery.isError || (activeMode === 'project' && projectTasksQuery.isError);
  const errorMessage = projectsQuery.error?.message || teamsQuery.error?.message || employeesQuery.error?.message || overviewQuery.error?.message || myTasksQuery.error?.message || projectTasksQuery.error?.message;

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
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
              <div ref={projectDropdownRef} className="flex min-w-0 flex-1 flex-col gap-1 xl:max-w-2xl xl:flex-none">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Project</span>
                <div className="relative min-w-0">
                  <button
                    type="button"
                    onClick={() => setProjectDropdownOpen((current) => !current)}
                    className="flex h-11 w-full items-center gap-3 rounded-2xl border border-sky-200 bg-white px-4 text-left text-sm text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-slate-50"
                  >
                    <span className="min-w-0 flex-1 truncate">{selectedProjectLabel}</span>
                    <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <ChevronDown className={cn('h-4 w-4 flex-shrink-0 text-slate-400 transition-transform', projectDropdownOpen && 'rotate-180')} />
                  </button>

                  {projectDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                      <div className="scrollbar-none max-h-72 overflow-y-auto py-1">
                        {projects.map((project) => {
                          const isActive = String(project.id) === String(selectedProjectId);
                          return (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => handleSelectProject(project.id)}
                              className={cn(
                                'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition',
                                isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50',
                              )}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {project.projectName} · {project.clientName}
                              </span>
                              {isActive ? <Check className="h-4 w-4 flex-shrink-0 text-sky-600" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {activeMode === 'project' ? (
            selectedProject ? (
              <ProjectKanbanBoard project={selectedProject} tasks={projectTasks} employees={employees} teams={teams} />
            ) : (
              <EmptyState
                title="Choose a project"
                description="Select a project from the dropdown to see the 4-column project board."
              />
            )
          ) : null}

          {activeMode === 'mine' ? <MyTasksKanbanBoard tasks={myTasks} projects={projects} employees={employees} teams={teams} /> : null}

          {activeMode === 'overview' ? (
            <KanbanOverviewBoard projects={overviewProjects} columns={overviewColumns} employees={employees} stats={overview.stats || {}} />
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
