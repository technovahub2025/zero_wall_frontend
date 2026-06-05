import { useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { AlertCircle, Clock3, ListTodo, Search } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { useUpdateTask } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';
import { FilterChips } from '../shared/FilterChips';
import { cn } from '../../lib/utils';

const BOARD_COLUMNS = [
  { id: 'todo', title: 'Todo', color: '#94a3b8' },
  { id: 'in-progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'review', title: 'Review', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#22c55e' },
];

export function MyTasksKanbanBoard({ tasks = [] }) {
  const user = useAuthStore((state) => state.user);
  const updateTask = useUpdateTask();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [localTasks, setLocalTasks] = useState(tasks);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('all');

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return localTasks.filter((task) => {
      if (scope === 'overdue' && !(task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== 'done')) return false;
      if (scope === 'critical' && String(task.priority).toLowerCase() !== 'critical') return false;
      if (!needle) return true;
      const haystack = [
        task.title,
        task.description,
        task.projectName,
        task.projectClient,
        task.assigneeName,
        task.projectStage,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [localTasks, scope, search]);

  const groupedTasks = useMemo(
    () =>
      filteredTasks.reduce((acc, task) => {
        const key = task.status || 'todo';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {}),
    [filteredTasks],
  );

  const stats = useMemo(() => {
    const open = filteredTasks.filter((task) => task.status !== 'done');
    return {
      total: filteredTasks.length,
      open: open.length,
      overdue: open.filter((task) => task.dueDate && new Date(task.dueDate).getTime() < Date.now()).length,
      critical: filteredTasks.filter((task) => String(task.priority).toLowerCase() === 'critical').length,
    };
  }, [filteredTasks]);

  async function handleDragEnd(event) {
    const task = event.active.data.current?.task;
    const targetStatus = event.over?.id;
    if (!task || !targetStatus || task.status === targetStatus) return;

    const snapshot = localTasks;
    setLocalTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: targetStatus } : item)));

    try {
      await updateTask.mutateAsync({ id: task.id, payload: { status: targetStatus, project: task.projectId || task.project?.id || task.project } });
    } catch {
      setLocalTasks(snapshot);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[280px] flex-1 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-white/80 px-3 py-2 text-sm text-slate-500">
            <Search className="mr-2 inline h-4 w-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your tasks..."
              className="w-[calc(100%-20px)] bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
          <FilterChips
            value={scope}
            onChange={setScope}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Critical', value: 'critical' },
              { label: 'Overdue', value: 'overdue' },
            ]}
          />
          <div className="ml-auto flex flex-wrap gap-2">
            <MiniStat label="Tasks" value={stats.total} icon={ListTodo} />
            <MiniStat label="Open" value={stats.open} icon={Clock3} />
            <MiniStat label="Overdue" value={stats.overdue} icon={AlertCircle} tone="rose" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-600 ring-1 ring-sky-200/70">
            {user?.name || 'My tasks'}
          </span>
          <span className="text-xs text-slate-500">
            Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto overflow-y-hidden pb-2">
          <div className="flex min-w-max gap-4 px-1 pr-4">
            {BOARD_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                tasks={groupedTasks[column.id] || []}
                count={(groupedTasks[column.id] || []).length}
              />
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, tone = 'blue' }) {
  const toneMap = {
    blue: 'border-sky-200 bg-sky-50/80 text-sky-600',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-600',
    rose: 'border-rose-200 bg-rose-50/80 text-rose-600',
  };

  return (
    <div className={cn('rounded-2xl border px-3 py-2 shadow-sm', toneMap[tone] || toneMap.blue)}>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">{value}</div>
    </div>
  );
}
