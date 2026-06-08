import { Card, CardBody } from '../ui/card';
import { TaskCountdown } from './TaskCountdown';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskStatusBadge } from './TaskStatusBadge';
import { CalendarDays, Clock3, FolderKanban, PauseCircle, PlayCircle, UserRound, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTimer } from '../../hooks/useTimer';
import { Badge } from '../ui/badge';
import { formatDuration } from '../../store/timerStore';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';

export function TaskCard({ task, onClick, showProject = false, selected = false, compact = false }) {
  const user = useAuthStore((state) => state.user);
  const { isRunning, activeLog, elapsedSeconds, startTimer, stopTimer } = useTimer();
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

  return (
    <Card
      className={cn(
        'cursor-pointer overflow-hidden transition',
        selected
          ? 'border-sky-400/40 bg-sky-500/5 ring-1 ring-sky-400/20 shadow-lg shadow-sky-400/10'
          : 'border-white/10 bg-white/75 hover:-translate-y-[1px] hover:border-sky-200/40 hover:shadow-md',
        compact ? 'shadow-sm' : '',
      )}
      onClick={onClick}
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
        </div>
        {task.status !== 'done' ? (
          <div className="mt-4 flex items-center gap-2">
            {isThisTaskActive ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/20"
                onClick={(event) => {
                  event.stopPropagation();
                  stopTimer();
                }}
              >
                <PauseCircle className="h-4 w-4" />
                Stop
                <span className="rounded-full bg-rose-400/20 px-2 py-0.5 text-[10px]">{formatDuration(elapsedSeconds)}</span>
              </button>
            ) : canStart ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/20"
                onClick={(event) => {
                  event.stopPropagation();
                  startTimer(taskId, projectId, stageId, '');
                }}
              >
                <PlayCircle className="h-4 w-4" />
                Start Timer
              </button>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

function formatTaskDate(dateValue) {
  if (!dateValue) return 'No due date';
  const parsed = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'No due date';
  return format(parsed, 'dd MMM yyyy');
}
