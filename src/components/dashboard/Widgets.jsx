import { useEffect, useMemo, useRef, useState } from 'react';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  GripVertical,
  MapPin,
  MoreHorizontal,
  PencilLine,
  Plus,
  RefreshCw,
  ShieldAlert,
  Star,
  TimerReset,
  UserRound,
  Trash2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FixedSizeList as List } from 'react-window';
import toast from 'react-hot-toast';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';
import { useUiStore } from '../../store/uiStore';
import { clamp, cn } from '../../lib/utils';

function useClockTick(intervalMs = 60000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}

function getTaskCountdownMeta(dueDate, now = Date.now()) {
  if (!dueDate) {
    return {
      label: 'No due date',
      tone: 'slate',
      icon: Clock3,
    };
  }

  const due = parseISO(dueDate);
  if (Number.isNaN(due.getTime())) {
    return {
      label: 'No due date',
      tone: 'slate',
      icon: Clock3,
    };
  }

  const diff = due.getTime() - now;
  const distance = formatDistanceToNowStrict(due, { addSuffix: false });

  if (diff < 0) {
    return {
      label: `Overdue by ${distance}`,
      tone: 'rose',
      icon: TimerReset,
    };
  }

  if (diff <= 48 * 60 * 60 * 1000) {
    return {
      label: `Due in ${distance}`,
      tone: 'amber',
      icon: Clock3,
    };
  }

  return {
    label: `Due in ${distance}`,
    tone: 'blue',
    icon: Clock3,
  };
}

