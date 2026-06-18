import { memo, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Clock3, PauseCircle, PlayCircle, RefreshCw, Shuffle, Square } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useMyTasks } from '../../hooks/useTasks';
import { useTimer } from '../../hooks/useTimer';
import { formatDuration } from '../../store/timerStore';
import { ModalShell } from '../shared/ModalShell';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';

const ACTION_CONFIG = {
  pause: {
    label: 'Pause',
    title: 'Pause timer',
    description: 'Add a reason before pausing the current timer.',
    reasonLabel: 'Pause reason',
    reasonPlaceholder: 'Why are you pausing this timer?',
    submitLabel: 'Pause Timer',
    icon: PauseCircle,
    variant: 'secondary',
  },
  stop: {
    label: 'Stop',
    title: 'Stop timer',
    description: 'Add a reason before stopping and finalizing the current timer.',
    reasonLabel: 'Stop reason',
    reasonPlaceholder: 'Why are you stopping this timer?',
    submitLabel: 'Stop Timer',
    icon: Square,
    variant: 'danger',
  },
  switch: {
    label: 'Switch',
    title: 'Switch timer',
    description: 'Choose the next task and add the reason for switching.',
    reasonLabel: 'Switch reason',
    reasonPlaceholder: 'Why are you switching away from the current task?',
    submitLabel: 'Pause and Switch',
    icon: Shuffle,
    variant: 'secondary',
    requiresTask: true,
  },
  start: {
    label: 'Play',
    title: 'Select task',
    description: 'Choose a project and optional task to start tracking.',
    submitLabel: 'Start Timer',
    icon: PlayCircle,
    variant: 'primary',
  },
  resume: {
    label: 'Resume',
    title: 'Resume paused task',
    description: 'Pick a paused task and continue from the remaining budget.',
    submitLabel: 'Resume Timer',
    icon: PlayCircle,
    variant: 'secondary',
  },
};

function getRecordProjectId(record) {
  return record?.project?.id || record?.project?._id || record?.project || record?.projectId || '';
}

function getRecordTaskId(record) {
  return record?.task?.id || record?.task?._id || record?.task || record?.taskId || '';
}

function getRecordStageId(record) {
  return record?.stage?.id || record?.stage?._id || record?.stage || record?.stageId || '';
}

