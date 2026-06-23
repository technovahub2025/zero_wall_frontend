import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FolderKanban,
  MessageSquareText,
  MessagesSquare,
  PauseCircle,
  PencilLine,
  PlayCircle,
  Shuffle,
  StopCircle,
  TimerReset,
  Tag,
  Trash2,
  UserRound,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { useEmployees } from '../hooks/useEmployees';
import { useProjectStages } from '../hooks/useProjects';
import { useTeams } from '../hooks/useTeams';
import {
  useAddTaskComment,
  useDeleteTask,
  useRequestTaskTimeExtension,
  useTask,
  useTaskTimerLogs,
  useUpdateTask,
} from '../hooks/useTasks';
import { useTimer } from '../hooks/useTimer';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/shared/EmptyState';
import { ModalShell } from '../components/shared/ModalShell';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { TaskComments } from '../components/tasks/TaskComments';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskPriorityBadge } from '../components/tasks/TaskPriorityBadge';
import { TaskStatusBadge } from '../components/tasks/TaskStatusBadge';
import { TimeExtensionRequestsPanel } from '../components/tasks/TimeExtensionRequestsPanel';
import { formatDuration } from '../store/timerStore';
import { formatIndiaDateTime } from '../utils/formatters';
import { getTimerActionLabel, getTimerActionTone, getTimerReason } from '../utils/timerLogDisplay';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const taskQuery = useTask(id, { staleTime: 30_000, refetchOnWindowFocus: false });
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addComment = useAddTaskComment();
  const [editOpen, setEditOpen] = useState(false);

  const task = taskQuery.data;
  const projectId = task?.projectId || task?.project?.id || task?.project?._id || task?.project || '';
  const stageId = task?.stageId || task?.stage?.id || task?.stage?._id || task?.stage || '';
  const canManage = ['superadmin', 'admin', 'project_manager'].includes(currentUser?.role);
  const canDelete = currentUser?.role === 'superadmin';
  const canStart = useMemo(() => {
    if (!task || !currentUser?.id) return false;
    const assigneeId = task.assignee?._id || task.assignee?.id || task.assignee;
    const reporterId = task.reporter?._id || task.reporter?.id || task.reporter || task.createdBy?._id || task.createdBy?.id || task.createdBy;
    const assignedTeamIds = Array.isArray(task.assignedTeam) ? task.assignedTeam.map((member) => member?._id || member?.id || member) : [];
    const teamMemberIds = Array.isArray(task.teamMembers) ? task.teamMembers.map((member) => member?._id || member?.id || member) : [];
    return (
      canManage ||
      String(assigneeId || '') === String(currentUser.id) ||
      String(reporterId || '') === String(currentUser.id) ||
      assignedTeamIds.some((memberId) => String(memberId) === String(currentUser.id)) ||
      teamMemberIds.some((memberId) => String(memberId) === String(currentUser.id))
    );
  }, [canManage, currentUser?.id, task]);
  const canEditTask = Boolean(canManage && editOpen);
  const employeesQuery = useEmployees(
    {},
    { enabled: canEditTask, staleTime: 60_000, refetchOnWindowFocus: false },
  );
  const teamsQuery = useTeams(
    {},
    { enabled: canEditTask, staleTime: 60_000, refetchOnWindowFocus: false },
  );
  const stagesQuery = useProjectStages(projectId, {
    enabled: canEditTask && Boolean(projectId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (taskQuery.isLoading) {
    return <SkeletonCard />;
  }

  if (taskQuery.isError) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3 py-10">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[rgb(var(--text))]">{taskQuery.error?.message || 'Failed to load task'}</div>
            <div className="text-xs text-slate-500">You may not have access to this task, or it may have been removed.</div>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        </CardBody>
      </Card>
    );
  }

  if (!task) {
    return <EmptyState title="Task not found" description="The requested task could not be loaded." action={<Button onClick={() => navigate(-1)}>Back</Button>} />;
  }

  async function handleEdit(values) {
    await updateTask.mutateAsync({ id: task.id, payload: { ...values, project: values.project || projectId } });
    setEditOpen(false);
  }

  async function handleDelete() {
    await deleteTask.mutateAsync(task.id);
    navigate(projectId ? `/projects/${projectId}` : '/my-tasks');
  }

  async function handleComplete() {
    await updateTask.mutateAsync({ id: task.id, payload: { status: 'done', project: projectId } });
  }

  const teamMemberNames = Array.isArray(task.assignedTeamNames) && task.assignedTeamNames.length
    ? task.assignedTeamNames
    : Array.isArray(task.assignedTeam)
      ? task.assignedTeam.map((member) => member?.name || member?.label || '').filter(Boolean)
      : [];
  const commentsCount = Array.isArray(task.comments) ? task.comments.length : 0;
  const requestCount = task.pendingTimeExtensionRequest ? 1 : 0;
  const quickStats = [
    { label: 'Status', value: task.status || 'todo', tone: task.status === 'done' ? 'green' : task.status === 'blocked' ? 'rose' : 'blue', icon: CheckCircle2 },
    { label: 'Priority', value: task.priority || 'Medium', tone: String(task.priority).toLowerCase() === 'critical' ? 'rose' : 'amber', icon: AlertCircle },
    { label: 'Comments', value: commentsCount, tone: commentsCount ? 'green' : 'slate', icon: MessageSquareText },
    { label: 'Requests', value: requestCount, tone: requestCount ? 'amber' : 'slate', icon: AlertCircle },
  ];

  const sectionLinks = [
    { href: '#task-overview', label: 'Overview', description: 'Snapshot and ownership', icon: LayoutDashboard },
    { href: '#task-work', label: 'Work', description: 'Description, tags, files', icon: ClipboardList },
    { href: '#task-comments', label: 'Comments', description: 'Collaboration trail', icon: MessagesSquare },
    { href: '#task-timer', label: 'Timer', description: 'Budget and live control', icon: TimerReset },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue overflow-hidden shadow-[0_28px_80px_-52px_rgba(15,23,42,0.38)]">
        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <p className="hero-kicker">Task Detail</p>
              <h1 className="hero-title break-words">{task.title || 'Untitled task'}</h1>
              <p className="hero-subtitle mt-2">{task.description || 'No description provided.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <TaskStatusBadge value={task.status} />
                <TaskPriorityBadge value={task.priority} />
                {task.projectName || task.project?.projectName ? (
                  <Badge tone="blue">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {task.projectName || task.project?.projectName}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManage ? (
                <>
                  <Button variant="secondary" onClick={() => setEditOpen(true)}>
                    <PencilLine className="h-4 w-4" />
                    Edit
                  </Button>
                  {canDelete ? (
                    <Button variant="danger" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickStats.map((item) => (
              <QuickStat key={item.label} {...item} />
            ))}
          </div>
        </div>
      </section>

      <div className="theme-panel-muted sticky top-[88px] z-20 rounded-3xl border border-[rgb(var(--line)/0.12)] px-3 py-3 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.28)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
          {sectionLinks.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="inline-flex min-w-[140px] flex-1 flex-col rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.9)] px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-[rgb(var(--panel)/1)]"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text))]">
                <section.icon className="h-4 w-4 text-sky-500" />
                {section.label}
              </span>
              <span className="mt-1 text-xs text-slate-500">{section.description}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <div className="space-y-6">
          <Card id="task-overview" className="overflow-hidden border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] shadow-[0_22px_70px_-48px_rgba(15,23,42,0.45)] ring-1 ring-[rgb(var(--line)/0.06)]">
            <div className="border-b border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] px-5 py-4">
              <SectionTitle title="Task Snapshot" />
            </div>
            <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <MetaItem icon={FolderKanban} label="Project" value={task.projectName || task.project?.projectName || '-'} />
              <MetaItem icon={CalendarDays} label="Stage" value={task.stage?.stageName || task.stage?.stageNo || task.projectStage || '-'} />
              <MetaItem icon={CalendarDays} label="Due Date" value={formatDate(task.dueDate)} />
              <MetaItem icon={UserRound} label="Assignee" value={task.assignee?.name || task.assigneeName || 'Unassigned'} />
              <MetaItem icon={UserRound} label="Raised By" value={task.reporter?.name || task.reporterName || task.createdBy?.name || '-'} />
              <MetaItem icon={UserRound} label="Backup Reviewer" value={task.backupReviewer?.name || task.backupReviewerName || '-'} />
              <MetaItem icon={Users} label="Team" value={task.team?.name || task.teamName || '-'} />
              <MetaItem icon={Users} label="Team Members" value={teamMemberNames.length ? teamMemberNames.join(', ') : '-'} />
              <MetaItem icon={CheckCircle2} label="Completed At" value={formatDateTime(task.completedAt)} />
            </CardBody>
          </Card>

          <Card id="task-work" className="overflow-hidden border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] shadow-[0_22px_70px_-48px_rgba(15,23,42,0.45)] ring-1 ring-[rgb(var(--line)/0.06)]">
            <div className="border-b border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] px-5 py-4">
              <SectionTitle title="Work Details" />
            </div>
            <CardBody className="space-y-4">
              <DetailBlock label="Description" value={task.description || 'No description provided.'} />
              <DetailBlock label="Next Action" value={task.nextAction || '-'} />
              <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.84)] p-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.isArray(task.tags) && task.tags.length ? task.tags.map((tag) => <Badge key={tag} tone="slate">{tag}</Badge>) : <span className="text-sm font-medium text-[rgb(var(--text))]">-</span>}
                </div>
              </div>
              <DetailBlock label="Attachments" value={Array.isArray(task.attachments) && task.attachments.length ? `${task.attachments.length} attachment(s)` : '-'} />
              <div className="grid gap-3 sm:grid-cols-2">
                <MetaItem label="Created" value={formatDateTime(task.createdAt)} />
                <MetaItem label="Updated" value={formatDateTime(task.updatedAt)} />
              </div>
            </CardBody>
          </Card>

          <Card id="task-comments" className="overflow-hidden border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] shadow-[0_22px_70px_-48px_rgba(15,23,42,0.45)] ring-1 ring-[rgb(var(--line)/0.06)]">
            <CardBody className="p-0">
              <TaskComments comments={task.comments || []} maxHeightClassName="max-h-[22rem]" onAdd={(text) => addComment.mutateAsync({ id: task.id, text })} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <TimeExtensionRequestsPanel compact />
          <TaskTimerPanel
            task={task}
            projectId={projectId}
            stageId={stageId}
            canStart={canStart}
            onComplete={handleComplete}
          />
        </div>
      </div>

      {editOpen ? (
        <ModalShell title="Edit Task" description="Update task details." onClose={() => setEditOpen(false)} widthClassName="max-w-4xl">
          <TaskForm
            initialValues={task}
            projects={task.project ? [task.project] : []}
            stageOptions={stagesQuery.data || []}
            teams={teamsQuery.data || []}
            employees={employeesQuery.data || []}
            currentUser={currentUser}
            reporter={currentUser?.id || ''}
            onSubmit={handleEdit}
            onCancel={() => setEditOpen(false)}
          />
        </ModalShell>
      ) : null}
    </motion.div>
  );
}

