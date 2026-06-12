import { useDeferredValue, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowUpRight, BarChart3, CircleAlert, Clock3, FileSearch2, Filter, ShieldAlert, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { pageVariants, staggerItem } from '../utils/motionVariants';
import { useDashboard } from '../hooks/useDashboard';
import { useUpdateTask } from '../hooks/useTasks';
import { KPIRow } from '../components/dashboard/KPIRow';
import { ActionItemsTable } from '../components/dashboard/ActionItemsTable';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { StageHeatmapGrid } from '../components/reports/StageHeatmapGrid';
import { SearchInput } from '../components/shared/SearchInput';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';

const VIEW_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'review', label: 'Needs review' },
  { key: 'blocked', label: 'Blocked' },
];

function formatMoney(value = 0) {
  return `Rs. ${Number(value || 0).toFixed(2)}L`;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildRiskScore(row, now = Date.now()) {
  const priority = String(row.priority || '').toLowerCase();
  const status = String(row.status || '').toLowerCase();
  const decision = String(row.decision || row.comment || '').toLowerCase();
  const assignee = String(row.assigneeName || row.projectEngineer || '').trim();
  const dueDate = toDate(row.dueDate || row.targetDate);
  const overdue = dueDate ? dueDate.getTime() < now && !['done', 'completed'].includes(status) : false;
  let score = 0;

  if (priority === 'critical') score += 60;
  else if (priority === 'high') score += 35;
  else if (priority === 'medium') score += 18;

  if (['on hold', 'blocked'].includes(status)) score += 40;
  else if (status === 'todo' || status === 'pending') score += 16;
  else if (status === 'in review') score += 10;

  if (overdue) score += 30;
  if (!assignee) score += 8;
  if (decision.includes('pending') || decision.includes('approve')) score += 10;

  return { score, overdue };
}

function watchTone(score = 0) {
  if (score >= 70) return 'rose';
  if (score >= 45) return 'amber';
  if (score >= 20) return 'blue';
  return 'green';
}

function ExecutiveWatchlist({ rows = [] }) {
  return (
    <Card className="overflow-hidden border border-[rgb(var(--line)/0.12)] bg-white/92 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="border-b border-[rgb(var(--line)/0.12)] bg-gradient-to-r from-white/96 via-white/92 to-rose-50/40 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text))]">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              Priority watchlist
            </div>
            <p className="mt-1 text-xs text-slate-500">Highest-risk projects surfaced for fast executive review.</p>
          </div>
          <Badge tone={rows.length ? 'rose' : 'green'}>{rows.length ? `${rows.length} watch items` : 'Healthy'}</Badge>
        </div>
      </div>
      <CardBody className="space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel-2)/0.42)] px-4 py-3 shadow-[0_10px_26px_-22px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{row.projectName}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {row.projectClient || 'Client not set'} - {row.projectStage || 'Stage not set'}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge tone={watchTone(row.riskScore)}>{row.riskScore >= 70 ? 'Critical' : row.riskScore >= 45 ? 'Watch' : 'Track'}</Badge>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{row.status || 'Open'}</span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                <div className="rounded-xl bg-white/70 px-3 py-2">
                  <span className="text-slate-400">Next action</span>
                  <div className="mt-1 font-medium text-[rgb(var(--text))]">{row.nextAction || row.description || '-'}</div>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2">
                  <span className="text-slate-400">Responsible</span>
                  <div className="mt-1 font-medium text-[rgb(var(--text))]">{row.assigneeName || row.projectEngineer || 'Unassigned'}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-5 text-sm text-emerald-700">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              No critical items in the current view
            </div>
            <p className="mt-1 text-xs text-emerald-600/80">The portfolio is operating within a normal range.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default function CeoDashboard() {
  const dashboardQuery = useDashboard('superadmin');
  const updateTask = useUpdateTask();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('all');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const dashboard = dashboardQuery.data || {
    actions: [],
    projects: [],
    revenueSummary: [],
    summary: {},
    stages: [],
  };

  const normalizedActions = useMemo(() => {
    const now = Date.now();
    return (dashboard.actions || []).map((row, index) => {
      const { score, overdue } = buildRiskScore(row, now);
      const projectName = row.projectName || row.name || `Project ${index + 1}`;
      const projectClient = row.projectClient || row.clientName || row.client || '-';
      const projectStage = row.projectStage || row.stage || row.currentStage || '-';
      const assigneeName = row.assigneeName || row.projectEngineer || 'Unassigned';
      const status = String(row.status || '').toLowerCase();
      const priority = String(row.priority || '').toLowerCase();

      return {
        ...row,
        id: row.id || `${projectName}-${index}`,
        projectName,
        projectClient,
        projectStage,
        assigneeName,
        riskScore: score,
        overdue,
        priority,
        status,
        searchText: [
          projectName,
          projectClient,
          projectStage,
          row.nextAction,
          row.description,
          row.decision,
          row.comment,
          assigneeName,
          row.dueDate,
          row.targetDate,
          row.status,
          row.priority,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      };
    });
  }, [dashboard.actions]);

  const normalizedProjects = useMemo(() => {
    const now = Date.now();
    return (dashboard.projects || []).map((project, index) => {
      const { score, overdue } = buildRiskScore(
        {
          priority: project.priority,
          status: project.status,
          decision: project.ceoMdReview,
          assigneeName: project.responsibleEngineer?.name || project.engineer,
          dueDate: project.stageEndActual || project.stageEndPlanned || project.targetDate,
          projectName: project.projectName,
          projectClient: project.clientName,
          projectStage: project.currentStage,
        },
        now,
      );

      return {
        ...project,
        id: project.id || `${project.projectName}-${index}`,
        riskScore: score,
        overdue,
      };
    });
  }, [dashboard.projects]);

  const criticalProjects = useMemo(
    () =>
      [...normalizedProjects]
        .filter((project) => project.riskScore >= 45)
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5),
    [normalizedProjects],
  );

  const filteredActions = useMemo(() => {
    const base = [...normalizedActions]
      .filter((row) => {
        if (!deferredSearch) return true;
        return row.searchText.includes(deferredSearch);
      })
      .filter((row) => {
        if (view === 'critical') return row.priority === 'critical' || row.riskScore >= 60;
        if (view === 'overdue') return row.overdue;
        if (view === 'review') return String(row.status || '').includes('review') || String(row.decision || row.comment || '').toLowerCase().includes('pending');
        if (view === 'blocked') return ['blocked', 'on hold'].includes(String(row.status || '').toLowerCase());
        return true;
      });

    return base.sort((a, b) => b.riskScore - a.riskScore || (toDate(a.dueDate || a.targetDate)?.getTime() || 0) - (toDate(b.dueDate || b.targetDate)?.getTime() || 0));
  }, [deferredSearch, normalizedActions, view]);

  const kpis = useMemo(() => {
    const totalProjects = normalizedProjects.length || dashboard.summary.totalProjects || 0;
    const criticalAlerts = normalizedActions.filter((row) => row.priority === 'critical' || row.riskScore >= 60).length;
    const openTasks = Number(dashboard.summary.openTasks || normalizedActions.length || 0);
    const overdueTasks = normalizedActions.filter((row) => row.overdue).length || Number(dashboard.summary.overdueTasks || 0);
    const pendingApprovals = Number(dashboard.summary.pendingApprovals || 0);
    const healthyProjects = Math.max(totalProjects - criticalAlerts, 0);
    const collected = Number(dashboard.summary.receivedTotal || 0);
    const balance = Number(dashboard.summary.balanceTotal || 0);

    return [
      { label: 'Total Projects', value: totalProjects, sub: 'Live records', accent: '#2E83F5', icon: BarChart3 },
      { label: 'Critical Alerts', value: criticalAlerts, sub: 'Requires action', accent: '#f43f5e', icon: CircleAlert },
      { label: 'Open Tasks', value: openTasks, sub: 'Queue depth', accent: '#0ea5e9', icon: FileSearch2 },
      { label: 'Overdue Tasks', value: overdueTasks, sub: 'Past due', accent: '#f59e0b', icon: Clock3 },
      { label: 'Pending Approvals', value: pendingApprovals, sub: 'Awaiting review', accent: '#0ea5e9', icon: ShieldAlert },
      { label: 'Billing Received', value: formatMoney(collected), sub: 'Collected revenue', accent: '#10b981', icon: Wallet },
      { label: 'Outstanding', value: formatMoney(balance), sub: 'Pending balance', accent: '#f59e0b', icon: TrendingUp },
      { label: 'Healthy Projects', value: healthyProjects, sub: 'Low-risk pipeline', accent: '#22c55e', icon: Sparkles },
    ];
  }, [dashboard.summary.balanceTotal, dashboard.summary.openTasks, dashboard.summary.pendingApprovals, dashboard.summary.receivedTotal, normalizedActions, normalizedProjects.length]);

  const filterCounts = useMemo(
    () => ({
      all: normalizedActions.length,
      critical: normalizedActions.filter((row) => row.priority === 'critical' || row.riskScore >= 60).length,
      overdue: normalizedActions.filter((row) => row.overdue).length,
      review: normalizedActions.filter((row) => String(row.status || '').includes('review') || String(row.decision || row.comment || '').toLowerCase().includes('pending')).length,
      blocked: normalizedActions.filter((row) => ['blocked', 'on hold'].includes(String(row.status || '').toLowerCase())).length,
    }),
    [normalizedActions],
  );

  const revenueSummary = dashboard.revenueSummary || [];
  const stageData = dashboard.stages || [];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-20">
      <motion.section variants={staggerItem} className="theme-hero theme-hero-amber overflow-hidden p-5 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.4)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.12)] bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600 shadow-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              CEO / MD View
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <h1 className="hero-title">Executive control panel</h1>
            <p className="hero-subtitle max-w-3xl">One workspace for projects, tasks, billing, and stage signals. Designed for quick executive analysis across large datasets.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-[rgb(var(--line)/0.08)]">
                <ArrowUpRight className="h-3.5 w-3.5 text-sky-500" />
                Focus on risks
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-[rgb(var(--line)/0.08)]">
                <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                Track billing health
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-[rgb(var(--line)/0.08)]">
                <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                Review overdue items
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/60 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-[rgb(var(--line)/0.16)] dark:bg-[rgb(var(--panel-2)/0.78)] dark:text-slate-300">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4" />
              Executive alerts active
            </div>
            <div className="mt-1 text-xs text-slate-500">Critical projects, overdue tasks, and billing balances update from live APIs.</div>
          </div>
        </div>
      </motion.section>

      {dashboardQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardBody>
                <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : dashboardQuery.isError ? (
        <Card className="border border-[rgb(var(--line)/0.12)] shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
          <CardBody className="flex items-center gap-3 py-10">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[rgb(var(--text))]">{dashboardQuery.error?.message || 'Failed to load executive dashboard'}</div>
              <div className="text-xs text-slate-500">Refresh the page or try again after a moment.</div>
            </div>
            <Button variant="secondary" onClick={() => dashboardQuery.refetch()}>
              Retry
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <motion.div variants={staggerItem}>
        <KPIRow data={kpis} />
      </motion.div>

      <motion.section variants={staggerItem} className="rounded-[var(--radius)] border border-[rgb(var(--line)/0.12)] bg-white/85 p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Analyze</div>
            <h2 className="mt-1 font-display text-lg font-semibold text-[rgb(var(--text))]">Search and filter the executive queue</h2>
            <p className="mt-1 text-sm text-slate-500">Filter projects and tasks in real time. The table below stays fast even when the dataset grows.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="slate">{filteredActions.length} visible</Badge>
            <Badge tone="slate">{filterCounts.critical} critical</Badge>
            <Badge tone="slate">{filterCounts.overdue} overdue</Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects, clients, stages, actions, engineers, or decisions..." />
          <div className="flex flex-wrap gap-2">
            {VIEW_FILTERS.map((item) => {
              const active = view === item.key;
              return (
                <Button key={item.key} size="sm" variant={active ? 'primary' : 'secondary'} onClick={() => setView(item.key)}>
                  <Filter className="h-3.5 w-3.5" />
                  {item.label}
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                    {filterCounts[item.key] || 0}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] xl:items-start">
        <motion.div variants={staggerItem} className="min-w-0">
          <ActionItemsTable
            tasks={filteredActions}
            showApproveButtons
            onApprove={(row) => updateTask.mutate({ id: row.id, payload: { status: 'done' } })}
            onReject={(row) => updateTask.mutate({ id: row.id, payload: { status: 'todo' } })}
          />
        </motion.div>

        <motion.aside
          variants={staggerItem}
          className="space-y-6 xl:sticky xl:top-24 xl:self-start xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1 scrollbar-none"
        >
          <ExecutiveWatchlist rows={criticalProjects.map((project) => ({ ...project, projectName: project.projectName, projectClient: project.clientName, projectStage: project.currentStage, status: project.status, nextAction: project.ceoMdReview || project.remarks || 'Review required', assigneeName: project.responsibleEngineer?.name || project.engineer || 'Unassigned' }))} />
          <RevenueChart data={revenueSummary} />
          <StageHeatmapGrid data={stageData} />
        </motion.aside>
      </div>
    </motion.div>
  );
}