export function KpiGrid({ items = [] }) {
  const toneMap = {
    blue: {
      top: 'bg-gradient-to-r from-sky-500/35 to-sky-500/0',
      value: 'text-sky-300',
    },
    sky: {
      top: 'bg-gradient-to-r from-cyan-500/35 to-cyan-500/0',
      value: 'text-cyan-300',
    },
    emerald: {
      top: 'bg-gradient-to-r from-emerald-500/35 to-emerald-500/0',
      value: 'text-emerald-300',
    },
    amber: {
      top: 'bg-gradient-to-r from-amber-500/35 to-amber-500/0',
      value: 'text-amber-300',
    },
    rose: {
      top: 'bg-gradient-to-r from-rose-500/35 to-rose-500/0',
      value: 'text-rose-300',
    },
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {items.map((item) => (
        <Card key={item.label} className="relative overflow-hidden">
          <div className={cn('absolute inset-x-0 top-0 h-1', toneMap[item.tone]?.top || toneMap.blue.top)} />
          <CardBody className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {item.label}
            </p>
            <div className="mt-3 flex items-end gap-2">
              <div className={cn('font-display text-3xl font-bold tracking-tight sm:text-[2rem]', toneMap[item.tone]?.value || toneMap.blue.value)}>
                {item.value}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">{item.note}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function RevenueChartCard({ rows = [] }) {
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const summaryRows = useMemo(
    () =>
      rows
        .map((item) => {
          const received = Number(item.received || 0);
          const balance = Number(item.balance || 0);
          const total = received + balance;
          const progress = total > 0 ? clamp(Math.round((received / total) * 100), 0, 100) : 0;

          return {
            ...item,
            received,
            balance,
            total,
            progress,
          };
        })
        .sort((a, b) => b.total - a.total),
    [rows],
  );

  const summary = useMemo(
    () =>
      summaryRows.reduce(
        (acc, row) => {
          acc.received += row.received;
          acc.balance += row.balance;
          acc.total += row.total;
          return acc;
        },
        { received: 0, balance: 0, total: 0 },
      ),
    [summaryRows],
  );

  return (
    <Card className="self-start">
      <CardHeader className="items-start gap-2">
        <div>
          <CardTitle>Revenue Pipeline</CardTitle>
          <p className="mt-1 text-xs text-slate-500">Clean summary of received and pending balances.</p>
        </div>
        <span className="ml-auto text-xs uppercase tracking-[0.18em] text-slate-400">Rs. Lakhs</span>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Received"
            value={summary.received}
            hint={`${summary.total ? Math.round((summary.received / summary.total) * 100) : 0}% collected`}
            tone="blue"
            isLight={isLight}
          />
          <StatCard
            label="Pending"
            value={summary.balance}
            hint={`${summaryRows.length} active projects`}
            tone="slate"
            isLight={isLight}
          />
        </div>

        <div className="max-h-[260px] space-y-3 overflow-auto pr-1">
          {summaryRows.map((row) => (
            <article
              key={row.name}
              className={cn(
                'rounded-2xl border p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
                isLight
                  ? 'border-slate-200/80 bg-white'
                  : 'border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.78)]',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{row.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {row.received} received · {row.balance} pending
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-[rgb(var(--text))]">{row.progress}%</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Collected</div>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                  style={{ width: `${row.progress}%` }}
                />
              </div>
            </article>
          ))}

          {!summaryRows.length ? (
            <div className={cn('rounded-2xl border px-4 py-8 text-center text-sm text-slate-400', isLight ? 'border-slate-200 bg-white' : 'border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.78)]')}>
              No revenue data available.
            </div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

function StatCard({ label, value, hint, tone = 'slate', isLight = false }) {
  const styles = {
    blue: isLight ? 'border-sky-200 bg-sky-50/80' : 'border-sky-400/20 bg-sky-500/10',
    slate: isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-white/5',
  };

  return (
    <div className={cn('rounded-2xl border p-3', styles[tone])}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-[rgb(var(--text))]">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    progress: ['sky', 'In Progress'],
    done: ['green', 'Completed'],
    hold: ['amber', 'On Hold'],
    cancelled: ['rose', 'Cancelled'],
  };

  const [tone, label] = config[status] || config.progress;
  return <Badge tone={tone}>{label}</Badge>;
}

function PriorityBadge({ priority }) {
  const tone = {
    critical: 'rose',
    high: 'amber',
    medium: 'blue',
    low: 'green',
  }[priority] || 'slate';
  return <Badge tone={tone}>{priority}</Badge>;
}

function ApprovalBadge({ approval }) {
  if (approval === 'Approved') return <Badge tone="green">{approval}</Badge>;
  if (approval === 'Pending') return <Badge tone="amber">{approval}</Badge>;
  if (approval === 'In Review') return <Badge tone="blue">{approval}</Badge>;
  return <Badge>{approval}</Badge>;
}

function TaskStatusBadge({ status }) {
  const config = {
    done: ['green', 'Completed'],
    'in-progress': ['blue', 'In Progress'],
    review: ['amber', 'In Review'],
    blocked: ['rose', 'Blocked'],
    pending: ['slate', 'Pending'],
  };

  const [tone, label] = config[status] || config.pending;
  return <Badge tone={tone}>{label}</Badge>;
}

export function TaskCountdownPill({ dueDate, compact = false }) {
  const now = useClockTick();
  const meta = getTaskCountdownMeta(dueDate, now);
  const ToneIcon = meta.icon;

  return (
    <Badge
      tone={meta.tone}
      className={cn(
        'gap-1.5',
        compact && 'px-2 py-0.5 text-[10px]',
      )}
    >
      <ToneIcon className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  );
}

function ProgressRing({ value, status }) {
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const stroke = status === 'done' ? '#22c55e' : status === 'hold' ? '#f59e0b' : '#3b82f6';
  return (
    <div className="h-14 w-14">
      <CircularProgressbar
        value={value}
        text={`${value}`}
        styles={buildStyles({
          pathColor: stroke,
          textColor: isLight ? '#0f172a' : '#e2e8f0',
          trailColor: isLight ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.14)',
          textSize: '28px',
        })}
      />
    </div>
  );
}

function ProjectCard({ item }) {
  const openTasks = (item.tasks || []).filter((task) => task.status !== 'done');
  const nextTask = [...openTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.07]">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">{item.name}</div>
          <div className="mt-1 text-xs text-slate-400">{item.client}</div>
        </div>
        <GripVertical className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <PriorityBadge priority={item.priority} />
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>{item.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{format(parseISO(item.end), 'dd MMM yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserRound className="h-3.5 w-3.5" />
            <span>{item.engineer}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5" />
            <span>{openTasks.length ? `${openTasks.length} open task${openTasks.length > 1 ? 's' : ''}` : 'No open tasks'}</span>
          </div>
          {nextTask ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Next:</span>
              <span className="text-slate-300">{nextTask.title}</span>
            </div>
          ) : null}
        </div>
        <ProgressRing value={item.completion} status={item.status} />
      </div>
    </div>
  );
}

export function ProjectTrackerCard({ rows = [] }) {
  const list = rows.slice(0, 8);
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Project Master Tracker</CardTitle>
        <div className="ml-auto flex flex-wrap gap-2">
          <Badge>Table</Badge>
          <Badge tone="blue">Kanban</Badge>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="hidden overflow-x-auto sm:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Tasks</th>
                <th className="px-4 py-3">Timer</th>
                <th className="px-4 py-3">Approval</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-white/5 transition hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.client}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{item.stage}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-4">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-white/8">
                        <div className="h-2 rounded-full bg-sky-500" style={{ width: `${item.completion}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{item.completion}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{item.engineer}</td>
                  <td className="px-4 py-4 text-slate-300">{(item.tasks || []).length}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <TaskCountdownPill dueDate={[...(item.tasks || [])].filter((task) => task.status !== 'done').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate} compact />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <ApprovalBadge approval={item.approval} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 border-t border-white/10 p-4 sm:hidden">
          {list.map((item) => (
            <ProjectCard key={item.id} item={item} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function ActionItemsCard({ items = [], showActions = false }) {
  return (
    <Card>
      <CardHeader>
        <ShieldAlert className="h-4 w-4 text-amber-300" />
        <CardTitle>Immediate Action Items</CardTitle>
        <Badge tone="rose">{items.length} items</Badge>
      </CardHeader>
      <CardBody className="p-0">
        <div className="hidden overflow-x-auto sm:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Next Action</th>
                <th className="px-4 py-3">Responsible Engineer</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Decision Required</th>
                {showActions ? <th className="px-4 py-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.n}-${item.proj}`} className="border-b border-white/5 align-top transition hover:bg-white/5">
                  <td className="px-4 py-4 text-slate-500">{item.n}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-white">{item.proj}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-400">{item.client}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.status === 'Completed' ? 'done' : item.status === 'On Hold' ? 'hold' : item.status === 'Cancelled' ? 'cancelled' : 'progress'} />
                  </td>
                  <td className="px-4 py-4">
                    <PriorityBadge priority={item.pri} />
                  </td>
                  <td className="px-4 py-4 text-slate-300">{item.stage}</td>
                  <td className="px-4 py-4 text-slate-400">{item.action}</td>
                  <td className="px-4 py-4 text-slate-300">{item.resp}</td>
                  <td className="px-4 py-4 text-slate-500">{format(parseISO(item.target), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-4 text-slate-400">{item.decision}</td>
                  {showActions ? (
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => toast.success(`Approved ${item.proj}`)}>
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => toast.error(`Rejected ${item.proj}`)}>
                          <Trash2 className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 border-t border-white/10 p-4 sm:hidden">
          {items.map((item) => (
            <div key={`${item.n}-${item.proj}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{item.proj}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.client}</div>
                </div>
                <Badge tone={item.pri === 'critical' ? 'rose' : item.pri === 'high' ? 'amber' : item.pri === 'medium' ? 'blue' : 'green'}>
                  {item.pri}
                </Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-400">
                <div>{item.action}</div>
                <div>{item.resp}</div>
                <div>{format(parseISO(item.target), 'dd MMM yyyy')}</div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function TeamWorkloadCard({ members = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        {members.length ? (
          members.map((member) => (
            <div key={member.name} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-100">{member.name}</span>
                <span className="text-xs text-slate-400">{member.count} projects</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8">
                <div className="h-1.5 rounded-full" style={{ width: `${Math.min(member.count * 25, 100)}%`, background: member.color }} />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            No team workload data yet.
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function StageTimelineCard({ steps = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage Timeline</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const done = index < 4;
            const active = index === 4;
            return (
              <div key={step} className="min-w-[92px] text-center">
                <div
                  className={cn(
                    'mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold',
                    done ? 'border-sky-500 bg-sky-500 text-slate-950' : active ? 'border-sky-400 bg-sky-500/15 text-sky-300' : 'border-white/10 bg-white/5 text-slate-400',
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <div className={cn('mt-2 text-[11px] text-slate-500', active && 'text-sky-300', done && 'text-slate-300')}>
                  {step}
                </div>
              </div>
            );
          })}
          {!steps.length ? <div className="text-sm text-slate-400">No stage timeline data yet.</div> : null}
        </div>
      </CardBody>
    </Card>
  );
}

export function StageGuideCard({ stages = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage Reference Guide</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {stages.length ? (
          stages.map((stage, index) => (
            <div key={`${stage.stageNo}-${stage.stageName}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl font-semibold text-sky-300">
                {stage.stageNo || `S${index + 1}`}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-400">{stage.stageNo || `Stage ${index + 1}`}</div>
                <div className="truncate text-sm font-medium text-slate-100">{stage.stageName}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            No stage reference data yet.
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function TaskQueueCard({ tasks = [], title = 'Task Queue', subtitle = 'Assigned work with live countdowns', limit = 6 }) {
  const visible = tasks.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 flex-col">
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <Badge tone="blue" className="ml-auto">
          {visible.length} tasks
        </Badge>
      </CardHeader>
      <CardBody className="p-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Timer</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((task) => (
                <tr key={task.id} className="border-b border-white/5 transition hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-white">{task.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{task.projectStage}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{task.projectName}</td>
                  <td className="px-4 py-4 text-slate-300">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-3.5 w-3.5 text-slate-500" />
                      <span>{task.assignee}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-400">{format(parseISO(task.dueDate), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-4">
                    <TaskCountdownPill dueDate={task.dueDate} compact />
                  </td>
                  <td className="px-4 py-4">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-4">
                    <TaskStatusBadge status={task.status} />
                  </td>
                </tr>
              ))}
              {!visible.length ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-400" colSpan="7">
                    No tasks available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 border-t border-white/10 p-4 md:hidden">
          {visible.map((task) => (
            <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-white">{task.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{task.projectName}</div>
                </div>
                <TaskStatusBadge status={task.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <PriorityBadge priority={task.priority} />
                <TaskCountdownPill dueDate={task.dueDate} compact />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <UserRound className="h-3.5 w-3.5" />
                <span>{task.assignee}</span>
              </div>
            </div>
          ))}
          {!visible.length ? <div className="text-sm text-slate-400">No tasks available.</div> : null}
        </div>
      </CardBody>
    </Card>
  );
}

function KanbanCard({ item }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id, data: { item } });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 transition hover:border-white/20"
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white">{item.name}</div>
          <div className="mt-1 text-xs text-slate-400">
            {item.client} - {item.location}
          </div>
        </div>
        <GripVertical className="h-4 w-4 shrink-0 text-slate-500" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <PriorityBadge priority={item.priority} />
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(parseISO(item.end), 'dd MMM yyyy')}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            {item.stage}
          </div>
        </div>
        <ProgressRing value={item.completion} status={item.status} />
      </div>
    </div>
  );
}

function KanbanColumn({ column, items }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.name });

  return (
    <div ref={setNodeRef} className={cn('min-w-[300px] rounded-[1.4rem] border border-white/10 bg-white/5 p-3', isOver && 'ring-2 ring-sky-400/40')}>
      <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: column.color }} />
        <div className="text-sm font-semibold text-white">{column.name}</div>
        <Badge className="ml-auto">{items.length}</Badge>
      </div>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <KanbanCard key={item.id} item={item} />
        ))}
        <button
          type="button"
          onClick={() => toast(`Add card in ${column.name}`)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add card
        </button>
      </div>
    </div>
  );
}

export function KanbanBoardCard({ projects = [] }) {
  const [items, setItems] = useState(projects);
  const railRef = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const grouped = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.stage]) acc[item.stage] = [];
      acc[item.stage].push(item);
      return acc;
    }, {});
  }, [items]);

  const columns = useMemo(() => {
    return Object.keys(grouped).map((name) => ({
      name,
      color: '#3b82f6',
    }));
  }, [grouped]);

  useEffect(() => {
    setItems(projects);
  }, [projects]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollLeft = 0;
  }, [items]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const activeItem = active.data.current?.item;
    if (!activeItem) return;

    const targetColumn = columns.find((column) => column.name === over.id);
    if (!targetColumn) return;

    setItems((current) =>
      current.map((item) =>
        item.id === activeItem.id
          ? {
              ...item,
              stage: targetColumn.name,
              status: targetColumn.name.toLowerCase().includes('as-built') ? 'done' : item.status,
            }
          : item,
      ),
    );
  }

  return (
    <Card className="min-w-0 max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Kanban Board - Stage View</CardTitle>
        <div className="ml-auto flex gap-2">
          <Badge>All Projects</Badge>
          <Badge tone="blue">Mine</Badge>
          <Badge tone="rose">Critical</Badge>
        </div>
      </CardHeader>
      <CardBody className="min-w-0 overflow-x-hidden">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div ref={railRef} className="max-w-full overflow-x-auto overflow-y-hidden pb-3">
            <div className="flex min-w-max gap-4 px-1 pr-4">
              {columns.length ? columns.map((column) => (
                <KanbanColumn key={column.name} column={column} items={grouped[column.name] || []} />
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                  No kanban data yet.
                </div>
              )}
            </div>
          </div>
        </DndContext>
      </CardBody>
    </Card>
  );
}

