import { Card, CardBody } from '../ui/card';
import { TaskCountdown } from './TaskCountdown';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskStatusBadge } from './TaskStatusBadge';
import { CalendarDays, Clock3, FolderKanban, PauseCircle, PlayCircle, UserRound, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../../hooks/useTimer';
import { useRequestTaskTimeExtension, useUpdateTask } from '../../hooks/useTasks';
import { Badge } from '../ui/badge';
import { formatDuration } from '../../store/timerStore';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';

export const TaskCard = memo(function TaskCard({ task, onClick, showProject = false, selected = false, compact = false }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isRunning, activeLog, elapsedSeconds, startTimer, stopTimer, resumeTimer } = useTimer();
  const updateTask = useUpdateTask();
  const requestExtension = useRequestTaskTimeExtension();
  const [now, setNow] = useState(Date.now());
  const [requestOpen, setRequestOpen] = useState(false);
  const [stopReasonOpen, setStopReasonOpen] = useState(false);
  const [requestedMinutes, setRequestedMinutes] = useState(30);
  const [reason, setReason] = useState('');
  const [stopReason, setStopReason] = useState('');
  const taskId = task.id || task._id;
  const projectId = task.project?.id || task.project?._id || task.projectId || task.project;
  const stageId = task.stage?.id || task.stage?._id || task.stageId || task.stage;
  const assigneeId = task.assignee?._id || task.assignee?.id || task.assignee;
  const teamIds = Array.isArray(task.assignedTeam) ? task.assignedTeam.map((member) => member?._id || member?.id || member) : [];
  const taskTeamMemberIds = Array.isArray(task.teamMembers) ? task.teamMembers.map((member) => member?._id || member?.id || member) : [];
  const reporterId = task.reporter?._id || task.reporter?.id || task.reporter || task.createdBy?._id || task.createdBy?.id || task.createdBy;
  const canStart =
    ['superadmin', 'admin'].includes(user?.role) ||
    String(assigneeId) === String(user?.id) ||
    String(reporterId) === String(user?.id) ||
    teamIds.some((memberId) => String(memberId) === String(user?.id)) ||
    taskTeamMemberIds.some((memberId) => String(memberId) === String(user?.id));
  const isThisTaskActive = isRunning && String(activeLog?.task?.id || activeLog?.task?._id || activeLog?.task) === String(taskId);
  const isBudgeted = Number(task.estimatedDurationMinutes || 0) > 0;
  const totalBudgetSeconds = (Number(task.estimatedDurationMinutes || 0) + Number(task.extraTimeMinutesGranted || 0)) * 60;
  const timerExpiresAt = task.timerExpiresAt ? new Date(task.timerExpiresAt).getTime() : null;
  const remainingSeconds = timerExpiresAt ? Math.floor((timerExpiresAt - now) / 1000) : null;
  const remainingBudgetSeconds = Math.max(0, totalBudgetSeconds - Number(task.totalTimeLogged || 0));
  const isPausedTask = task.timerStatus === 'paused';
  const timerExpired =
    (isBudgeted && task.timerStatus === 'expired') ||
    (isBudgeted && timerExpiresAt && remainingSeconds <= 0 && task.status !== 'done' && !isPausedTask);
  const pendingRequest = task.pendingTimeExtensionRequest;
  const latestRequest = task.latestTimeExtensionRequest;
  const assigneeName = task.assignee?.name || task.assigneeName || 'Unassigned';
  const reporterName = task.reporter?.name || task.reporterName || task.createdBy?.name || 'Unknown';
  const teamNames = Array.isArray(task.assignedTeam)
    ? task.assignedTeam
        .map((member) => member?.name || member?.label || '')
        .filter(Boolean)
    : Array.isArray(task.assignedTeamNames)
      ? task.assignedTeamNames
      : [];
  const teamLabel = teamNames.length
    ? `${teamNames.slice(0, 2).join(', ')}${teamNames.length > 2 ? ` +${teamNames.length - 2}` : ''}`
    : 'No team';
  const taskTeamName = task.team?.name || task.teamName || '';
  const dueDateLabel = formatTaskDate(task.dueDate);

  useEffect(() => {
    if (!isBudgeted || !timerExpiresAt || task.status === 'done') return undefined;
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [isBudgeted, task.status, timerExpiresAt]);

  return (
    <Card
      className={cn(
        'cursor-pointer overflow-hidden transition',
        selected
          ? 'border-sky-400/40 bg-sky-500/5 ring-1 ring-sky-400/20 shadow-lg shadow-sky-400/10'
          : 'border-white/10 bg-white/75 hover:-translate-y-[1px] hover:border-sky-200/40 hover:shadow-md',
        compact ? 'shadow-sm' : '',
      )}
      onClick={onClick || (() => navigate(`/tasks/${taskId}`))}
    >
      <CardBody className={cn(compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5')}>
        <div className={cn('flex items-start justify-between gap-3', compact ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_auto]' : '')}>
          <div className="min-w-0 flex-1">
            <div className={cn('font-semibold text-[rgb(var(--text))]', compact ? 'text-[15px]' : 'text-base')}>{task.title}</div>
            <div className={cn('mt-1 text-sm text-slate-400', compact ? 'line-clamp-2 max-w-3xl' : '')}>{task.description}</div>
            <div className={cn('mt-3 flex flex-wrap gap-2', compact ? 'gap-1.5' : 'gap-2')}>
              {showProject ? (
                <Badge tone="slate">
                  <FolderKanban className="h-3.5 w-3.5" />
                  {task.projectName || task.project?.projectName}
                </Badge>
              ) : null}
              <Badge tone="slate">
                <UserRound className="h-3.5 w-3.5" />
                {assigneeName}
              </Badge>
              {taskTeamName ? (
                <Badge tone="blue">
                  <Users className="h-3.5 w-3.5" />
                  {taskTeamName}
                </Badge>
              ) : null}
              <Badge tone="slate">
                <CalendarDays className="h-3.5 w-3.5" />
                {dueDateLabel}
              </Badge>
              <Badge tone="slate">
                <UserRound className="h-3.5 w-3.5" />
                Raised by {reporterName}
              </Badge>
              <Badge tone="slate">
                <Users className="h-3.5 w-3.5" />
                Team {teamLabel}
              </Badge>
            </div>
          </div>
          <div className={cn('flex shrink-0 items-start gap-2', compact ? 'xl:flex-col xl:items-end' : '')}>
            <TaskStatusBadge value={task.status} />
          </div>
        </div>
        <div className={cn('mt-4 flex flex-wrap gap-2', compact ? 'mt-3 items-center' : '')}>
          <TaskPriorityBadge value={task.priority} />
          <TaskCountdown dueDate={task.dueDate} />
          {Number(task.totalTimeLogged || 0) > 0 ? (
            <Badge tone="blue">
              <Clock3 className="h-3.5 w-3.5" />
              {formatDuration(task.totalTimeLogged)}
            </Badge>
          ) : null}
          {isBudgeted ? (
            <Badge tone={timerExpired ? 'rose' : isThisTaskActive ? 'amber' : 'slate'}>
              <Clock3 className="h-3.5 w-3.5" />
              {isPausedTask
                ? `Paused - ${formatDuration(remainingBudgetSeconds)} remaining`
                : timerExpiresAt
                  ? timerExpired
                    ? 'Timer expired'
                    : `${formatDuration(Math.max(0, remainingSeconds || 0))} left`
                  : `${formatDuration(totalBudgetSeconds)} budget`}
            </Badge>
          ) : null}
          {latestRequest ? (
            <Badge tone={latestRequest.status === 'approved' ? 'green' : latestRequest.status === 'rejected' ? 'rose' : 'amber'}>
              Extra time {latestRequest.status}
            </Badge>
          ) : null}
        </div>
        {task.status !== 'done' ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isThisTaskActive ? (
              isBudgeted ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-400/20"
                  onClick={async (event) => {
                    event.stopPropagation();
                    await updateTask.mutateAsync({ id: taskId, payload: { status: 'done', project: projectId } });
                  }}
                >
                  Complete Task
                  <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px]">
                    {timerExpiresAt ? formatDuration(Math.max(0, remainingSeconds || 0)) : formatDuration(elapsedSeconds)}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/20"
                  onClick={(event) => {
                    event.stopPropagation();
                    setStopReasonOpen((current) => !current);
                  }}
                >
                  <PauseCircle className="h-4 w-4" />
                  Stop
                  <span className="rounded-full bg-rose-400/20 px-2 py-0.5 text-[10px]">{formatDuration(elapsedSeconds)}</span>
                </button>
              )
            ) : isPausedTask && canStart ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-700 ring-1 ring-blue-400/20"
                onClick={(event) => {
                  event.stopPropagation();
                  resumeTimer(taskId, projectId, stageId, '');
                }}
              >
                <PlayCircle className="h-4 w-4" />
                Resume Timer
                <span className="rounded-full bg-blue-400/20 px-2 py-0.5 text-[10px]">{formatDuration(remainingBudgetSeconds)}</span>
              </button>
            ) : canStart ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/20"
                onClick={(event) => {
                  event.stopPropagation();
                  startTimer(taskId, projectId, stageId, '');
                }}
                disabled={timerExpired}
              >
                <PlayCircle className="h-4 w-4" />
                Start Timer
              </button>
            ) : null}
            {timerExpired && canStart ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-400/20"
                onClick={(event) => {
                  event.stopPropagation();
                  setRequestOpen((current) => !current);
                }}
                disabled={Boolean(pendingRequest)}
              >
                {pendingRequest ? 'Extra time pending' : 'Request extra time'}
              </button>
            ) : null}
          </div>
        ) : null}
        {stopReasonOpen ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3" onClick={(event) => event.stopPropagation()}>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                className="input h-10"
                value={stopReason}
                onChange={(event) => setStopReason(event.target.value)}
                placeholder="Reason for stopping timer"
              />
              <button
                type="button"
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                disabled={!stopReason.trim()}
                onClick={async () => {
                  await stopTimer({ reason: stopReason });
                  setStopReason('');
                  setStopReasonOpen(false);
                }}
              >
                Stop Timer
              </button>
            </div>
          </div>
        ) : null}
        {requestOpen && !pendingRequest ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3" onClick={(event) => event.stopPropagation()}>
            <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)_auto]">
              <input
                className="input h-10"
                type="number"
                min="1"
                value={requestedMinutes}
                onChange={(event) => setRequestedMinutes(event.target.value)}
                placeholder="Minutes"
              />
              <input
                className="input h-10"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Reason for extra time"
              />
              <button
                type="button"
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                disabled={!reason.trim() || !Number(requestedMinutes)}
                onClick={async () => {
                  await requestExtension.mutateAsync({
                    id: taskId,
                    payload: { requestedMinutes: Number(requestedMinutes), reason },
                  });
                  setReason('');
                  setRequestOpen(false);
                }}
              >
                Send
              </button>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
});

TaskCard.displayName = 'TaskCard';

function formatTaskDate(dateValue) {
  if (!dateValue) return 'No due date';
  const parsed = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'No due date';
  return format(parsed, 'dd MMM yyyy');
}
