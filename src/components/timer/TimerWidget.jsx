import { useMemo, useState } from 'react';
import { Clock3, PauseCircle, PlayCircle, RefreshCw, Shuffle } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useMyTasks } from '../../hooks/useTasks';
import { useTimer } from '../../hooks/useTimer';
import { formatDuration } from '../../store/timerStore';
import { ModalShell } from '../shared/ModalShell';
import { Button } from '../ui/button';

export function TimerWidget() {
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
  const taskLabel = isRunning ? `${activeLog?.task?.title || 'Tracking task'} · ${activeLog?.project?.projectName || 'Project'}` : 'Ready to start';
  const warningLabel = warningLevel === 3 ? '2h+' : warningLevel === 2 ? '1h+' : warningLevel === 1 ? '30m+' : '';

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <Button
          type="button"
          variant={isRunning ? 'danger' : 'secondary'}
          size="sm"
          className="h-10 w-10 rounded-xl px-0"
          onClick={() => (isRunning ? stopTimer() : setSelectorOpen(true))}
          aria-label={isRunning ? 'Stop timer' : 'Start timer'}
          title={isRunning ? 'Stop timer' : 'Start timer'}
        >
          {isRunning ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
        </Button>
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
      </div>

      <div className="hidden w-full max-w-[440px] items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] px-3 py-2 shadow-sm backdrop-blur md:inline-flex">
        <div className={`h-3 w-3 shrink-0 rounded-full ${isRunning ? 'bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]' : 'bg-slate-500'}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            Timer
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-[rgb(var(--text))]">{runningLabel}</div>
          <div className="truncate text-[11px] text-slate-400">{taskLabel}</div>
          {warningLabel ? (
            <div className="mt-1 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/20">
              {warningLabel} warning
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isRunning ? (
            <Button size="sm" variant="danger" onClick={() => stopTimer()}>
              <PauseCircle className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={() => setSelectorOpen(true)}>
              <PlayCircle className="h-4 w-4" />
              Start
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setSelectorOpen(true)}>
            <Shuffle className="h-4 w-4" />
            Switch
          </Button>
          <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectorOpen ? (
        <ModalShell title="Start Timer" description="Pick a project and task." onClose={() => setSelectorOpen(false)} widthClassName="max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Project</span>
              <select className="input" value={projectId} onChange={(event) => { setProjectId(event.target.value); setTaskId(''); }}>
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.projectName}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Task</span>
              <select className="input" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
                <option value="">Optional task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </label>
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
