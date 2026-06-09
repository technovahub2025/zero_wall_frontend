import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertCircle, BarChart3, Clock3, Layers3, PieChart, ShieldAlert, TriangleAlert, Users } from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useDashboard } from '../hooks/useDashboard';
import { KPIRow } from '../components/dashboard/KPIRow';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { WorkloadPanel } from '../components/dashboard/WorkloadPanel';
import { ProjectTable } from '../components/projects/ProjectTable';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { EmptyState } from '../components/shared/EmptyState';
import { Card, CardBody } from '../components/ui/card';
import { Button } from '../components/ui/button';

const DASHBOARD_VIEWS = [
  { id: 'all', label: 'All data', icon: Layers3 },
  { id: 'operations', label: 'Projects & tasks', icon: PieChart },
  { id: 'finance', label: 'Finance', icon: BarChart3 },
  { id: 'team', label: 'Team', icon: Users },
];

function formatRelativeTime(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (abs < 60_000) return rtf.format(Math.round(diff / 1000), 'second');
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour');
  return rtf.format(Math.round(diff / 86_400_000), 'day');
}

export default function Dashboard() {
  const [activeView, setActiveView] = useState('all');
  const dashboardQuery = useDashboard('superadmin');
  const dashboard = dashboardQuery.data || {
    kpis: [],
    actions: [],
    projects: [],
    revenueSummary: [],
    team: [],
    recentActivity: [],
    summary: {},
    stages: [],
    tasks: [],
  };

  const visibleProjects = useMemo(() => dashboard.projects.slice(0, 8), [dashboard.projects]);
  const recentActivity = useMemo(() => dashboard.recentActivity.slice(0, 5), [dashboard.recentActivity]);
  const criticalProjects = useMemo(
    () => dashboard.projects.filter((project) => String(project.priority).toLowerCase() === 'critical').length,
    [dashboard.projects],
  );
  const completionRate = useMemo(() => {
    const totalProjects = Number(dashboard.summary?.totalProjects || dashboard.projects.length || 0);
    const completedProjects = Number(dashboard.summary?.completed || 0);
    return totalProjects ? Math.round((completedProjects / totalProjects) * 100) : 0;
  }, [dashboard.projects.length, dashboard.summary?.completed, dashboard.summary?.totalProjects]);
  const collectionRate = useMemo(() => {
    const totalValue = Number(dashboard.summary?.totalValue || 0);
    const receivedTotal = Number(dashboard.summary?.receivedTotal || 0);
    return totalValue ? Math.round((receivedTotal / totalValue) * 100) : 0;
  }, [dashboard.summary?.receivedTotal, dashboard.summary?.totalValue]);

  const portfolioMetrics = useMemo(
    () => [
      {
        label: 'Overdue tasks',
        value: Number(dashboard.summary?.overdueTasks || 0),
        note: 'Needs immediate follow-up',
        tone: 'rose',
        icon: ShieldAlert,
      },
      {
        label: 'Due soon',
        value: Number(dashboard.summary?.dueSoonTasks || 0),
        note: 'Next 48 hours',
        tone: 'amber',
        icon: Clock3,
      },
      {
        label: 'Pending approvals',
        value: Number(dashboard.summary?.pendingApprovals || 0),
        note: 'Awaiting review',
        tone: 'sky',
        icon: TriangleAlert,
      },
      {
        label: 'Critical projects',
        value: criticalProjects,
        note: 'High priority escalations',
        tone: 'blue',
        icon: Activity,
      },
    ],
    [criticalProjects, dashboard.summary?.dueSoonTasks, dashboard.summary?.overdueTasks, dashboard.summary?.pendingApprovals],
  );
  const showAll = activeView === 'all';
  const showOperations = showAll || activeView === 'operations';
  const showFinance = showAll || activeView === 'finance';
  const showTeam = showAll || activeView === 'team';

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Dashboard</p>
            <h1 className="hero-title">Project portfolio control center</h1>
            <p className="hero-subtitle max-w-3xl">Live project, task, and billing data for the active portfolio.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_VIEWS.map((view) => {
              const Icon = view.icon;
              const active = activeView === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-sky-300 bg-sky-100 text-sky-700 shadow-sm'
                      : 'border-[rgb(var(--line)/0.14)] bg-white/70 text-[rgb(var(--text))] hover:border-sky-200 hover:bg-sky-50/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {dashboardQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : dashboardQuery.isError ? (
        <Card>
          <CardBody className="flex items-center gap-3 py-10">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[rgb(var(--text))]">{dashboardQuery.error?.message || 'Failed to load dashboard'}</div>
              <div className="text-xs text-slate-500">Refresh the page or try again after a moment.</div>
            </div>
            <Button variant="secondary" onClick={() => dashboardQuery.refetch()}>Retry</Button>
          </CardBody>
        </Card>
      ) : null}

      <KPIRow data={dashboard.kpis} />

      {showAll ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]"
        >
          <Card className="overflow-hidden">
            <CardBody className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-500">Portfolio snapshot</div>
                  <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">Compact risk overview</h2>
                  <p className="mt-1 text-xs text-slate-500">High-signal counters only, so the dashboard stays readable.</p>
                </div>
                <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
                  Live
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {portfolioMetrics.map((metric) => {
                  const Icon = metric.icon;
                  const tones = {
                    blue: 'border-sky-200 bg-sky-50/80 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200',
                    sky: 'border-cyan-200 bg-cyan-50/80 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200',
                    amber: 'border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200',
                    rose: 'border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200',
                  };

                  return (
                    <div key={metric.label} className={`rounded-2xl border p-3 ${tones[metric.tone]}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{metric.label}</div>
                          <div className="mt-2 text-xl font-semibold text-[rgb(var(--text))]">{metric.value}</div>
                        </div>
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{metric.note}</div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <CompactProgress label="Completion rate" value={completionRate} helper={`${dashboard.summary?.completed || 0} completed projects`} />
                <CompactProgress label="Collection rate" value={collectionRate} helper={`${dashboard.summary?.receivedTotal || 0} received from ${dashboard.summary?.totalValue || 0}`} />
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardBody className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-500">Recent activity</div>
                  <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">Latest updates</h2>
                  <p className="mt-1 text-xs text-slate-500">A compact feed of the newest project and team events.</p>
                </div>
                <span className="rounded-full border border-[rgb(var(--line)/0.14)] bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-[rgb(var(--panel-2)/0.78)]">
                  {recentActivity.length} items
                </span>
              </div>

              <div className="max-h-[284px] space-y-2 overflow-auto pr-1">
                {recentActivity.length ? (
                  recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/70 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 dark:bg-[rgb(var(--panel-2)/0.78)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{item.title || item.action || 'Activity update'}</div>
                            <span className="rounded-full border border-[rgb(var(--line)/0.12)] bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {item.tone || 'sky'}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {item.detail || item.project?.projectName || 'No additional details'}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span>{item.actor?.name || 'System'}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{formatRelativeTime(item.occurredAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.16)] bg-white/70 px-4 py-8 text-sm text-slate-400 dark:bg-[rgb(var(--panel-2)/0.78)]">
                    No recent activity yet.
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.section>
      ) : null}

      <AnimatePresence mode="wait">
        {showAll ? (
          <motion.div
            key="dashboard-all"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
          >
            <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.45fr)]">
              <Card>
                <CardBody className="p-0">
                  <ProjectTable rows={visibleProjects} compact />
                </CardBody>
              </Card>
              <div className="flex h-full xl:sticky xl:top-24">
                <WorkloadPanel members={dashboard.team} />
              </div>
            </div>

            <RevenueChart data={dashboard.revenueSummary} />
          </motion.div>
        ) : null}

        {showOperations && !showAll ? (
          <motion.div
            key="dashboard-operations"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="grid gap-6 xl:grid-cols-1"
          >
            <Card>
              <CardBody className="p-0">
                <ProjectTable rows={visibleProjects} compact />
              </CardBody>
            </Card>
          </motion.div>
        ) : null}

        {showFinance && !showAll ? (
          <motion.div
            key="dashboard-finance"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="grid gap-6 xl:grid-cols-1"
          >
            <RevenueChart data={dashboard.revenueSummary} />
          </motion.div>
        ) : null}

        {showTeam && !showAll ? (
          <motion.div
            key="dashboard-team"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="grid gap-6 xl:grid-cols-1"
          >
            <WorkloadPanel members={dashboard.team} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!dashboard.projects.length && !dashboardQuery.isLoading ? (
        <EmptyState title="No projects available" description="Seed data or live API data was not returned." />
      ) : null}
    </motion.div>
  );
}

function CompactProgress({ label, value, helper }) {
  const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 0;

  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/70 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] dark:bg-[rgb(var(--panel-2)/0.78)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-[rgb(var(--text))]">{safeValue}%</div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-[width] duration-300" style={{ width: `${safeValue}%` }} />
      </div>
      <div className="mt-2 text-xs text-slate-500">{helper}</div>
    </div>
  );
}