export function TeamGridCard({ members = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team and Role Management</CardTitle>
        <Button variant="secondary" className="ml-auto" onClick={() => toast.success('Invite member flow opened')}>
          <Plus className="h-4 w-4" />
          Invite Member
        </Button>
      </CardHeader>
      <CardBody>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {members.length ? members.map((member) => (
            <div key={member.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white"
                  style={{ background: member.color }}
                >
                  {member.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">{member.name}</div>
                  <div className="mt-1 text-sm text-slate-400">{member.role}</div>
                  <div className="mt-1 text-xs text-sky-300">{member.projects} projects assigned</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => toast(`Editing ${member.name}`)}>
                  <PencilLine className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 text-xs text-slate-400">{member.online ? 'Online' : 'Offline'}</div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              No team members yet.
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function BillingTableCard({ rows = [] }) {
  const records = rows.filter((project) => project.recv > 0 || project.balance > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Pipeline Summary</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Value (Rs. L)</th>
                <th className="px-4 py-3">Billing Status</th>
                <th className="px-4 py-3">Received (Rs. L)</th>
                <th className="px-4 py-3">Balance (Rs. L)</th>
                <th className="px-4 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {records.map((item) => {
                const total = item.recv + item.balance;
                const percentage = clamp(Math.round((item.recv / total) * 100), 0, 100);

                return (
                  <tr key={item.id} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="px-4 py-4 font-semibold text-white">{item.name}</td>
                    <td className="px-4 py-4 text-slate-400">{item.client}</td>
                    <td className="px-4 py-4 text-slate-300">{item.type}</td>
                    <td className="px-4 py-4 font-semibold text-slate-100">Rs. {item.value}</td>
                    <td className="px-4 py-4 text-slate-400">{item.billing}</td>
                    <td className="px-4 py-4 text-emerald-300">Rs. {item.recv.toFixed(2)}</td>
                    <td className="px-4 py-4 text-amber-300">Rs. {item.balance.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 rounded-full bg-white/8">
                          <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!records.length ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-400" colSpan="8">
                    No billing records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

export function ReportsCard({ report = null }) {
  return (
    <Card className="min-h-[380px]">
      <CardHeader>
        <CardTitle>Reports and Analytics</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4 text-slate-400">
        {report ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricBox label="Projects" value={report.totalProjects} />
              <MetricBox label="Received" value={`Rs. ${report.billing.received.toFixed(2)}L`} />
              <MetricBox label="Balance" value={`Rs. ${report.billing.balance.toFixed(2)}L`} />
              <MetricBox label="Task Statuses" value={Object.values(report.byTaskStatus || {}).reduce((sum, count) => sum + count, 0)} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <MiniChart title="By Status" data={report.byStatus} />
              <MiniChart title="By Priority" data={report.byPriority} />
              <MiniChart title="By Task Status" data={report.byTaskStatus || {}} />
            </div>
          </>
        ) : (
          <div className="grid place-items-center py-16 text-center text-slate-400">
            <div>
              <BarChart className="mx-auto h-12 w-12 text-slate-500" />
              <div className="mt-4 text-sm">No report data yet.</div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function MetricBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 font-display text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function MiniChart({ title, data = {} }) {
  const entries = Object.entries(data);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-3 space-y-2">
        {entries.length ? entries.map(([label, value]) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <div className="w-28 truncate text-slate-400">{label}</div>
            <div className="h-2 flex-1 rounded-full bg-white/8">
              <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(Number(value) * 20, 100)}%` }} />
            </div>
            <div className="w-8 text-right text-slate-300">{String(value)}</div>
          </div>
        )) : <div className="text-sm text-slate-400">No data.</div>}
      </div>
    </div>
  );
}

export function MiniProjectList({ rows = [] }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const itemSize = 96;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect?.width || 0;
      setWidth(nextWidth);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="rounded-[1.1rem] border border-white/10 bg-white/5">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-100">Virtual project list</div>
      {width > 0 && rows.length ? (
        <List height={Math.min(rows.length * itemSize, 520)} itemCount={rows.length} itemSize={itemSize} width={width}>
          {({ index, style }) => {
            const item = rows[index];
            return (
              <div style={style} className="border-b border-white/5 px-4 py-3">
                {(() => {
                  const openTasks = (item.tasks || []).filter((task) => task.status !== 'done');
                  const nextTask = [...openTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

                  return (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.client}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <UserRound className="h-3.5 w-3.5" />
                      <span>{item.engineer}</span>
                      <span className="text-slate-600">·</span>
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{openTasks.length} open task{openTasks.length === 1 ? '' : 's'}</span>
                    </div>
                    {nextTask ? (
                      <div className="mt-2">
                        <TaskCountdownPill dueDate={nextTask.dueDate} compact />
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>{item.stage}</div>
                    <div className="mt-1">{item.location}</div>
                  </div>
                </div>
                  );
                })()}
              </div>
            );
          }}
        </List>
      ) : (
        <div className="p-4 text-sm text-slate-400">No projects available.</div>
      )}
    </div>
  );
}

export { StatusBadge, PriorityBadge, ApprovalBadge, TaskStatusBadge };

