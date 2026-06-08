import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, BarChart3, Layers3, PieChart, Users } from 'lucide-react';
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

export default function Dashboard() {
  const [activeView, setActiveView] = useState('all');
  const dashboardQuery = useDashboard('superadmin');
  const dashboard = dashboardQuery.data || {
    kpis: [],
    actions: [],
    projects: [],
    revenueSummary: [],
    team: [],
    summary: {},
  };

  const visibleProjects = useMemo(() => dashboard.projects.slice(0, 8), [dashboard.projects]);
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

      <AnimatePresence mode="wait">
        {showAll ? (
          <motion.div
            key="dashboard-all"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] xl:items-start"
          >
            <div className="min-w-0 space-y-6">
              <Card>
                <CardBody className="p-0">
                  <ProjectTable rows={visibleProjects} />
                </CardBody>
              </Card>
            </div>
            <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
              <RevenueChart data={dashboard.revenueSummary} />
              <WorkloadPanel members={dashboard.team} />
            </div>
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
                <ProjectTable rows={visibleProjects} />
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
