import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Mail,
  Phone,
  Radar,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { pageVariants, staggerItem } from '../utils/motionVariants';
import { useMonitor } from '../hooks/useMonitor';
import { SearchInput } from '../components/shared/SearchInput';
import { FilterChips } from '../components/shared/FilterChips';
import { SkeletonTable } from '../components/shared/SkeletonTable';
import { EmptyState } from '../components/shared/EmptyState';
import { DataTable } from '../components/shared/DataTable';
import { VirtualList } from '../components/shared/VirtualList';
import { DropdownField } from '../components/shared/DropdownField';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { buildAvatarUrl } from '../utils/avatarUrl';
import { useDebouncedValue } from '../utils/performance';
import { formatIndiaDateTime } from '../utils/formatters';

const roleOptions = [
  { label: 'All roles', value: 'all' },
  { label: 'Superadmin', value: 'superadmin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Project Manager', value: 'project_manager' },
  { label: 'Employee', value: 'employee' },
];

const presenceOptions = [
  { label: 'All', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
];

const sortOptions = [
  { label: 'Live first', value: 'default' },
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Department A-Z', value: 'department_asc' },
  { label: 'Department Z-A', value: 'department_desc' },
  { label: 'Projects high to low', value: 'projects_desc' },
  { label: 'Last login recent', value: 'last_login_desc' },
];

const VIRTUALIZE_THRESHOLD = 18;
const INLINE_PAGE_SIZE = 100;
const GRID_TEMPLATE =
  'minmax(220px, 1.45fr) minmax(120px, 0.82fr) minmax(130px, 0.82fr) minmax(280px, 1.35fr) minmax(220px, 1.06fr) minmax(145px, 0.84fr) minmax(170px, 0.9fr) minmax(150px, 0.9fr) 112px';

function formatDateTime(value) {
  return formatIndiaDateTime(value);
}

function formatRelative(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function roleTone(role) {
  if (role === 'superadmin') return 'rose';
  if (role === 'admin') return 'amber';
  if (role === 'project_manager') return 'blue';
  return 'slate';
}

function presenceTone(online) {
  return online ? 'green' : 'rose';
}

function summarizeTaskCounts(summary = {}) {
  return [
    { label: 'Open', value: Number(summary.active || 0), tone: 'blue' },
    { label: 'Due soon', value: Number(summary.dueSoon || 0), tone: 'amber' },
    { label: 'Overdue', value: Number(summary.overdue || 0), tone: 'rose' },
  ];
}

function MonitorDesktopGrid({ columns, rows, navigate, virtualize }) {
  if (!rows.length) return null;

  if (virtualize) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.62)]">
        <div
          className="grid border-b border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.96)] px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-slate-500 backdrop-blur"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          {columns.map((column) => (
            <span key={column.key} className={column.headerClassName || ''}>
              {column.label}
            </span>
          ))}
        </div>

        <VirtualList
          items={rows}
          estimateSize={124}
          className="scrollbar-none h-[calc(100dvh-31rem)] max-h-[72vh] overscroll-contain"
          renderItem={(row) => (
            <div className="px-2 py-2">
              <motion.div
                layout
                className="grid items-start gap-3 rounded-3xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel-2)/0.76)] px-4 py-4 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-0.5 hover:bg-[rgb(var(--panel-2)/0.92)] hover:shadow-[0_22px_56px_-36px_rgba(15,23,42,0.46)]"
                style={{ gridTemplateColumns: GRID_TEMPLATE }}
              >
                {columns.map((column) => (
                  <div key={column.key} className={`min-w-0 ${column.className || ''}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </div>
                ))}
              </motion.div>
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.62)]">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyMessage="No employees found."
        scrollAxis="both"
        stickyHeader
        scrollClassName="max-h-[calc(100dvh-31rem)]"
        tableClassName="min-w-[1520px]"
        rowClassName={(row) => (row.online ? 'bg-emerald-500/[0.02] transition duration-200 hover:bg-[rgb(var(--panel-2)/0.7)]' : 'transition duration-200 hover:bg-[rgb(var(--panel-2)/0.7)]')}
      />
    </div>
  );
}

function MonitorMobileCards({ rows, navigate }) {
  return (
    <div className="grid gap-3 md:hidden">
      {rows.map((row, index) => (
        <motion.article
          key={row.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: Math.min(index * 0.02, 0.18) }}
          whileHover={{ y: -2 }}
          className="rounded-[22px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel-2)/0.84)] p-4 shadow-[0_16px_40px_-38px_rgba(15,23,42,0.38)]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-amber-500 text-base font-semibold text-white shadow-sm ring-1 ring-white/20">
              {buildAvatarUrl(row.avatar, row.updatedAt) ? (
                <img src={buildAvatarUrl(row.avatar, row.updatedAt)} alt={row.name} className="h-full w-full object-cover" />
              ) : (
                <Users className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[rgb(var(--text))]">{row.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="whitespace-nowrap">{row.employeeId || 'No ID'}</span>
                    <span className="text-slate-300">/</span>
                    <Badge tone={roleTone(row.role)}>{row.role || 'employee'}</Badge>
                  </div>
                </div>

                <Badge tone={presenceTone(row.online)} className="shrink-0">
                  {row.online ? 'Online now' : 'Offline'}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="slate">{row.department || 'No department'}</Badge>
                <Badge tone="blue">{row.currentProjectCount || 0} projects</Badge>
                <Badge tone={row.activeTaskCount ? 'amber' : 'slate'}>{row.activeTaskCount || 0} active tasks</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-[rgb(var(--text))] sm:grid-cols-2">
            <div className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{row.email || '-'}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{row.phone || '-'}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 sm:col-span-2">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{row.emergencyPhone || 'No emergency contact'}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {(row.currentProjects || []).slice(0, 2).map((project) => (
              <Badge key={project.id} tone="slate" className="mr-2 max-w-full">
                <span className="truncate">
                  {project.projectName}
                  {project.clientName ? ` - ${project.clientName}` : ''}
                </span>
              </Badge>
            ))}
            {(row.currentProjects || []).length > 2 ? <Badge tone="blue">+{row.currentProjects.length - 2} more</Badge> : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {summarizeTaskCounts(row.taskSummary).map((item) => (
                <Badge key={item.label} tone={item.tone}>
                  {item.label}: {item.value}
                </Badge>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 rounded-xl px-3"
              onClick={() => navigate(`/employees/${row.id}`)}
            >
              Open
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export default function Monitor() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [presenceFilter, setPresenceFilter] = useState('all');
  const [sort, setSort] = useState('default');

  const debouncedSearch = useDebouncedValue(searchInput, 240);
  const deferredSearch = useDeferredValue(debouncedSearch);

  const queryParams = useMemo(
    () => ({
      search: deferredSearch.trim() || undefined,
      role: roleFilter,
      presence: presenceFilter,
      sort,
      page: 1,
      pageSize: INLINE_PAGE_SIZE,
    }),
    [deferredSearch, presenceFilter, roleFilter, sort],
  );

  const monitorQuery = useMonitor(queryParams, {
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const rows = monitorQuery.data?.rows || [];
  const summary = monitorQuery.data?.summary || {};
  const pagination = monitorQuery.data?.pagination || {};
  const totalRows = pagination.totalRows ?? summary.totalEmployees ?? rows.length;
  const loading = monitorQuery.isLoading;
  const isRefetching = monitorQuery.isFetching && !monitorQuery.isLoading;
  const hasFilters = Boolean(searchInput.trim()) || roleFilter !== 'all' || presenceFilter !== 'all' || sort !== 'default';
  const activeFilterCount = [searchInput.trim(), roleFilter, presenceFilter, sort].filter((value) => value && value !== 'all' && value !== 'default').length;
  const virtualizeRows = rows.length >= VIRTUALIZE_THRESHOLD;

  const stats = useMemo(
    () => [
      { label: 'Visible staff', value: summary.totalEmployees || 0, note: 'Filtered rows', icon: Users, tone: 'blue' },
      { label: 'Online now', value: summary.onlineEmployees || 0, note: 'Active socket sessions', icon: UserCheck, tone: 'green' },
      { label: 'Offline', value: summary.offlineEmployees || 0, note: 'Using last login fallback', icon: UserX, tone: 'rose' },
      { label: 'Tracked projects', value: summary.trackedProjects || 0, note: 'Current work graph', icon: BriefcaseBusiness, tone: 'amber' },
      { label: 'Open assignments', value: summary.activeAssignments || 0, note: 'Tasks still in motion', icon: Activity, tone: 'blue' },
    ],
    [summary.activeAssignments, summary.offlineEmployees, summary.onlineEmployees, summary.totalEmployees, summary.trackedProjects],
  );

  const columns = useMemo(
    () => [
      {
        key: 'employee',
        label: 'Employee',
        className: 'min-w-[0]',
        render: (row) => (
          <button
            type="button"
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() => navigate(`/employees/${row.id}`)}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-amber-500 text-base font-semibold text-white shadow-sm ring-1 ring-white/20">
              {buildAvatarUrl(row.avatar, row.updatedAt) ? (
                <img src={buildAvatarUrl(row.avatar, row.updatedAt)} alt={row.name} className="h-full w-full object-cover" />
              ) : (
                <Users className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-[rgb(var(--text))]">{row.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="whitespace-nowrap">{row.employeeId || 'No ID'}</span>
                <span className="text-slate-300">/</span>
                <Badge tone={roleTone(row.role)}>{row.role || 'employee'}</Badge>
              </div>
            </div>
          </button>
        ),
      },
      {
        key: 'role',
        label: 'Role',
        className: 'min-w-[120px]',
        render: (row) => <Badge tone={roleTone(row.role)}>{row.role || 'employee'}</Badge>,
      },
      {
        key: 'department',
        label: 'Department',
        className: 'min-w-[130px]',
        render: (row) => <span className="font-medium text-[rgb(var(--text))]">{row.department || '-'}</span>,
      },
      {
        key: 'contact',
        label: 'Contact',
        className: 'min-w-[280px]',
        render: (row) => (
          <div className="space-y-1.5 text-sm text-[rgb(var(--text))]">
            <div className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{row.email || '-'}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{row.phone || '-'}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{row.emergencyPhone || 'No emergency contact'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'projects',
        label: 'Current Projects',
        className: 'min-w-[300px]',
        render: (row) => (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(row.currentProjects || []).slice(0, 2).map((project) => (
                <Badge key={project.id} tone="slate" className="max-w-full">
                  <span className="truncate">
                    {project.projectName}
                    {project.clientName ? ` - ${project.clientName}` : ''}
                  </span>
                </Badge>
              ))}
              {(row.currentProjects || []).length > 2 ? <Badge tone="blue">+{row.currentProjects.length - 2} more</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="blue">{row.currentProjectCount || 0} projects</Badge>
              <Badge tone={row.activeTaskCount ? 'amber' : 'slate'}>{row.activeTaskCount || 0} active tasks</Badge>
            </div>
          </div>
        ),
      },
      {
        key: 'taskSummary',
        label: 'Task Summary',
        className: 'min-w-[220px]',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            {summarizeTaskCounts(row.taskSummary).map((item) => (
              <Badge key={item.label} tone={item.tone}>
                {item.label}: {item.value}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: 'online',
        label: 'Presence',
        className: 'min-w-[140px]',
        render: (row) => (
          <div className="space-y-1">
            <Badge tone={presenceTone(row.online)} className="relative overflow-hidden">
              <span className={`absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${row.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="pl-3">{row.online ? 'Online now' : 'Offline'}</span>
            </Badge>
            <div className="text-xs text-slate-500">{row.online ? `Connected ${formatRelative(row.connectedAt)}` : 'Fallback to last login'}</div>
          </div>
        ),
      },
      {
        key: 'lastLogin',
        label: 'Last Login',
        className: 'min-w-[170px]',
        render: (row) => (
          <div className="space-y-1">
            <div className="text-sm font-medium text-[rgb(var(--text))]">{formatDateTime(row.lastLogin)}</div>
            <div className="text-xs text-slate-500">{row.online ? 'Stored audit trail' : `Last seen ${formatRelative(row.lastLogin)}`}</div>
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'Action',
        className: 'w-[112px] whitespace-nowrap text-right',
        render: (row) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.7)] px-3 text-[rgb(var(--text))]"
              onClick={() => navigate(`/employees/${row.id}`)}
            >
              Open
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const resetFilters = () => {
    setSearchInput('');
    setRoleFilter('all');
    setPresenceFilter('all');
    setSort('default');
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-slate relative overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,131,245,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(34,201,122,0.12),transparent_36%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">
              <Radar className="h-3.5 w-3.5" />
              Admin monitor
            </div>
            <p className="hero-kicker">Employee Activity</p>
            <h1 className="hero-title">Who is online right now</h1>
            <p className="hero-subtitle max-w-3xl">Live socket presence, current project ties, and last-login audit data in one scan-friendly directory.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live presence
            </Badge>
            <Badge tone="blue">{summary.onlineEmployees || 0} online</Badge>
            <Badge tone="slate">{totalRows || 0} matching</Badge>
          </div>
        </div>
      </section>

      <section className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -2 }}
            className="h-full"
          >
            <Card className="flex h-full flex-col transition-shadow duration-300 hover:shadow-[0_18px_48px_-36px_rgba(15,23,42,0.32)]">
              <CardBody className="flex h-full flex-1 flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      <stat.icon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{stat.label}</span>
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-[rgb(var(--text))]">{stat.value}</div>
                  </div>
                  <Badge tone={stat.tone} className="shrink-0">
                    {stat.label}
                  </Badge>
                </div>
                <div className="mt-3 text-xs text-slate-500">{stat.note}</div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </section>

      <Card className="min-h-0">
        <CardHeader className="items-start justify-between">
          <div>
            <CardTitle>Activity monitor</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Showing who is connected, what they are tied to, and the persisted login trail when they are offline.</p>
          </div>
          {isRefetching ? <Badge tone="amber">Refreshing</Badge> : null}
        </CardHeader>

        <CardBody className="space-y-4">
          {monitorQuery.isError ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardBody className="flex items-center gap-3 py-8">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[rgb(var(--text))]">{monitorQuery.error?.response?.data?.message || 'Failed to load monitor data'}</div>
                    <div className="text-xs text-slate-500">Try again after the API becomes available.</div>
                  </div>
                  <Button variant="secondary" onClick={() => monitorQuery.refetch()}>
                    Retry
                  </Button>
                </CardBody>
              </Card>
            </motion.div>
          ) : null}

          <div className="space-y-3">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px_240px]">
              <div className="space-y-2">
                <div className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Search</div>
                <SearchInput
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onClear={() => setSearchInput('')}
                  placeholder="Search employees, roles, departments, projects..."
                  className="min-w-0"
                />
              </div>

              <DropdownField
                label="Sort by"
                value={sort}
                onChange={setSort}
                options={sortOptions}
                selectedLabel={sortOptions.find((option) => option.value === sort)?.label || 'Live first'}
                placeholder="Sort results"
                emptyValue="default"
                triggerClassName="h-14 rounded-3xl"
              />

              <div className="space-y-2">
                <div className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</div>
                <div className="flex h-14 items-stretch gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-full flex-1 rounded-3xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] px-4"
                    onClick={resetFilters}
                    disabled={!hasFilters}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear filters
                  </Button>
                  <div className="hidden xl:flex min-w-[104px] items-center justify-center rounded-3xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel-2)/0.45)] px-4 text-xs text-slate-500">
                    {activeFilterCount ? `${activeFilterCount} active` : 'Default'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <FilterChips options={roleOptions} value={roleFilter} onChange={setRoleFilter} />
              <FilterChips options={presenceOptions} value={presenceFilter} onChange={setPresenceFilter} />
              {hasFilters ? (
                <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={resetFilters}>
                  Reset filters
                </Button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={6} columns={9} />
          ) : rows.length ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="hidden md:block">
                  <MonitorDesktopGrid columns={columns} rows={rows} navigate={navigate} virtualize={virtualizeRows} />
                </div>

                <MonitorMobileCards rows={rows} navigate={navigate} />
              </motion.div>
            </AnimatePresence>
          ) : (
            <EmptyState
              title="No monitor matches"
              description="Clear the search or filters to see the active workforce."
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={resetFilters}>
                    Reset filters
                  </Button>
                ) : null
              }
            />
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}
