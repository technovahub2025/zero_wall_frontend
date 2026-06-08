import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Banknote,
  CircleDollarSign,
  Layers3,
  PieChart as PieChartIcon,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useEngineerUtilization, useReportOverview, useRevenueTrend, useStageCompletion } from '../hooks/useReports';
import { pageVariants } from '../utils/motionVariants';
import { Badge } from '../components/ui/badge';
import { ExportButton } from '../components/shared/ExportButton';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { VirtualList } from '../components/shared/VirtualList';
import { exportWorkbookToExcel } from '../utils/exportUtils';

const STATUS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];
const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#3b82f6',
  Low: '#10b981',
};
const TASK_ORDER = ['todo', 'in-progress', 'review', 'done'];
const TASK_COLORS = {
  todo: '#3b82f6',
  'in-progress': '#f59e0b',
  review: '#8b5cf6',
  done: '#10b981',
};
const SECTION_OPTIONS = [
  { id: 'all', label: 'All reports', icon: SlidersHorizontal },
  { id: 'overview', label: 'Overview', icon: PieChartIcon },
  { id: 'finance', label: 'Finance', icon: BadgeDollarSign },
  { id: 'delivery', label: 'Delivery', icon: BarChart3 },
  { id: 'team', label: 'Team', icon: Users },
];