function SectionTitle({ title }) {
  const icons = {
    'Task Snapshot': LayoutDashboard,
    'Work Details': ClipboardList,
    'Timer Control': TimerReset,
  };
  const Icon = icons[title] || MessageSquareText;
  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
      <Icon className="h-3.5 w-3.5 text-sky-500" />
      {title}
    </div>
  );
}

function QuickStat({ label, value, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'theme-panel-muted border-sky-200/60 bg-sky-500/8 text-sky-700 shadow-[0_14px_28px_-20px_rgba(59,130,246,0.5)]',
    green: 'theme-panel-muted border-emerald-200/60 bg-emerald-500/8 text-emerald-700 shadow-[0_14px_28px_-20px_rgba(16,185,129,0.45)]',
    amber: 'theme-panel-muted border-amber-200/60 bg-amber-500/8 text-amber-700 shadow-[0_14px_28px_-20px_rgba(245,158,11,0.48)]',
    rose: 'theme-panel-muted border-rose-200/60 bg-rose-500/8 text-rose-700 shadow-[0_14px_28px_-20px_rgba(244,63,94,0.45)]',
    slate: 'theme-panel-muted border-[rgb(var(--line)/0.12)] text-slate-700 shadow-[0_14px_28px_-20px_rgba(15,23,42,0.28)]',
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone] || tones.blue}`}>
      <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[rgb(var(--panel)/0.88)] ring-1 ring-[rgb(var(--line)/0.12)]">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {label}
        </span>
      </div>
      <div className="mt-2 truncate text-lg font-semibold text-[rgb(var(--text))]">{String(value || '-')}</div>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="theme-panel-muted rounded-2xl border p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[rgb(var(--text))]">{String(value || '-')}</div>
    </div>
  );
}

function MetaItem({ label, value, icon: Icon }) {
  return (
    <div className="theme-panel-muted rounded-2xl border p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
        {Icon ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[rgb(var(--panel)/0.88)] text-sky-500 ring-1 ring-[rgb(var(--line)/0.12)]">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-[rgb(var(--text))]">{String(value || '-')}</div>
    </div>
  );
}

function TaskTimerPanel({ task, projectId, stageId, canStart, onComplete }) {
  const queryClient = useQueryClient();
  const { activeLog, isRunning, startTimer, switchTimer, resumeTimer, pauseTimer, stopTimer } = useTimer();
  const taskLogsQuery = useTaskTimerLogs(task?.id);
  const requestExtension = useRequestTaskTimeExtension();
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestedMinutes, setRequestedMinutes] = useState(30);
  const [reason, setReason] = useState('');
  const [timerAction, setTimerAction] = useState(null);
  const [timerReason, setTimerReason] = useState('');

  const isThisTaskActive = isRunning && String(activeLog?.task?.id || activeLog?.task?._id || activeLog?.task) === String(task.id);
  const isAnotherTaskActive = isRunning && !isThisTaskActive;
  const isBudgeted = Number(task?.estimatedDurationMinutes || 0) > 0;
  const totalBudgetSeconds = Number(task?.timerBudgetSeconds || 0) || (Number(task?.estimatedDurationMinutes || 0) + Number(task?.extraTimeMinutesGranted || 0)) * 60;
  const timerExpiresAt = task?.timerExpiresAt ? new Date(task.timerExpiresAt).getTime() : null;
  const remainingSeconds = timerExpiresAt ? Math.floor((timerExpiresAt - Date.now()) / 1000) : null;
  const remainingBudgetSeconds = Number.isFinite(Number(task?.timerRemainingSeconds)) && Number(task?.timerRemainingSeconds) > 0
    ? Number(task.timerRemainingSeconds)
    : Math.max(0, totalBudgetSeconds - Number(task?.totalTimeLogged || 0));
  const isPausedTask = task?.timerStatus === 'paused';
  const timerExpired =
    (isBudgeted && task?.timerStatus === 'expired') ||
    (isBudgeted && timerExpiresAt && remainingSeconds <= 0 && task?.status !== 'done' && !isPausedTask);
  const timerLabel = isPausedTask
    ? `Paused - ${formatDuration(remainingBudgetSeconds)} remaining`
    : isThisTaskActive
      ? 'Running'
      : task.timerExpiresAt
      ? (timerExpired ? 'Expired' : formatDuration(Math.max(0, remainingSeconds || 0)))
      : 'Not started';
  const timerStatusTone = timerExpired ? 'rose' : isPausedTask ? 'amber' : isThisTaskActive ? 'green' : 'slate';
  const timerLogs = taskLogsQuery.data || [];
  const activeTimerReason = isThisTaskActive ? getTimerReason(activeLog) : '';
  const actionConfig = {
    pause: {
      title: 'Pause timer',
      description: 'Add the reason for pausing this task timer.',
      label: 'Pause reason',
      placeholder: 'Why are you pausing this timer?',
      submitLabel: 'Pause Timer',
      handler: async () => pauseTimer(timerReason),
    },
    stop: {
      title: 'Stop timer',
      description: 'Add the reason for stopping and finalizing this timer.',
      label: 'Stop reason',
      placeholder: 'Why are you stopping this timer?',
      submitLabel: 'Stop Timer',
      handler: async () => stopTimer({ reason: timerReason }),
    },
    switch: {
      title: 'Switch to this task',
      description: 'Add the reason for switching from the current timer to this task.',
      label: 'Switch reason',
      placeholder: 'Why are you switching to this task?',
      submitLabel: 'Switch Timer',
      handler: async () => switchTimer(task.id, projectId, stageId, timerReason),
    },
  };
  const activeAction = timerAction ? actionConfig[timerAction] : null;

  async function refreshTaskTimerState() {
    queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    queryClient.invalidateQueries({ queryKey: ['timer-logs', 'task', task.id] });
  }

  async function handleStart() {
    await startTimer(task.id, projectId, stageId, '');
    refreshTaskTimerState();
  }

  async function handleResume() {
    await resumeTimer(task.id, projectId, stageId, '');
    refreshTaskTimerState();
  }

  async function handleTimerReasonSubmit() {
    if (!activeAction || !timerReason.trim()) return;
    await activeAction.handler();
    setTimerReason('');
    setTimerAction(null);
    refreshTaskTimerState();
  }

  return (
    <Card id="task-timer" className="overflow-hidden border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] shadow-[0_22px_70px_-48px_rgba(15,23,42,0.45)] ring-1 ring-[rgb(var(--line)/0.06)]">
      <div className="border-b border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.98)] px-5 py-4">
        <SectionTitle title="Timer Control" />
      </div>
      <CardBody className="space-y-4">
        <div className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/12 via-cyan-500/8 to-emerald-500/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                <TimerReset className="h-3.5 w-3.5" />
                Current Timer
              </div>
              <div className="mt-2 text-3xl font-semibold text-[rgb(var(--text))]">{timerLabel}</div>
              <div className="mt-1 text-xs text-slate-500">
                {isThisTaskActive ? 'This task timer is active now' : task.estimatedDurationMinutes ? `${formatDuration(Number(task.estimatedDurationMinutes) * 60)} budget` : 'No completion timer configured'}
              </div>
              {activeTimerReason ? (
                <div className="mt-2 max-w-sm rounded-xl bg-white/60 px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-[rgb(var(--line)/0.12)]">
                  {getTimerActionLabel(activeLog)}: {activeTimerReason}
                </div>
              ) : null}
            </div>
            <Badge tone={timerStatusTone}>
              {timerExpired ? 'Expired' : isPausedTask ? 'Paused' : isThisTaskActive ? 'Running' : task.timerStatus || 'Not started'}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3">
          <MetaItem icon={Clock3} label="Budget" value={task.estimatedDurationMinutes ? formatDuration(Number(task.estimatedDurationMinutes) * 60) : 'No timer budget'} />
          <MetaItem icon={Clock3} label="Started" value={formatDateTime(task.timerStartedAt)} />
          <MetaItem icon={Clock3} label="Expires" value={formatDateTime(task.timerExpiresAt)} />
          <MetaItem icon={Clock3} label="Remaining" value={task.timerExpiresAt ? (timerExpired ? 'Expired' : formatDuration(Math.max(0, remainingSeconds || 0))) : '-'} />
          <MetaItem icon={Clock3} label="Logged" value={task.totalTimeLogged ? formatDuration(task.totalTimeLogged) : '-'} />
          <MetaItem icon={Clock3} label="Extra Granted" value={task.extraTimeMinutesGranted ? `${task.extraTimeMinutesGranted} minutes` : '-'} />
        </div>

        {task.status !== 'done' ? (
          <div className="flex flex-wrap gap-2 border-t border-[rgb(var(--line)/0.16)] pt-4">
            {isThisTaskActive ? (
              <>
                <Button variant="secondary" onClick={() => setTimerAction('pause')}>
                  <PauseCircle className="h-4 w-4" />
                  Pause
                </Button>
                <Button variant="danger" onClick={() => setTimerAction('stop')}>
                  <StopCircle className="h-4 w-4" />
                  Stop
                </Button>
                {isBudgeted ? (
                  <Button onClick={onComplete}>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Task
                  </Button>
                ) : null}
              </>
            ) : isPausedTask && canStart ? (
              <Button onClick={handleResume}>
                <PlayCircle className="h-4 w-4" />
                Resume Timer
                <span className="rounded-full bg-blue-400/20 px-2 py-0.5 text-[10px]">{formatDuration(remainingBudgetSeconds)}</span>
              </Button>
            ) : isAnotherTaskActive && canStart && !timerExpired ? (
              <Button variant="secondary" onClick={() => setTimerAction('switch')}>
                <Shuffle className="h-4 w-4" />
                Switch to this task
              </Button>
            ) : canStart && !timerExpired ? (
              <Button onClick={handleStart}>
                <PlayCircle className="h-4 w-4" />
                Start Timer
              </Button>
            ) : null}
            {timerExpired && canStart ? (
              <Button variant="danger" disabled={Boolean(task.pendingTimeExtensionRequest)} onClick={() => setRequestOpen((current) => !current)}>
                {task.pendingTimeExtensionRequest ? 'Extra Time Pending' : 'Request Extra Time'}
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.84)] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Timer Activity</div>
            <Badge tone="slate">{timerLogs.length}</Badge>
          </div>
          <div className="scrollbar-none mt-3 max-h-[18rem] space-y-2 overflow-y-auto pr-1">
            {timerLogs.length ? (
              timerLogs.map((log) => {
                const actionLabel = getTimerActionLabel(log);
                const reasonText = getTimerReason(log);
                return (
                  <div key={log.id || log._id} className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel-2)/0.72)] px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <Badge tone={getTimerActionTone(log)}>{actionLabel}</Badge>
                      <span className="text-slate-500">{formatDateTime(log.startTime || log.date || log.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-semibold text-[rgb(var(--text))]">{formatDuration(log.duration || 0)}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Reason</span>
                    </div>
                    <div className="mt-1 break-words rounded-xl bg-[rgb(var(--panel)/0.74)] px-3 py-2 text-slate-600">
                      {reasonText ? `${actionLabel}: ${reasonText}` : `${actionLabel}: No reason/comment recorded`}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.14)] px-3 py-4 text-sm text-slate-500">
                No timer activity recorded for this task yet.
              </div>
            )}
          </div>
        </div>

        {requestOpen && !task.pendingTimeExtensionRequest ? (
          <div className="grid gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3">
            <input className="input" type="number" min="1" value={requestedMinutes} onChange={(event) => setRequestedMinutes(event.target.value)} placeholder="Minutes" />
            <textarea className="input min-h-[96px]" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Valid reason for extra time" />
            <Button
              variant="danger"
              disabled={!reason.trim() || !Number(requestedMinutes)}
              onClick={async () => {
                await requestExtension.mutateAsync({ id: task.id, payload: { requestedMinutes: Number(requestedMinutes), reason } });
                setReason('');
                setRequestOpen(false);
              }}
            >
              Submit Request
            </Button>
          </div>
        ) : null}

        {task.latestTimeExtensionRequest ? (
          <DetailBlock
            label="Latest Extra-Time Request"
            value={`${task.latestTimeExtensionRequest.status} | ${task.latestTimeExtensionRequest.requestedMinutes} minutes | ${task.latestTimeExtensionRequest.reason}`}
          />
        ) : null}
      </CardBody>
      {activeAction ? (
        <ModalShell title={activeAction.title} description={activeAction.description} onClose={() => { setTimerAction(null); setTimerReason(''); }} widthClassName="max-w-lg">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{activeAction.label}</span>
              <textarea
                className="input min-h-[120px]"
                value={timerReason}
                onChange={(event) => setTimerReason(event.target.value)}
                placeholder={activeAction.placeholder}
                autoFocus
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setTimerAction(null); setTimerReason(''); }}>Cancel</Button>
              <Button variant={timerAction === 'stop' ? 'danger' : 'primary'} disabled={!timerReason.trim()} onClick={handleTimerReasonSubmit}>
                {activeAction.submitLabel}
              </Button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </Card>
  );
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd MMM yyyy');
}

function formatDateTime(value) {
  if (!value) return '-';
  return formatIndiaDateTime(value);
}
