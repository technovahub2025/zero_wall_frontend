import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCcw } from 'lucide-react';
import { KPISection } from '../components/reports/KPISection';
import { StatusDonutChart as ProjectStatusChart } from '../components/reports/StatusDonutChart';
import { TaskStatusChart as TaskProgressChart } from '../components/reports/TaskStatusChart';
import { RevenueTrendChart } from '../components/reports/RevenueTrendChart';
import { EngineerUtilizationChart as EmployeeUtilizationChart } from '../components/reports/EngineerUtilizationChart';
import { ClientContributionChart } from '../components/reports/ClientContributionChart';
import { TimesheetAnalyticsChart } from '../components/reports/TimesheetAnalyticsChart';
import { ReportFilters } from '../components/reports/ReportFilters';
import { ExportDropdown } from '../components/reports/ExportDropdown';
import { ReportTable } from '../components/reports/ReportTable';
import { Card, CardBody } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useReportsBundle } from '../hooks/useReports';
import { useProjects } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import { useTeams } from '../hooks/useTeams';
import { pageVariants, staggerContainer, staggerItem } from '../utils/motionVariants';
import { exportRowsToCsv, exportRowsToPdf, exportRowsToExcel, exportWorkbookToCsv, exportWorkbookToExcel, exportWorkbookToPdf } from '../utils/exportUtils';
import { formatCompactCurrency, formatHours } from '../components/reports/chartUtils';

const DEFAULT_FILTERS = {
  period: 'all',
  from: '',
  to: '',
  project: '',
  client: '',
  team: '',
  projectStatuses: [],
  priorities: [],
  taskStatuses: [],
};

const KPI_ORDER = [
  { key: 'totalProjects', title: 'Total Projects' },
  { key: 'activeTasks', title: 'Active Tasks' },
  { key: 'totalEmployees', title: 'Total Employees' },
  { key: 'revenue', title: 'Revenue' },
  { key: 'billableHours', title: 'Billable Hours' },
  { key: 'pendingInvoices', title: 'Pending Invoices' },
];

function toInputDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function resolveRange(filters) {
  const period = String(filters.period || 'all').toLowerCase();
  const now = new Date();

  if (period === 'custom') {
    const from = parseDate(filters.from);
    const to = parseDate(filters.to);
    if (!from || !to) return null;
    return {
      from: startOfDay(from),
      to: endOfDay(to),
    };
  }

  switch (period) {
    case 'last-12-months': {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 12);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case 'this-year':
      return { from: startOfDay(new Date(now.getFullYear(), 0, 1)), to: endOfDay(now) };
    case 'last-30-days': {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    default:
      return null;
  }
}

function buildQueryParams(filters) {
  const params = {};
  const range = resolveRange(filters);

  if (filters.period && filters.period !== 'all' && filters.period !== 'custom') {
    params.period = filters.period;
  }

  if (range && filters.period === 'custom') {
    params.from = toInputDate(range.from);
    params.to = toInputDate(range.to);
  }

  if (filters.project) params.project = filters.project;
  if (filters.project) params.projectId = filters.project;
  if (filters.client) params.client = filters.client;
  if (filters.client) params.clientId = filters.client;
  if (filters.team) params.team = filters.team;
  if (filters.team) params.teamId = filters.team;
  if (filters.projectStatuses?.length) params.status = filters.projectStatuses.join(',');
  if (filters.priorities?.length) params.priority = filters.priorities.join(',');
  if (filters.taskStatuses?.length) params.taskStatus = filters.taskStatuses.join(',');

  return params;
}

function buildPreviousQueryParams(filters) {
  const range = resolveRange(filters);
  if (!range) return null;

  const duration = range.to.getTime() - range.from.getTime();
  if (duration <= 0) return null;

  const previousTo = new Date(range.from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - duration);

  const params = {
    from: toInputDate(previousFrom),
    to: toInputDate(previousTo),
  };

  if (filters.project) params.project = filters.project;
  if (filters.project) params.projectId = filters.project;
  if (filters.client) params.client = filters.client;
  if (filters.client) params.clientId = filters.client;
  if (filters.team) params.team = filters.team;
  if (filters.team) params.teamId = filters.team;
  if (filters.projectStatuses?.length) params.status = filters.projectStatuses.join(',');
  if (filters.priorities?.length) params.priority = filters.priorities.join(',');
  if (filters.taskStatuses?.length) params.taskStatus = filters.taskStatuses.join(',');

  return params;
}

function formatDateTime(value) {
  if (!value) return '__';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getPercentChange(current, previous) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function normalizeProjectStatusBucket(label = '') {
  const text = String(label || '').toLowerCase();
  if (/(complete|done|closed|resolved)/.test(text)) return 'Completed';
  if (/(hold|paused|pause|waiting)/.test(text)) return 'On Hold';
  if (/(delay|delayed|late|overdue|risk|blocked|cancel)/.test(text)) return 'Delayed';
  return 'Active';
}

function buildProjectStatusRows(statusMap = {}) {
  const buckets = {
    Active: 0,
    Completed: 0,
    Delayed: 0,
    'On Hold': 0,
  };

  Object.entries(statusMap || {}).forEach(([label, value]) => {
    const bucket = normalizeProjectStatusBucket(label);
    buckets[bucket] += Number(value || 0);
  });

  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

function buildTaskProgressRows(taskProgress = {}) {
  return [
    { name: 'completed', value: Number(taskProgress.completed || 0) },
    { name: 'inProgress', value: Number(taskProgress.inProgress || 0) },
    { name: 'pending', value: Number(taskProgress.pending || 0) },
    { name: 'overdue', value: Number(taskProgress.overdue || 0) },
  ];
}

function buildExportWorkbook({
  kpis,
  projectStatusRows,
  taskProgressRows,
  revenueRows,
  utilizationRows,
  clientContributionRows,
  timesheetRows,
  summaryRows,
  metadataRows,
  filterRows,
  rawData,
}) {
  const rawProjects = Array.isArray(rawData?.projects) ? rawData.projects : [];
  const rawTasks = Array.isArray(rawData?.tasks) ? rawData.tasks : [];
  const rawInvoices = Array.isArray(rawData?.invoices) ? rawData.invoices : [];
  const rawTimerLogs = Array.isArray(rawData?.timerLogs) ? rawData.timerLogs : [];
  const rawEmployees = Array.isArray(rawData?.employees) ? rawData.employees : [];
  const rawClients = Array.isArray(rawData?.clients) ? rawData.clients : [];
  const rawTeams = Array.isArray(rawData?.teams) ? rawData.teams : [];

  return [
    {
      name: 'Report Metadata',
      rows: metadataRows,
      columns: [
        { label: 'Field', value: 'field' },
        { label: 'Value', value: 'value' },
      ],
    },
    {
      name: 'Filters',
      rows: filterRows,
      columns: [
        { label: 'Filter', value: 'filter' },
        { label: 'Value', value: 'value' },
      ],
    },
    {
      name: 'KPIs',
      rows: kpis,
      columns: [
        { label: 'Metric', value: 'title' },
        { label: 'Value', value: 'value' },
        { label: 'Previous', value: 'previousValue' },
        { label: 'Trend %', value: (row) => `${row.trend > 0 ? '+' : ''}${Number(row.trend || 0).toFixed(1)}%` },
      ],
    },
    {
      name: 'Project Status',
      rows: projectStatusRows,
      columns: [
        { label: 'Status', value: 'name' },
        { label: 'Projects', value: 'value' },
      ],
    },
    {
      name: 'Task Progress',
      rows: taskProgressRows,
      columns: [
        { label: 'Status', value: (row) => row.name },
        { label: 'Tasks', value: 'value' },
      ],
    },
    {
      name: 'Revenue Trend',
      rows: revenueRows,
      columns: [
        { label: 'Month', value: 'month' },
        { label: 'Revenue', value: 'revenue' },
        { label: 'Collections', value: 'collections' },
        { label: 'Balance', value: 'balance' },
      ],
    },
    {
      name: 'Employee Utilization',
      rows: utilizationRows,
      columns: [
        { label: 'Employee', value: 'name' },
        { label: 'Utilization %', value: 'utilization' },
        { label: 'Projects', value: 'projects' },
        { label: 'Hours', value: 'hours' },
      ],
    },
    {
      name: 'Client Contribution',
      rows: clientContributionRows,
      columns: [
        { label: 'Client', value: 'clientName' },
        { label: 'Revenue', value: 'revenue' },
        { label: 'Billed', value: 'billed' },
        { label: 'Outstanding', value: 'outstanding' },
        { label: 'Projects', value: 'projectCount' },
      ],
    },
    {
      name: 'Timesheet Analytics',
      rows: timesheetRows,
      columns: [
        { label: 'Month', value: 'month' },
        { label: 'Logged Hours', value: 'loggedHours' },
        { label: 'Billable Hours', value: 'billableHours' },
      ],
    },
    {
      name: 'Summary',
      rows: summaryRows,
      columns: [
        { label: 'Report Name', value: 'name' },
        { label: 'Last Updated', value: 'updatedAt' },
        { label: 'Status', value: 'status' },
      ],
    },
    {
      name: 'Raw Projects',
      rows: rawProjects,
      columns: [
        { label: 'ID', value: 'id' },
        { label: 'S.No', value: 'sNo' },
        { label: 'Project Name', value: 'projectName' },
        { label: 'Client Name', value: 'clientName' },
        { label: 'Segment', value: 'companySegment' },
        { label: 'Project Type', value: 'projectType' },
        { label: 'Location', value: 'location' },
        { label: 'Start Date', value: 'startDate' },
        { label: 'Target Date', value: 'targetDate' },
        { label: 'Actual End', value: 'actualEnd' },
        { label: 'Project Value', value: 'projectValue' },
        { label: 'Status', value: 'overallStatus' },
        { label: 'Current Stage', value: 'currentStage' },
        { label: 'Stage Completion', value: 'stageCompletion' },
        { label: 'Client Approval', value: 'clientApprovalStatus' },
        { label: 'Approval Date', value: 'clientApprovalDate' },
        { label: 'Next Action', value: 'nextActionRequired' },
        { label: 'Responsible Engineer', value: 'responsibleEngineer' },
        { label: 'Assigned Team', value: 'assignedTeam' },
        { label: 'Remarks', value: 'remarks' },
        { label: 'Blockers', value: 'blockers' },
        { label: 'Remarks Or Blockers', value: 'remarksOrBlockers' },
        { label: 'CEO/MD Review', value: 'ceoMdReview' },
        { label: 'Priority', value: 'priority' },
        { label: 'Invoice Status', value: 'invoiceStatus' },
        { label: 'Estimated Completion', value: 'estimatedCompletion' },
        { label: 'Received', value: 'recv' },
        { label: 'Balance', value: 'balance' },
        { label: 'Archived', value: 'isArchived' },
        { label: 'Created By', value: 'createdBy' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Updated At', value: 'updatedAt' },
      ],
    },
    {
      name: 'Raw Tasks',
      rows: rawTasks,
      columns: [
        { label: 'ID', value: 'id' },
        { label: 'Title', value: 'title' },
        { label: 'Description', value: 'description' },
        { label: 'Start Date', value: 'startDate' },
        { label: 'Project', value: 'project' },
        { label: 'Stage', value: 'stage' },
        { label: 'Assignee', value: 'assignee' },
        { label: 'Team', value: 'team' },
        { label: 'Assigned Team', value: 'assignedTeam' },
        { label: 'Backup Reviewer', value: 'backupReviewer' },
        { label: 'Priority', value: 'priority' },
        { label: 'Status', value: 'status' },
        { label: 'Due Date', value: 'dueDate' },
        { label: 'Completed At', value: 'completedAt' },
        { label: 'Estimated Duration (Min)', value: 'estimatedDurationMinutes' },
        { label: 'Timer Started At', value: 'timerStartedAt' },
        { label: 'Timer Expires At', value: 'timerExpiresAt' },
        { label: 'Timer Status', value: 'timerStatus' },
        { label: 'Extra Time Granted (Min)', value: 'extraTimeMinutesGranted' },
        { label: 'Active Timer Log', value: 'activeTimerLog' },
        { label: 'Next Action', value: 'nextAction' },
        { label: 'Tags', value: 'tags' },
        { label: 'Attachments', value: 'attachments' },
        { label: 'Comments', value: 'comments' },
        { label: 'Order', value: 'order' },
        { label: 'Total Time Logged', value: 'totalTimeLogged' },
        { label: 'Created By', value: 'createdBy' },
        { label: 'Reporter', value: 'reporter' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Updated At', value: 'updatedAt' },
      ],
    },
    {
      name: 'Raw Invoices',
      rows: rawInvoices,
      columns: [
        { label: 'ID', value: 'id' },
        { label: 'Project', value: 'project' },
        { label: 'Invoice No', value: 'invoiceNo' },
        { label: 'Billing Status', value: 'billingStatus' },
        { label: 'Amount Total', value: 'amountTotal' },
        { label: 'Amount Received', value: 'amountReceived' },
        { label: 'Balance', value: 'balance' },
        { label: 'Due Date', value: 'dueDate' },
        { label: 'Paid Date', value: 'paidDate' },
        { label: 'Remarks', value: 'remarks' },
        { label: 'Payment History', value: 'paymentHistory' },
        { label: 'Created By', value: 'createdBy' },
        { label: 'Updated By', value: 'updatedBy' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Updated At', value: 'updatedAt' },
      ],
    },
    {
      name: 'Raw Timer Logs',
      rows: rawTimerLogs,
      columns: [
        { label: 'ID', value: 'id' },
        { label: 'User', value: 'user' },
        { label: 'Task', value: 'task' },
        { label: 'Project', value: 'project' },
        { label: 'Stage', value: 'stage' },
        { label: 'Start Time', value: 'startTime' },
        { label: 'End Time', value: 'endTime' },
        { label: 'Paused At', value: 'pausedAt' },
        { label: 'Duration (Seconds)', value: 'durationSeconds' },
        { label: 'Action', value: 'actionLabel' },
        { label: 'Reason / Comment', value: 'reason' },
        { label: 'Note', value: 'note' },
        { label: 'Switch Reason', value: 'switchReason' },
        { label: 'Date', value: 'date' },
        { label: 'Manual', value: 'isManual' },
        { label: 'Active', value: 'isActive' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Updated At', value: 'updatedAt' },
      ],
    },
    {
      name: 'Raw Employees',
      rows: rawEmployees,
      columns: [
        { label: 'ID', value: 'id' },
        { label: 'Employee ID', value: 'employeeId' },
        { label: 'Name', value: 'name' },
        { label: 'Email', value: 'email' },
        { label: 'Role', value: 'role' },
        { label: 'Avatar', value: 'avatar' },
        { label: 'Phone', value: 'phone' },
        { label: 'Emergency Phone', value: 'emergencyPhone' },
        { label: 'Designation', value: 'designation' },
        { label: 'Department', value: 'department' },
        { label: 'Joining Date', value: 'joiningDate' },
        { label: 'Active', value: 'isActive' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Updated At', value: 'updatedAt' },
      ],
    },
    {
      name: 'Raw Clients',
      rows: rawClients,
      columns: [
        { label: 'ID', value: 'id' },
        { label: 'Client Name', value: 'clientName' },
        { label: 'Contact Person', value: 'contactPerson' },
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Company Name', value: 'companyName' },
        { label: 'Segment', value: 'segment' },
        { label: 'Address', value: 'address' },
        { label: 'City', value: 'city' },
        { label: 'Status', value: 'status' },
        { label: 'Notes', value: 'notes' },
        { label: 'Project IDs', value: 'projectIds' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Updated At', value: 'updatedAt' },
      ],
    },
    {
      name: 'Raw Teams',
      rows: rawTeams,
      columns: [
        { label: 'ID', value: 'id' },
        { label: 'Name', value: 'name' },
        { label: 'Description', value: 'description' },
        { label: 'Color', value: 'color' },
        { label: 'Members', value: 'members' },
        { label: 'Project IDs', value: 'projectIds' },
        { label: 'Created By', value: 'createdBy' },
        { label: 'Active', value: 'isActive' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Updated At', value: 'updatedAt' },
      ],
    },
  ];
}

function ChartSkeleton() {
  return (
    <Card className="h-full border border-[rgb(var(--line)/0.12)]">
      <CardBody className="animate-pulse p-5">
        <div className="h-4 w-40 rounded bg-[rgb(var(--line)/0.18)]" />
        <div className="mt-2 h-3 w-64 rounded bg-[rgb(var(--line)/0.12)]" />
        <div className="mt-6 h-[280px] rounded-2xl bg-[rgb(var(--panel-2)/0.6)]" />
      </CardBody>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card className="h-full border border-[rgb(var(--line)/0.12)]">
      <CardBody className="animate-pulse p-5">
        <div className="flex items-start justify-between">
          <div className="h-3 w-24 rounded bg-[rgb(var(--line)/0.18)]" />
          <div className="h-11 w-11 rounded-2xl bg-[rgb(var(--line)/0.12)]" />
        </div>
        <div className="mt-5 h-8 w-32 rounded bg-[rgb(var(--line)/0.12)]" />
        <div className="mt-6 h-3 w-28 rounded bg-[rgb(var(--line)/0.12)]" />
        <div className="mt-2 h-3 w-20 rounded bg-[rgb(var(--line)/0.12)]" />
      </CardBody>
    </Card>
  );
}

export default function ReportsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const queryParams = useMemo(() => buildQueryParams(filters), [filters]);
  const projectsQuery = useProjects({}, { staleTime: 300_000, refetchOnWindowFocus: false });
  const clientsQuery = useClients({}, { staleTime: 300_000, refetchOnWindowFocus: false });
  const teamsQuery = useTeams({}, { staleTime: 300_000, refetchOnWindowFocus: false });

  const bundleQuery = useReportsBundle(queryParams, { refetchOnWindowFocus: false });
  const reportBundle = bundleQuery.data || {};
  const rawData = reportBundle.rawData || {};

  const overview = reportBundle.overview || {};
  const previousOverview = reportBundle.previousOverview || null;

  const projectStatusRows = useMemo(() => {
    const rows = Array.isArray(reportBundle.projectStatus) ? reportBundle.projectStatus : [];
    return rows.length ? rows : buildProjectStatusRows(overview.byStatus || {});
  }, [overview.byStatus, reportBundle.projectStatus]);
  const taskProgressRows = useMemo(() => {
    const rows = Array.isArray(reportBundle.taskProgress) ? reportBundle.taskProgress : [];
    return rows.length ? rows : buildTaskProgressRows(overview.taskProgress || {});
  }, [overview.taskProgress, reportBundle.taskProgress]);
  const revenueRows = useMemo(() => {
    const rows = Array.isArray(reportBundle.revenueTrend) ? reportBundle.revenueTrend : [];
    return rows.map((row) => ({
      month: row.month,
      revenue: Number(row.revenue || row.total || 0),
      collections: Number(row.collections || row.received || 0),
      balance: Number(row.balance || 0),
    }));
  }, [reportBundle.revenueTrend]);
  const utilizationRows = useMemo(() => {
    const rows = Array.isArray(reportBundle.engineerUtilization) ? reportBundle.engineerUtilization : [];
    return rows
      .slice()
      .sort((a, b) => Number(b.utilization || 0) - Number(a.utilization || 0))
      .map((row) => ({
        id: row.id,
        name: row.name,
        utilization: Number(row.utilization || 0),
        projects: Number(row.projects || 0),
        hours: Number(row.hours || 0),
      }));
  }, [reportBundle.engineerUtilization]);
  const clientContributionRows = useMemo(() => {
    const rows = Array.isArray(reportBundle.clientContribution) ? reportBundle.clientContribution : [];
    return rows
      .slice()
      .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
      .map((row) => ({
        clientName: row.clientName,
        revenue: Number(row.revenue || 0),
        billed: Number(row.billed || 0),
        outstanding: Number(row.outstanding || 0),
        projectCount: Number(row.projectCount || 0),
      }));
  }, [reportBundle.clientContribution]);
  const timesheetRows = useMemo(() => {
    const rows = Array.isArray(reportBundle.timesheetAnalytics) ? reportBundle.timesheetAnalytics : [];
    return rows.map((row) => ({
      month: row.month,
      loggedHours: Number(row.loggedHours || 0),
      billableHours: Number(row.billableHours || 0),
    }));
  }, [reportBundle.timesheetAnalytics]);

  const projectOptions = useMemo(
    () =>
      (projectsQuery.data || [])
        .map((project) => ({
          value: project._id || project.dbId || project.id,
          label: `${project.projectName || project.name || 'Untitled Project'}${project.clientName ? ` • ${project.clientName}` : ''}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [projectsQuery.data],
  );
  const clientOptions = useMemo(
    () =>
      (clientsQuery.data || [])
        .map((client) => ({
          value: client._id || client.dbId || client.id,
          label: `${client.clientName || 'Untitled Client'}${client.companyName ? ` • ${client.companyName}` : ''}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [clientsQuery.data],
  );
  const teamOptions = useMemo(
    () =>
      (teamsQuery.data || [])
        .map((team) => ({
          value: team._id || team.dbId || team.id,
          label: `${team.name || 'Untitled Team'}${team.memberCount ? ` • ${team.memberCount} members` : ''}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [teamsQuery.data],
  );

  const currentKpis = useMemo(() => {
    const hasComparison = Boolean(previousOverview);
    const comparison = previousOverview || {};
    const current = {
      totalProjects: Number(overview.totalProjects || 0),
      activeTasks: Number(overview.activeTasks || 0),
      totalEmployees: Number(overview.totalEmployees || 0),
      revenue: Number(overview.revenue || 0),
      billableHours: Number(overview.billableHours || 0),
      pendingInvoices: Number(overview.pendingInvoices || 0),
    };

    const previous = {
      totalProjects: Number(comparison.totalProjects || 0),
      activeTasks: Number(comparison.activeTasks || 0),
      totalEmployees: Number(comparison.totalEmployees || 0),
      revenue: Number(comparison.revenue || 0),
      billableHours: Number(comparison.billableHours || 0),
      pendingInvoices: Number(comparison.pendingInvoices || 0),
    };

    return KPI_ORDER.map((item) => {
      const currentValue = current[item.key];
      const previousValue = previous[item.key];
      const trend = getPercentChange(currentValue, previousValue);

      let value = formatCount(currentValue);
      let previousLabel = formatCount(previousValue);

      if (item.key === 'revenue') {
        value = formatCompactCurrency(currentValue);
        previousLabel = formatCompactCurrency(previousValue);
      } else if (item.key === 'billableHours') {
        value = formatHours(currentValue);
        previousLabel = formatHours(previousValue);
      }

      return {
        ...item,
        value,
        previousValue: hasComparison ? previousLabel : '__',
        trend: hasComparison ? trend : 0,
        trendLabel: hasComparison ? 'vs previous period' : 'No comparison period',
      };
    });
  }, [overview, previousOverview]);

  const lastSyncAt = useMemo(() => {
    if (reportBundle.meta?.generatedAt) return reportBundle.meta.generatedAt;
    return bundleQuery.dataUpdatedAt || null;
  }, [bundleQuery.dataUpdatedAt, reportBundle.meta?.generatedAt]);

  const metadataRows = useMemo(
    () => [
      { field: 'Generated At', value: formatDateTime(lastSyncAt) },
      { field: 'Mode', value: filters.period === 'custom' ? 'Custom range' : filters.period === 'all' ? 'All time' : filters.period.replace(/-/g, ' ') },
      { field: 'Projects In Scope', value: formatCount(reportBundle.meta?.counts?.projects ?? projectOptions.length) },
      { field: 'Tasks In Scope', value: formatCount(reportBundle.meta?.counts?.tasks ?? 0) },
      { field: 'Invoices', value: formatCount(reportBundle.meta?.counts?.invoices ?? 0) },
      { field: 'Timer Logs', value: formatCount(reportBundle.meta?.counts?.timerLogs ?? 0) },
      { field: 'Employees', value: formatCount(reportBundle.meta?.counts?.employees ?? 0) },
      { field: 'Clients', value: formatCount(clientOptions.length) },
      { field: 'Teams', value: formatCount(teamOptions.length) },
    ],
    [clientOptions.length, filters.period, lastSyncAt, projectOptions.length, reportBundle.meta?.counts?.employees, reportBundle.meta?.counts?.invoices, reportBundle.meta?.counts?.projects, reportBundle.meta?.counts?.tasks, reportBundle.meta?.counts?.timerLogs, teamOptions.length],
  );

  const filterRows = useMemo(
    () => [
      { filter: 'Period', value: filters.period },
      { filter: 'From', value: filters.from || '-' },
      { filter: 'To', value: filters.to || '-' },
      { filter: 'Project', value: filters.project || 'All' },
      { filter: 'Client', value: filters.client || 'All' },
      { filter: 'Team', value: filters.team || 'All' },
      { filter: 'Project Statuses', value: filters.projectStatuses?.length ? filters.projectStatuses.join(', ') : 'All' },
      { filter: 'Priorities', value: filters.priorities?.length ? filters.priorities.join(', ') : 'All' },
      { filter: 'Task Statuses', value: filters.taskStatuses?.length ? filters.taskStatuses.join(', ') : 'All' },
    ],
    [filters],
  );

  const liveState = {
    isLoading: bundleQuery.isLoading,
    isFetching: bundleQuery.isFetching,
    hasError: bundleQuery.isError,
    errorMessage: bundleQuery.error?.message || 'Failed to load reports',
  };

  function getSectionStatus(rows) {
    if (liveState.hasError) return { status: 'Error', statusTone: 'rose' };
    if (liveState.isFetching) return { status: 'Refreshing', statusTone: 'amber' };
    const hasData = Array.isArray(rows) ? rows.some((row) => Object.values(row).some((value) => Number(value) > 0)) : Boolean(rows);
    return hasData ? { status: 'Live', statusTone: 'green' } : { status: 'Empty', statusTone: 'slate' };
  }

  const summaryRows = useMemo(
    () =>
      [
        {
          key: 'project-status',
          name: 'Project status overview',
          description: 'Active, completed, delayed, and on hold projects from the live portfolio.',
          rows: projectStatusRows,
        },
        {
          key: 'task-progress',
          name: 'Task progress',
          description: 'Task completion mix including pending and overdue work.',
          rows: taskProgressRows,
        },
        {
          key: 'revenue-trend',
          name: 'Revenue trend',
          description: 'Monthly revenue and collections over the selected reporting window.',
          rows: revenueRows,
        },
        {
          key: 'employee-utilization',
          name: 'Employee utilization',
          description: 'Utilization ranking by team member hours and assigned projects.',
          rows: utilizationRows,
        },
        {
          key: 'client-contribution',
          name: 'Client contribution',
          description: 'Revenue concentration by client and outstanding billing exposure.',
          rows: clientContributionRows,
        },
        {
          key: 'timesheet-analytics',
          name: 'Timesheet analytics',
          description: 'Logged vs billable hours from the timer log stream.',
          rows: timesheetRows,
        },
      ].map((row) => ({
        ...row,
        ...getSectionStatus(row.rows),
        updatedAt: formatDateTime(lastSyncAt),
      })),
    [clientContributionRows, lastSyncAt, liveState.hasError, liveState.isFetching, projectStatusRows, revenueRows, taskProgressRows, timesheetRows, utilizationRows],
  );

  const exportBundle = useMemo(
    () =>
      buildExportWorkbook({
        kpis: currentKpis,
        projectStatusRows,
        taskProgressRows,
        revenueRows,
        utilizationRows,
        clientContributionRows,
        timesheetRows,
        summaryRows,
        metadataRows,
        filterRows,
        rawData,
      }),
    [
      clientContributionRows,
      currentKpis,
      filterRows,
      metadataRows,
      projectStatusRows,
      rawData,
      revenueRows,
      summaryRows,
      taskProgressRows,
      timesheetRows,
      utilizationRows,
    ],
  );

  function handleHeaderExport(type) {
    const suffix = new Date().toISOString().slice(0, 10);
    const baseName = `reports-${suffix}`;

    if (type === 'excel') {
      exportWorkbookToExcel(exportBundle, `${baseName}.xlsx`);
      return;
    }

    if (type === 'csv') {
      exportWorkbookToCsv(exportBundle, `${baseName}.csv`);
      return;
    }

    exportWorkbookToPdf({
      title: 'Reports',
      subtitle: 'Business performance overview and analytics',
      sheets: exportBundle,
      filename: `${baseName}.pdf`,
    });
  }

  function handleRowExport(sectionKey) {
    const suffix = new Date().toISOString().slice(0, 10);

    const sectionExporters = {
      'project-status': () =>
        exportRowsToExcel(
          projectStatusRows,
          [
            { label: 'Status', value: 'name' },
            { label: 'Projects', value: 'value' },
          ],
          `project-status-${suffix}.xlsx`,
          'Project Status',
        ),
      'task-progress': () =>
        exportRowsToExcel(
          taskProgressRows,
          [
            { label: 'Task Status', value: (row) => row.name },
            { label: 'Tasks', value: 'value' },
          ],
          `task-progress-${suffix}.xlsx`,
          'Task Progress',
        ),
      'revenue-trend': () =>
        exportRowsToExcel(
          revenueRows,
          [
            { label: 'Month', value: 'month' },
            { label: 'Revenue', value: 'revenue' },
            { label: 'Collections', value: 'collections' },
            { label: 'Balance', value: 'balance' },
          ],
          `revenue-trend-${suffix}.xlsx`,
          'Revenue Trend',
        ),
      'employee-utilization': () =>
        exportRowsToExcel(
          utilizationRows,
          [
            { label: 'Employee', value: 'name' },
            { label: 'Utilization %', value: 'utilization' },
            { label: 'Projects', value: 'projects' },
            { label: 'Hours', value: 'hours' },
          ],
          `employee-utilization-${suffix}.xlsx`,
          'Employee Utilization',
        ),
      'client-contribution': () =>
        exportRowsToExcel(
          clientContributionRows,
          [
            { label: 'Client', value: 'clientName' },
            { label: 'Revenue', value: 'revenue' },
            { label: 'Billed', value: 'billed' },
            { label: 'Outstanding', value: 'outstanding' },
            { label: 'Projects', value: 'projectCount' },
          ],
          `client-contribution-${suffix}.xlsx`,
          'Client Contribution',
        ),
      'timesheet-analytics': () =>
        exportRowsToExcel(
          timesheetRows,
          [
            { label: 'Month', value: 'month' },
            { label: 'Logged Hours', value: 'loggedHours' },
            { label: 'Billable Hours', value: 'billableHours' },
          ],
          `timesheet-analytics-${suffix}.xlsx`,
          'Timesheet Analytics',
        ),
    };

    sectionExporters[sectionKey]?.();
  }

  const scopedCounts = reportBundle.meta?.counts || {};

  if (liveState.hasError && !bundleQuery.data) {
    return (
      <div className="grid min-h-[40vh] place-items-center rounded-[28px] border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.96)] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
          <RefreshCcw className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[rgb(var(--text))]">Reports are unavailable</h2>
        <p className="mt-2 max-w-lg text-sm text-slate-500">{liveState.errorMessage}</p>
      </div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="min-w-0 space-y-6">
      <Card className="overflow-hidden border border-[rgb(var(--line)/0.12)] shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
        <CardBody className="space-y-6 p-5 sm:p-6 xl:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-500">Reports</div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-[rgb(var(--text))] sm:text-4xl">Reports</h1>
                <Badge tone={liveState.isFetching ? 'amber' : 'green'}>{liveState.isFetching ? 'Refreshing live data' : 'Live data'}</Badge>
                <Badge tone="blue">{filters.period === 'custom' ? 'Custom range' : filters.period === 'all' ? 'All time' : filters.period.replace(/-/g, ' ')}</Badge>
              </div>
              <p className="mt-3 max-w-3xl text-sm text-slate-500 sm:text-base">
                Business performance overview and analytics for projects, tasks, revenue, utilization, clients, and timesheets.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{formatDateTime(lastSyncAt)}</span>
                <span>|</span>
                <span>{formatCount(scopedCounts.projects ?? projectOptions.length)} projects in scope</span>
                <span>|</span>
                <span>{formatCount(clientOptions.length)} clients</span>
                <span>|</span>
                <span>{formatCount(teamOptions.length)} teams</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <ReportFilters
                value={filters}
                onChange={setFilters}
                projectOptions={projectOptions}
                clientOptions={clientOptions}
                teamOptions={teamOptions}
              />
              <ExportDropdown onExport={handleHeaderExport} />
            </div>
          </div>

          {liveState.isFetching ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
              Syncing reports with live backend data...
            </div>
          ) : null}
        </CardBody>
      </Card>

      {liveState.isLoading ? <KpiSkeletonGrid /> : <KPISection items={currentKpis} />}

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 xl:grid-cols-2">
        <motion.div variants={staggerItem}>
          {liveState.isLoading ? <ChartSkeleton /> : <ProjectStatusChart data={projectStatusRows} />}
        </motion.div>
        <motion.div variants={staggerItem}>
          {liveState.isLoading ? <ChartSkeleton /> : <TaskProgressChart data={taskProgressRows} />}
        </motion.div>
        <motion.div variants={staggerItem}>
          {liveState.isLoading ? <ChartSkeleton /> : <RevenueTrendChart data={revenueRows} />}
        </motion.div>
        <motion.div variants={staggerItem}>
          {liveState.isLoading ? <ChartSkeleton /> : <EmployeeUtilizationChart data={utilizationRows} />}
        </motion.div>
        <motion.div variants={staggerItem}>
          {liveState.isLoading ? <ChartSkeleton /> : <ClientContributionChart data={clientContributionRows} />}
        </motion.div>
        <motion.div variants={staggerItem}>
          {liveState.isLoading ? <ChartSkeleton /> : <TimesheetAnalyticsChart data={timesheetRows} />}
        </motion.div>
      </motion.div>

      <ReportTable rows={summaryRows} onExportRow={handleRowExport} bodyClassName="max-h-[420px] overflow-y-auto overscroll-contain" />
    </motion.div>
  );
}

function KpiSkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <KpiSkeleton key={index} />
      ))}
    </div>
  );
}