export default function ReportsPage() {
  const [activeSection, setActiveSection] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const overviewQuery = useReportOverview();
  const revenueQuery = useRevenueTrend();
  const stageQuery = useStageCompletion();
  const engineerQuery = useEngineerUtilization();

  const overview = overviewQuery.data || {};
  const billing = overview.billing || { received: 0, balance: 0, total: 0 };

  const statusRows = useMemo(
    () =>
      Object.entries(overview.byStatus || {})
        .map(([name, value], index) => ({
          name,
          value: Number(value || 0),
          color: STATUS_COLORS[index % STATUS_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value),
    [overview.byStatus],
  );

  const priorityRows = useMemo(
    () =>
      PRIORITY_ORDER.map((name) => ({
        name,
        value: Number(overview.byPriority?.[name] || 0),
        color: PRIORITY_COLORS[name],
      })),
    [overview.byPriority],
  );

  const taskRows = useMemo(
    () =>
      TASK_ORDER.map((name) => ({
        name,
        label: prettyLabel(name),
        value: Number(overview.byTaskStatus?.[name] || 0),
        color: TASK_COLORS[name],
      })),
    [overview.byTaskStatus],
  );

  const revenueRows = useMemo(() => {
    const rows = Array.isArray(revenueQuery.data) ? revenueQuery.data : [];
    return rows.map((row) => ({
      month: prettyMonth(row.month),
      received: Number(row.received || 0),
      balance: Number(row.balance || 0),
      total: Number(row.total || 0),
      rawMonth: row.month,
    }));
  }, [revenueQuery.data]);
  const hasRevenueSinglePoint = revenueRows.length === 1;

  const stageRows = useMemo(() => {
    const rows = Array.isArray(stageQuery.data?.stages) ? stageQuery.data.stages : [];
    return rows
      .map((row) => {
        const values = Object.values(row.stages || {}).map((value) => Number(value || 0));
        const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
        const peakEntry = Object.entries(row.stages || {}).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0];

        return {
          id: row.projectId,
          projectName: row.projectName,
          average,
          peakStage: peakEntry?.[0] || 'No stage',
          stages: row.stages || {},
        };
      })
      .sort((a, b) => b.average - a.average);
  }, [stageQuery.data]);

  const engineerRows = useMemo(
    () =>
      (Array.isArray(engineerQuery.data) ? engineerQuery.data : [])
        .map((row) => ({
          name: row.name,
          projects: Number(row.projects || 0),
          hours: Number(row.hours || 0),
        }))
        .sort((a, b) => b.hours - a.hours),
    [engineerQuery.data],
  );

  const totalProjects = Number(overview.totalProjects || 0);
  const totalTasks = taskRows.reduce((sum, row) => sum + row.value, 0);
  const completedProjects = Number(overview.byStatus?.Completed || 0);
  const completionRate = totalProjects ? Math.round((completedProjects / totalProjects) * 100) : 0;
  const revenueCoverage = Number(billing.total || 0) ? Math.round((Number(billing.received || 0) / Number(billing.total || 0)) * 100) : 0;
  const averageStageCompletion = stageRows.length
    ? Math.round(stageRows.reduce((sum, row) => sum + row.average, 0) / stageRows.length)
    : 0;
  const peakRevenueMonth = revenueRows.reduce(
    (best, row) => (row.received > best.received ? row : best),
    revenueRows[0] || { month: 'No data', received: 0 },
  );
  const topEngineer = engineerRows[0] || { name: 'No data', projects: 0, hours: 0 };

  const loading = overviewQuery.isLoading || revenueQuery.isLoading || stageQuery.isLoading || engineerQuery.isLoading;
  const error = overviewQuery.error || revenueQuery.error || stageQuery.error || engineerQuery.error;

  const showAll = activeSection === 'all';
  const showOverview = showAll || activeSection === 'overview';
  const showFinance = showAll || activeSection === 'finance';
  const showDelivery = showAll || activeSection === 'delivery';
  const showTeam = showAll || activeSection === 'team';

  function buildExportSheets() {
    const sheets = [
      {
        name: 'Summary',
        rows: [
          { metric: 'Projects', value: totalProjects },
          { metric: 'Tasks', value: totalTasks },
          { metric: 'Completed projects', value: completedProjects },
          { metric: 'Completion rate', value: `${completionRate}%` },
          { metric: 'Received', value: billing.received },
          { metric: 'Outstanding', value: billing.balance },
          { metric: 'Total billed', value: billing.total },
          { metric: 'Coverage', value: `${revenueCoverage}%` },
          { metric: 'Avg stage completion', value: `${averageStageCompletion}%` },
          { metric: 'Top engineer', value: topEngineer.name },
        ],
      },
      {
        name: 'Project Status',
        rows: statusRows.map((row) => ({ status: prettyLabel(row.name), projects: row.value })),
      },
      {
        name: 'Priority',
        rows: priorityRows.map((row) => ({ priority: row.name, projects: row.value })),
      },
      {
        name: 'Task Status',
        rows: taskRows.map((row) => ({ status: row.label, tasks: row.value })),
      },
      {
        name: 'Revenue Trend',
        rows: revenueRows.map((row) => ({
          month: row.month,
          received: row.received,
          balance: row.balance,
          total: row.total,
        })),
      },
      {
        name: 'Engineer Utilization',
        rows: engineerRows.map((row) => ({
          engineer: row.name,
          projects: row.projects,
          hours: row.hours,
        })),
      },
      {
        name: 'Stage Completion',
        rows: stageRows.map((row) => ({
          project: row.projectName,
          average: row.average,
          peakStage: row.peakStage,
          ...row.stages,
        })),
      },
    ];

    if (activeSection === 'all') return sheets;
    if (showOverview) return sheets.slice(0, 3);
    if (showFinance) return [sheets[0], sheets[3], sheets[4]];
    if (showDelivery) return [sheets[0], sheets[1], sheets[2], sheets[3], sheets[6]];
    if (showTeam) return [sheets[0], sheets[5]];
    return sheets;
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const sectionName =
        activeSection === 'all'
          ? 'all'
          : activeSection === 'overview'
            ? 'overview'
            : activeSection === 'finance'
              ? 'finance'
              : activeSection === 'delivery'
                ? 'delivery'
                : 'team';
      exportWorkbookToExcel(buildExportSheets(), `reports-${sectionName}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) return <SkeletonCard />;

  if (error) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3 py-10">
          <BarChart3 className="h-5 w-5 text-rose-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[rgb(var(--text))]">
              {error?.message || 'Failed to load reports'}
            </div>
            <div className="text-xs text-slate-500">Try again after a moment.</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-slate p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Reports</p>
            <h1 className="hero-title">Reports and analytics</h1>
            <p className="hero-subtitle max-w-3xl">
              Modern performance dashboards for status, priority, revenue, stage progression, and team utilization.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export'}
            </ExportButton>
            <Badge tone="slate" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Live dashboard
            </Badge>
            <Badge tone="blue" className="gap-1.5">
              <Layers3 className="h-3.5 w-3.5" />
              {totalProjects} projects
            </Badge>
            <Badge tone="green" className="gap-1.5">
              <CircleDollarSign className="h-3.5 w-3.5" />
              {formatCurrency(billing.received)} received
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Layers3} label="Projects" value={totalProjects} hint={`${completedProjects} completed`} tone="blue" />
        <MetricCard icon={BarChart3} label="Tasks" value={totalTasks} hint="Across all statuses" tone="amber" />
        <MetricCard
          icon={BadgeDollarSign}
          label="Received"
          value={formatCurrency(billing.received)}
          hint={`${revenueCoverage}% of billed total`}
          tone="emerald"
        />
        <MetricCard icon={Banknote} label="Outstanding" value={formatCurrency(billing.balance)} hint="Unpaid invoices" tone="rose" />
      </section>

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Dataset focus</div>
            <div className="mt-1 text-sm text-slate-500">
              Switch between data families to reduce visual noise when you are working with larger datasets.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SECTION_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = activeSection === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActiveSection(option.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-sky-300 bg-sky-100 text-sky-700 shadow-sm'
                      : 'border-[rgb(var(--line)/0.14)] bg-white/70 text-[rgb(var(--text))] hover:border-sky-200 hover:bg-sky-50/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {showOverview ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <PieChartIcon className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Project status composition</CardTitle>
                  <p className="text-xs text-slate-500">Current distribution of live project states.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative h-[320px]">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={statusRows}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={76}
                      outerRadius={118}
                      paddingAngle={4}
                      stroke="transparent"
                    >
                      {statusRows.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Completion</div>
                  <div className="mt-1 text-4xl font-semibold text-[rgb(var(--text))]">{completionRate}%</div>
                  <div className="mt-1 text-xs text-slate-500">{completedProjects} completed projects</div>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2">
                {statusRows.length ? (
                  statusRows.map((row) => (
                    <div key={row.name} className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/70 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                        <span className="truncate text-sm font-medium text-[rgb(var(--text))]">{prettyLabel(row.name)}</span>
                      </div>
                      <div className="text-sm font-semibold text-[rgb(var(--text))]">{row.value}</div>
                    </div>
                  ))
                ) : (
                  <EmptyChartState label="No status data" />
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Priority distribution</CardTitle>
                  <p className="text-xs text-slate-500">Weighted backlog pressure across all priorities.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="h-[390px]">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={priorityRows} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                    <defs>
                      {priorityRows.map((row) => (
                        <linearGradient key={row.name} id={`priority-${row.name}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={row.color} stopOpacity={0.7} />
                          <stop offset="100%" stopColor={row.color} stopOpacity={1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={92} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                      {priorityRows.map((row) => (
                        <Cell key={row.name} fill={`url(#priority-${row.name})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </section>
      ) : null}

      {showFinance ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Revenue trend</CardTitle>
                  <p className="text-xs text-slate-500">
                    Received vs balance over time. Peak month: {peakRevenueMonth.month}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="h-[390px]">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={revenueRows} margin={{ top: 28, right: 24, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="receivedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis
                      width={96}
                      tickMargin={10}
                      tickFormatter={formatCompactCurrency}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<ChartTooltip currency />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="received"
                      name="Received"
                      stroke="#10b981"
                      fill="url(#receivedFill)"
                      strokeWidth={4}
                      dot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }}
                      activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                    <LabelList
                      dataKey="received"
                      position="top"
                      offset={12}
                      formatter={(value) => formatCurrency(value)}
                      style={{ fill: '#10b981', fontSize: 11, fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name="Balance"
                      stroke="#ef4444"
                      fill="url(#balanceFill)"
                      strokeWidth={4}
                      dot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#ef4444' }}
                      activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                    <LabelList
                      dataKey="balance"
                      position="top"
                      offset={12}
                      formatter={(value) => formatCurrency(value)}
                      style={{ fill: '#ef4444', fontSize: 11, fontWeight: 600 }}
                    />
                    {revenueRows.length > 8 ? <Brush dataKey="month" height={22} travellerWidth={10} /> : null}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {hasRevenueSinglePoint ? (
                <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.14)] bg-slate-50/80 px-3 py-2 text-xs text-slate-500">
                  Only one revenue period is available, so direct value labels are shown to keep the amounts visible.
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <BadgeDollarSign className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Financial snapshot</CardTitle>
                  <p className="text-xs text-slate-500">Fast view of billing totals and the strongest month.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricInline label="Total billed" value={formatCurrency(billing.total)} />
                <MetricInline label="Received" value={formatCurrency(billing.received)} />
                <MetricInline label="Outstanding" value={formatCurrency(billing.balance)} />
                <MetricInline label="Coverage" value={`${revenueCoverage}%`} />
              </div>
              <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/75 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Peak month</div>
                <div className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">{peakRevenueMonth.month}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Highest received value at {formatCurrency(peakRevenueMonth.received)}
                </div>
              </div>
              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {revenueRows.length ? (
                  revenueRows.slice(-6).map((row) => (
                    <div key={row.rawMonth} className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.12)] bg-slate-50/70 px-3 py-2">
                      <div className="text-sm font-medium text-[rgb(var(--text))]">{row.month}</div>
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-emerald-600">{formatCurrency(row.received)}</span> /{' '}
                        <span className="font-semibold text-rose-600">{formatCurrency(row.balance)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyChartState label="No revenue data" />
                )}
              </div>
            </CardBody>
          </Card>
        </section>
      ) : null}

      {showDelivery ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Task flow by status</CardTitle>
                  <p className="text-xs text-slate-500">Operational pipeline across task states.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="h-[390px]">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={taskRows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {taskRows.map((row) => (
                        <Cell key={row.name} fill={row.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Stage completion heatmap</CardTitle>
                  <p className="text-xs text-slate-500">
                    Average stage progression by project with a scrollable stage matrix for deeper inspection.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="h-[360px] min-w-0">
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={stageRows.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="projectName" width={120} tickLine={false} axisLine={false} interval={0} />
                    <Tooltip content={<ChartTooltip percent />} />
                    <Bar dataKey="average" radius={[0, 12, 12, 0]}>
                      {stageRows.slice(0, 8).map((row, index) => (
                        <Cell key={row.id || row.projectName} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="blue">Avg {averageStageCompletion}%</Badge>
                  <Badge tone="emerald">{stageRows.length} projects</Badge>
                  <Badge tone="slate">Top: {stageRows[0]?.projectName || 'N/A'}</Badge>
                </div>
                <div className="max-h-[330px] space-y-3 overflow-y-auto pr-1">
                  {stageRows.length ? (
                    stageRows.length > 8 ? (
                      <VirtualList
                        items={stageRows}
                        estimateSize={164}
                        className="h-[330px]"
                        renderItem={(row) => <StageSummaryRow row={row} />}
                      />
                    ) : (
                      stageRows.map((row) => <StageSummaryRow key={row.id || row.projectName} row={row} />)
                    )
                  ) : (
                    <EmptyChartState label="No stage completion data" />
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
      ) : null}

      {showTeam ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Engineer utilization</CardTitle>
                  <p className="text-xs text-slate-500">Projects handled and hours logged by each engineer.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="h-[390px]">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={engineerRows} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} allowDecimals />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="projects"
                      name="Projects"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="hours"
                      name="Hours"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    {engineerRows.length > 8 ? <Brush dataKey="name" height={22} travellerWidth={10} /> : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Team capacity snapshot</CardTitle>
                  <p className="text-xs text-slate-500">Sorted by hours so high-load engineers stay visible.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricInline label="Engineers" value={engineerRows.length} />
                <MetricInline label="Top engineer" value={topEngineer.name} />
              </div>
              <div className="max-h-[290px] space-y-2 overflow-y-auto pr-1">
                {engineerRows.length ? (
                  engineerRows.map((engineer, index) => (
                    <div
                      key={engineer.name}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/75 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{engineer.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {engineer.projects} projects • {engineer.hours} hours
                        </div>
                      </div>
                      <Badge tone={index === 0 ? 'green' : 'slate'}>{index === 0 ? 'Top load' : 'Active'}</Badge>
                    </div>
                  ))
                ) : (
                  <EmptyChartState label="No utilization data" />
                )}
              </div>
            </CardBody>
          </Card>
        </section>
      ) : null}
    </motion.div>
  );
}

function MetricCard({ icon: Icon, label, value, hint, tone = 'blue' }) {
  const toneStyles = {
    blue: 'bg-sky-100 text-sky-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-3 p-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
          <div className="mt-1 text-xs text-slate-500">{hint}</div>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneStyles[tone] || toneStyles.blue}`}>
          <Icon className="h-5 w-5" />
        </span>
      </CardBody>
    </Card>
  );
}

function MetricInline({ label, value }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-slate-50/70 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-[rgb(var(--text))]">{value}</div>
    </div>
  );
}

function StageSummaryRow({ row }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/75 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{row.projectName}</div>
          <div className="mt-1 text-xs text-slate-500">Strongest stage: {row.peakStage}</div>
        </div>
        <Badge tone={row.average >= 80 ? 'green' : row.average >= 50 ? 'amber' : 'rose'}>{row.average}%</Badge>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(row.stages || {})
          .slice(0, 6)
          .map(([stageName, pct]) => {
            const value = Number(pct || 0);
            return (
              <div key={stageName} className="rounded-xl border border-[rgb(var(--line)/0.12)] bg-slate-50/70 p-2">
                <div className="truncate text-[11px] font-medium text-slate-500">{stageName}</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, value))}%`,
                      background: `linear-gradient(90deg, ${blendColor(value)}, ${blendColor(Math.min(100, value + 18))})`,
                    }}
                  />
                </div>
                <div className="mt-1 text-xs font-semibold text-[rgb(var(--text))]">{value}%</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, currency = false, percent = false }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.16)] bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      {label ? <div className="text-xs font-semibold text-[rgb(var(--text))]">{label}</div> : null}
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill || '#3b82f6' }} />
              <span>{entry.name || prettyLabel(entry.dataKey)}</span>
            </div>
            <span className="font-semibold text-[rgb(var(--text))]">
              {currency ? formatCurrency(entry.value) : percent ? `${entry.value}%` : formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyChartState({ label }) {
  return (
    <div className="grid h-full min-h-[180px] place-items-center rounded-2xl border border-dashed border-[rgb(var(--line)/0.16)] bg-white/55 text-sm text-slate-500">
      {label}
    </div>
  );
}

function prettyLabel(value = '') {
  const source = String(value).replace(/[_-]+/g, ' ').trim();
  if (!source) return 'Unknown';
  return source
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function prettyMonth(month = '') {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return month || 'Unknown';
  const [year, monthValue] = month.split('-');
  const parsed = new Date(Number(year), Number(monthValue) - 1, 1);
  return parsed.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

function formatValue(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return String(value ?? '-');
  return number.toLocaleString('en-IN', { maximumFractionDigits: 1 });
}

function formatCompactCurrency(value) {
  const number = Number(value || 0);
  return `Rs. ${number >= 100000 ? `${(number / 100000).toFixed(1)}L` : number.toLocaleString('en-IN')}`;
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return `Rs. ${number.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function blendColor(percent) {
  const clamped = Math.max(0, Math.min(100, Number(percent || 0)));
  if (clamped >= 80) return '#10b981';
  if (clamped >= 50) return '#3b82f6';
  if (clamped >= 25) return '#f59e0b';
  return '#ef4444';
}
