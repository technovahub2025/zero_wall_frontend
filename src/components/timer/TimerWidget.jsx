import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Clock3, PauseCircle, PlayCircle, RefreshCw, Shuffle } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useMyTasks } from '../../hooks/useTasks';
import { useTimer } from '../../hooks/useTimer';
import { formatDuration } from '../../store/timerStore';
import { ModalShell } from '../shared/ModalShell';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';

function TimerWidgetComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeLog, isRunning, elapsedSeconds, warningLevel, startTimer, stopTimer } = useTimer();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [projectId, setProjectId] = useState(activeLog?.project?.id || activeLog?.project?._id || '');
  const [taskId, setTaskId] = useState(activeLog?.task?.id || activeLog?.task?._id || '');
  const [note, setNote] = useState('');
  const projectsQuery = useProjects();
  const tasksQuery = useMyTasks();
  const projects = projectsQuery.data || [];
  const tasks = useMemo(() => {
    if (!projectId) return tasksQuery.data || [];
    return (tasksQuery.data || []).filter((task) => String(task.projectId || task.project?.id || task.project?._id || task.project) === String(projectId));
  }, [tasksQuery.data, projectId]);

  const runningLabel = isRunning ? formatDuration(elapsedSeconds) : 'No timer running';
  const activeTask = activeLog?.task || null;
  const isBudgetedTask = Number(activeTask?.estimatedDurationMinutes || 0) > 0;
  const remainingSeconds = activeTask?.timerExpiresAt
    ? Math.floor((new Date(activeTask.timerExpiresAt).getTime() - Date.now()) / 1000)
    : null;
  const timerExpired = isBudgetedTask && remainingSeconds !== null && remainingSeconds <= 0;
  const displayLabel = isBudgetedTask && remainingSeconds !== null
    ? timerExpired
      ? 'Expired'
      : `${formatDuration(Math.max(0, remainingSeconds))} left`
    : runningLabel;
  const taskLabel = isRunning ? `${activeLog?.task?.title || 'Tracking task'} - ${activeLog?.project?.projectName || 'Project'}` : 'Ready to start';
  const warningLabel = warningLevel === 3 ? '2h+' : warningLevel === 2 ? '1h+' : warningLevel === 1 ? '30m+' : '';
  const canSwitchExpiredBudgetedTask = isRunning && isBudgetedTask && timerExpired;

  useEffect(() => {
    setProjectId(activeLog?.project?.id || activeLog?.project?._id || '');
    setTaskId(activeLog?.task?.id || activeLog?.task?._id || '');
  }, [activeLog?.id, activeLog?.project?.id, activeLog?.project?._id, activeLog?.task?.id, activeLog?.task?._id]);

  function handleCardClick() {
    navigate('/my-timesheets');
  }

  function handleCardKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate('/my-timesheets');
    }
  }

  function stopCardClick(event, action) {
    event.stopPropagation();
    action();
  }

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <Button
          type="button"
          variant={isRunning && !isBudgetedTask ? 'danger' : 'secondary'}
          size="sm"
          className="h-10 w-10 rounded-xl px-0"
          onClick={() => {
            if (canSwitchExpiredBudgetedTask) {
              setSelectorOpen(true);
              return;
            }
            if (isRunning && isBudgetedTask) return;
            if (isRunning) stopTimer();
            else setSelectorOpen(true);
          }}
          aria-label={canSwitchExpiredBudgetedTask ? 'Switch task' : isRunning && isBudgetedTask ? 'Locked task timer' : isRunning ? 'Stop timer' : 'Start timer'}
          title={canSwitchExpiredBudgetedTask ? 'Switch task' : isRunning && isBudgetedTask ? 'Locked task timer' : isRunning ? 'Stop timer' : 'Start timer'}
        >
          {canSwitchExpiredBudgetedTask ? <Shuffle className="h-4 w-4" /> : isRunning && isBudgetedTask ? <Clock3 className="h-4 w-4" /> : isRunning ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
        </Button>
        {!isBudgetedTask ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-10 w-10 rounded-xl px-0"
            onClick={() => setSelectorOpen(true)}
            aria-label="Open timer selector"
            title="Open timer selector"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div
        role="link"
        tabIndex={0}
        aria-label="Open my timesheets"
        className="hidden w-full max-w-[440px] items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] px-3 py-2 shadow-sm backdrop-blur transition hover:border-[rgb(var(--line)/0.26)] hover:bg-[rgb(var(--panel-2)/0.94)] md:inline-flex"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        <div className={`h-3 w-3 shrink-0 rounded-full ${isRunning ? 'bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]' : 'bg-slate-500'}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            Timer
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-[rgb(var(--text))]">{displayLabel}</div>
          <div className="truncate text-[11px] text-slate-400">{taskLabel}</div>
          {isBudgetedTask ? (
            <div
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                timerExpired
                  ? 'bg-rose-500/15 text-rose-300 ring-rose-400/20'
                  : 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20'
              }`}
            >
              Locked task timer
            </div>
          ) : null}
          {warningLabel ? (
            <div className="mt-1 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/20">
              {warningLabel} warning
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isRunning && !isBudgetedTask ? (
            <Button size="sm" variant="danger" onClick={(event) => stopCardClick(event, () => stopTimer())}>
              <PauseCircle className="h-4 w-4" />
              Stop
            </Button>
          ) : canSwitchExpiredBudgetedTask ? (
            <Button size="sm" variant="secondary" onClick={(event) => stopCardClick(event, () => setSelectorOpen(true))}>
              <Shuffle className="h-4 w-4" />
              Switch
            </Button>
          ) : !isRunning ? (
            <Button size="sm" onClick={(event) => stopCardClick(event, () => setSelectorOpen(true))}>
              <PlayCircle className="h-4 w-4" />
              Start
            </Button>
          ) : null}
          {!isBudgetedTask ? (
            <Button size="sm" variant="secondary" onClick={(event) => stopCardClick(event, () => setSelectorOpen(true))}>
              <Shuffle className="h-4 w-4" />
              Switch
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={(event) => stopCardClick(event, () => queryClient.invalidateQueries({ queryKey: ['timer-active'] }))}
            aria-label="Refresh timer"
            title="Refresh timer"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectorOpen ? (
        <ModalShell title="Start Timer" description="Pick a project and task." onClose={() => setSelectorOpen(false)} widthClassName="max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <DropdownField
              label="Project"
              value={projectId}
              onChange={(nextValue) => {
                setProjectId(nextValue);
                setTaskId('');
              }}
              options={projects.map((project) => ({
                value: project.id,
                label: project.projectName,
              }))}
              placeholder="Select project"
            />
            <DropdownField
              label="Task"
              value={taskId}
              onChange={(nextValue) => setTaskId(nextValue)}
              options={tasks.map((task) => ({
                value: task.id,
                label: task.title,
              }))}
              placeholder="Optional task"
            />
            <div className="sm:col-span-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Note</span>
                <textarea className="input min-h-[96px]" value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
              <Button variant="secondary" onClick={() => setSelectorOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  await startTimer(taskId || undefined, projectId, undefined, note);
                  setSelectorOpen(false);
                }}
                disabled={!projectId}
              >
                Start Timer
              </Button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}

export const TimerWidget = memo(TimerWidgetComponent);