function TimerWidgetComponent() {
  const queryClient = useQueryClient();
  const {
    activeLog,
    isRunning,
    elapsedSeconds,
    warningLevel,
    pausedTasks,
    startTimer,
    switchTimer,
    resumeTimer,
    pauseTimer,
    stopTimer,
  } = useTimer();

  const [flowMode, setFlowMode] = useState(null);
  const [projectId, setProjectId] = useState(getRecordProjectId(activeLog));
  const [taskId, setTaskId] = useState(getRecordTaskId(activeLog));
  const [resumeTaskId, setResumeTaskId] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const projectsQuery = useProjects();
  const tasksQuery = useMyTasks();
  const projects = projectsQuery.data || [];
  const pausedTaskList = pausedTasks || [];
  const selectedResumeTask = pausedTaskList.find((task) => String(task.id) === String(resumeTaskId)) || pausedTaskList[0] || null;

  const tasks = useMemo(() => {
    const baseTasks = tasksQuery.data || [];
    if (!projectId) return baseTasks;
    return baseTasks.filter((task) => String(task.projectId || task.project?.id || task.project?._id || task.project) === String(projectId));
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
  const warningLabel = warningLevel === 3 ? '2h+' : warningLevel === 2 ? '1h+' : warningLevel === 1 ? '30m+' : '';
  const pausedCount = pausedTaskList.length;
  const taskLabel = isRunning
    ? `${activeLog?.task?.title || 'Tracking task'} - ${activeLog?.project?.projectName || 'Project'}`
    : pausedCount
      ? 'Paused tasks ready to resume'
      : 'Ready to start';
  const activeConfig = ACTION_CONFIG[flowMode];
  const isReasonFlow = ['pause', 'stop', 'switch'].includes(flowMode);
  const canSubmit =
    flowMode === 'start'
      ? Boolean(projectId)
      : flowMode === 'resume'
        ? Boolean(selectedResumeTask)
        : flowMode === 'switch'
          ? Boolean(projectId && taskId && reason.trim())
          : isReasonFlow
            ? Boolean(reason.trim())
            : false;

  useEffect(() => {
    setProjectId(getRecordProjectId(activeLog));
    setTaskId(getRecordTaskId(activeLog));
  }, [activeLog?.id, activeLog?.project?.id, activeLog?.project?._id, activeLog?.task?.id, activeLog?.task?._id]);

  useEffect(() => {
    if (!projectId) return;
    const availableTask = tasks.find((task) => String(task.id) === String(taskId));
    if (!availableTask) {
      setTaskId('');
    }
  }, [projectId, tasks, taskId]);

  useEffect(() => {
    if (flowMode !== 'resume') return;
    setResumeTaskId((current) => current || pausedTaskList[0]?.id || '');
  }, [flowMode, pausedTaskList]);

  function stopCardClick(event, action) {
    event.stopPropagation();
    action();
  }

  function openFlow(mode) {
    setFlowMode(mode);
    setReason('');
    setNote('');

    if (mode === 'switch') {
      setProjectId(getRecordProjectId(activeLog));
      setTaskId('');
      return;
    }

    if (mode === 'start') {
      setProjectId('');
      setTaskId('');
      return;
    }

    if (mode === 'resume') {
      setResumeTaskId(pausedTaskList[0]?.id || '');
    }
  }

  function closeFlow() {
    setFlowMode(null);
    setReason('');
    setNote('');
  }

  async function submitFlow() {
    if (!canSubmit) return;

    try {
      if (flowMode === 'start') {
        await startTimer(taskId || undefined, projectId || undefined, undefined, note);
      } else if (flowMode === 'resume' && selectedResumeTask) {
        await resumeTimer(
          selectedResumeTask.id,
          getRecordProjectId(selectedResumeTask) || undefined,
          getRecordStageId(selectedResumeTask) || undefined,
          '',
          { suppressToast: false },
        );
      } else if (flowMode === 'pause') {
        await pauseTimer(reason);
      } else if (flowMode === 'stop') {
        await stopTimer({ reason });
      } else if (flowMode === 'switch') {
        await switchTimer(taskId || undefined, projectId || undefined, undefined, reason);
      }
      closeFlow();
    } catch {
      // Keep the dialog open so the user can correct the selection or retry.
    }
  }

  function renderIconAction(mode, extraClassName = '') {
    const config = ACTION_CONFIG[mode];
    const Icon = config.icon;
    return (
      <Button
        key={mode}
        type="button"
        variant={config.variant}
        size="sm"
        className={extraClassName}
        onClick={() => openFlow(mode)}
        aria-label={config.label}
        title={config.label}
      >
        <Icon className="h-4 w-4" />
        <span className="hidden lg:inline">{config.label}</span>
      </Button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        {isRunning ? (
          <>
            {['pause', 'stop', 'switch'].map((mode) => renderIconAction(mode, 'h-10 w-10 rounded-xl px-0'))}
          </>
        ) : (
          <>
            {renderIconAction('start', 'h-10 w-10 rounded-xl px-0')}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 w-10 rounded-xl px-0"
              onClick={() => openFlow(pausedCount ? 'resume' : 'start')}
              aria-label="Select task"
              title="Select task"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 w-10 rounded-xl px-0"
          onClick={(event) => stopCardClick(event, () => queryClient.invalidateQueries({ queryKey: ['timer-active'] }))}
          aria-label="Refresh timer"
          title="Refresh timer"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="hidden w-full max-w-[520px] items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] px-3 py-2 shadow-sm backdrop-blur md:inline-flex">
        <div className={`h-3 w-3 shrink-0 rounded-full ${isRunning ? 'bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]' : pausedCount ? 'bg-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.12)]' : 'bg-slate-500'}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            Timer
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-[rgb(var(--text))]">{displayLabel}</div>
          <div className="truncate text-[11px] text-slate-400">{taskLabel}</div>
          {isBudgetedTask || isRunning ? (
            <div
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                timerExpired
                  ? 'bg-rose-500/15 text-rose-500 ring-rose-400/20'
                  : isRunning
                    ? 'bg-emerald-500/15 text-emerald-600 ring-emerald-400/20'
                    : 'bg-amber-500/15 text-amber-700 ring-amber-400/20'
              }`}
            >
              {timerExpired ? 'Expired' : isRunning ? 'Running' : 'Paused'}
            </div>
          ) : null}
          {warningLabel ? (
            <div className="mt-1 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-400/20">
              {warningLabel} warning
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isRunning ? (
            <>
              {['pause', 'stop', 'switch'].map((mode) => renderIconAction(mode))}
            </>
          ) : (
            <>
              {renderIconAction('start')}
              <Button size="sm" variant="secondary" onClick={(event) => stopCardClick(event, () => openFlow(pausedCount ? 'resume' : 'start'))}>
                <Shuffle className="h-4 w-4" />
                Select
              </Button>
            </>
          )}
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

      {flowMode ? (
        <ModalShell title={activeConfig.title} description={activeConfig.description} onClose={closeFlow} widthClassName="max-w-3xl">
          {flowMode === 'resume' ? (
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-3">
                {pausedTaskList.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      String(resumeTaskId) === String(task.id)
                        ? 'border-sky-400/40 bg-sky-500/10'
                        : 'border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel-2)/0.65)] hover:border-[rgb(var(--line)/0.24)]'
                    }`}
                    onClick={() => setResumeTaskId(task.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[rgb(var(--text))]">{task.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{task.projectName || 'No project'}{task.stageName ? ` - ${task.stageName}` : ''}</div>
                      </div>
                      <div className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-700">
                        {formatDuration(Math.max(0, Number(task.remainingSeconds || 0)))} left
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-4 rounded-3xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel-2)/0.6)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resume summary</div>
                {selectedResumeTask ? (
                  <div className="space-y-2">
                    <div className="text-base font-semibold text-[rgb(var(--text))]">{selectedResumeTask.title}</div>
                    <div className="text-sm text-slate-500">{selectedResumeTask.projectName || 'No project'}</div>
                    <div className="text-sm text-slate-500">Remaining: {formatDuration(Math.max(0, Number(selectedResumeTask.remainingSeconds || 0)))}</div>
                    <div className="text-sm text-slate-500">Paused: {selectedResumeTask.timerPausedAt ? new Date(selectedResumeTask.timerPausedAt).toLocaleString() : 'Recently'}</div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No paused tasks available.</div>
                )}
                <TimerModalActions onCancel={closeFlow} onSubmit={submitFlow} disabled={!canSubmit} label={activeConfig.submitLabel} />
              </div>
            </div>
          ) : flowMode === 'start' ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-4 rounded-3xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel-2)/0.6)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Timer selection</div>
                <div className="text-sm text-slate-500">Choose the project and task to track.</div>
              </div>

              <div className="grid gap-4">
                <TimerTaskFields
                  projectId={projectId}
                  taskId={taskId}
                  projects={projects}
                  tasks={tasks}
                  taskPlaceholder="Optional task"
                  onProjectChange={(nextValue) => {
                    setProjectId(nextValue);
                    setTaskId('');
                  }}
                  onTaskChange={setTaskId}
                />
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Note</span>
                  <textarea
                    className="input min-h-[96px]"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Optional context for the timer log"
                  />
                </label>
                <TimerModalActions onCancel={closeFlow} onSubmit={submitFlow} disabled={!canSubmit} label={activeConfig.submitLabel} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4 rounded-3xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel-2)/0.6)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current timer</div>
                <div className="space-y-2">
                  <div className="text-base font-semibold text-[rgb(var(--text))]">{activeTask?.title || 'Active task'}</div>
                  <div className="text-sm text-slate-500">{activeLog?.project?.projectName || 'Project'}</div>
                  <div className="text-sm text-slate-500">Elapsed: {runningLabel}</div>
                </div>
              </div>

              <div className="grid gap-4">
                {activeConfig.requiresTask ? (
                  <TimerTaskFields
                    projectId={projectId}
                    taskId={taskId}
                    projects={projects}
                    tasks={tasks}
                    taskPlaceholder="Select task"
                    onProjectChange={(nextValue) => {
                      setProjectId(nextValue);
                      setTaskId('');
                    }}
                    onTaskChange={setTaskId}
                  />
                ) : null}
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{activeConfig.reasonLabel}</span>
                  <textarea
                    className="input min-h-[96px]"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={activeConfig.reasonPlaceholder}
                  />
                </label>
                <TimerModalActions onCancel={closeFlow} onSubmit={submitFlow} disabled={!canSubmit} label={activeConfig.submitLabel} />
              </div>
            </div>
          )}
        </ModalShell>
      ) : null}
    </>
  );
}

function TimerTaskFields({ projectId, taskId, projects, tasks, taskPlaceholder, onProjectChange, onTaskChange }) {
  return (
    <>
      <DropdownField
        label="Project"
        value={projectId}
        onChange={onProjectChange}
        options={projects.map((project) => ({
          value: project.id,
          label: project.projectName,
        }))}
        placeholder="Select project"
      />
      <DropdownField
        label="Task"
        value={taskId}
        onChange={onTaskChange}
        options={tasks.map((task) => ({
          value: task.id,
          label: task.title,
        }))}
        placeholder={taskPlaceholder}
      />
    </>
  );
}

function TimerModalActions({ onCancel, onSubmit, disabled, label }) {
  return (
    <div className="flex justify-end gap-3 border-t border-[rgb(var(--line)/0.12)] pt-4">
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button disabled={disabled} onClick={onSubmit}>
        {label}
      </Button>
    </div>
  );
}

export const TimerWidget = memo(TimerWidgetComponent);
