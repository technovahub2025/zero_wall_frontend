import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { KanbanColumn } from './KanbanColumn';
import { KanbanAddColumn } from './KanbanAddColumn';
import { useCreateTask, useDeleteTask, useKanbanColumns, useSaveKanbanColumns, useUpdateTask } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';
import { FilterChips } from '../shared/FilterChips';
import { ModalShell } from '../shared/ModalShell';
import { TaskForm } from '../tasks/TaskForm';
import { taskService } from '../../services/taskService';
import { useQueryClient } from '@tanstack/react-query';

const BOARD_COLUMNS = [
  { id: 'todo', title: 'Todo', color: '#94a3b8' },
  { id: 'in-progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'review', title: 'Review', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#22c55e' },
];
const EXTRA_COLUMN_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#10b981'];

export function ProjectKanbanBoard({ project, tasks = [], employees = [], teams = [] }) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const kanbanColumnsQuery = useKanbanColumns('task');
  const saveKanbanColumns = useSaveKanbanColumns();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [localTasks, setLocalTasks] = useState(tasks);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [scope, setScope] = useState('all');
  const [columns, setColumns] = useState(() => BOARD_COLUMNS.map((column) => ({ ...column })));
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnTitle, setColumnTitle] = useState('');
  const canManageColumns = ['superadmin', 'admin', 'project_manager'].includes(user?.role);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    const nextColumns = Array.isArray(kanbanColumnsQuery.data?.columns) && kanbanColumnsQuery.data.columns.length
      ? kanbanColumnsQuery.data.columns
      : BOARD_COLUMNS;
    setColumns(nextColumns.map((column) => ({ ...column })));
  }, [kanbanColumnsQuery.data]);

  const filteredTasks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return localTasks.filter((task) => {
      if (priority !== 'all' && String(task.priority).toLowerCase() !== priority) return false;
      if (scope === 'mine' && String(task.assignee?._id || task.assignee || '') !== String(user?.id)) return false;
      if (scope === 'critical' && String(task.priority).toLowerCase() !== 'critical') return false;
      if (scope === 'overdue' && !(task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== 'done')) return false;
      if (!needle) return true;
      const haystack = [
        task.title,
        task.description,
        task.projectName,
        task.projectClient,
        task.teamName,
        task.assigneeName,
        task.reporterName,
        ...(Array.isArray(task.assignedTeamNames) ? task.assignedTeamNames : []),
        ...(Array.isArray(task.teamMemberNames) ? task.teamMemberNames : []),
        task.projectStage,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [localTasks, priority, scope, search, user?.id]);

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

  async function handleDragEnd(event) {
    const task = event.active.data.current?.task;
    const targetStatus = event.over?.id;
    if (!task || !targetStatus || task.status === targetStatus) return;

    const snapshot = localTasks;
    setLocalTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: targetStatus } : item)));

    try {
      await updateTask.mutateAsync({ id: task.id, payload: { status: targetStatus, project: project?.id } });
    } catch {
      setLocalTasks(snapshot);
    }
  }

  const handleCreateTask = useCallback(
    (payload) => createTask.mutateAsync({ ...payload, project: project?.id }),
    [createTask, project?.id],
  );

  const handleEditTask = useCallback((task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback(
    async (task) => {
      if (!task) return;
      if (typeof window !== 'undefined' && !window.confirm(`Delete task "${task.title || 'Task'}"?`)) return;
      await deleteTask.mutateAsync(task.id);
      setLocalTasks((current) => current.filter((item) => String(item.id) !== String(task.id)));
    },
    [deleteTask],
  );

  const handleTaskSave = useCallback(
    async (values) => {
      if (!editingTask) return;
      const nextProject = values.project || project?.id;
      const payload = {
        title: values.title?.trim(),
        description: values.description || '',
        project: nextProject,
        stage: values.stage || undefined,
        priority: values.priority || 'Medium',
        status: values.status || 'todo',
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
        assignee: values.assignee || undefined,
        team: values.team || undefined,
        nextAction: values.nextAction || '',
        reporter: values.reporter || undefined,
        assignedTeam: Array.isArray(values.assignedTeam) ? values.assignedTeam : [],
        tags: String(values.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      await updateTask.mutateAsync({ id: editingTask.id, payload });
      setTaskModalOpen(false);
      setEditingTask(null);
    },
    [editingTask, project?.id, updateTask],
  );

  const handleEditColumn = useCallback((columnId) => {
    const column = columns.find((item) => item.id === columnId);
    if (!column) return;
    setEditingColumn(column);
    setColumnTitle(column.title);
    setColumnModalOpen(true);
  }, [columns]);

  const handleDeleteColumn = useCallback(
    async (columnId) => {
      const column = columns.find((item) => item.id === columnId);
      if (!column) return;
      if (columns.length <= 1) {
        toast.error('At least one column must remain');
        return;
      }
      if (typeof window !== 'undefined' && !window.confirm(`Delete column "${column.title}"? Tasks in it will move to Todo.`)) return;

      const affected = localTasks.filter((task) => String(task.status || 'todo') === String(columnId));
      const snapshotTasks = localTasks;
      const snapshotColumns = columns;
      const fallbackColumnId = columns.find((item) => item.id !== columnId)?.id || 'todo';
      setLocalTasks((current) =>
        current.map((task) =>
          String(task.status || 'todo') === String(columnId) ? { ...task, status: fallbackColumnId } : task,
        ),
      );

      try {
        await Promise.all(
          affected.map((task) =>
            taskService.update(task.id, { status: fallbackColumnId, project: project?.id || task.projectId || task.project }),
          ),
        );
        const nextColumns = snapshotColumns.filter((item) => item.id !== columnId);
        setColumns(nextColumns);
        await saveKanbanColumns.mutateAsync({ boardType: 'task', columns: nextColumns });
        queryClient.invalidateQueries({ queryKey: ['project-tasks', project?.id] });
        queryClient.invalidateQueries({ queryKey: ['task-counts', project?.id] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['my-tasks-kanban'] });
      } catch (error) {
        setLocalTasks(snapshotTasks);
        setColumns(snapshotColumns);
        toast.error(error?.message || 'Failed to delete column');
      }
    },
    [columns, localTasks, project?.id, queryClient, saveKanbanColumns],
  );

  const handleSaveColumn = useCallback(async () => {
    const nextTitle = String(columnTitle || '').trim();
    if (!editingColumn || !nextTitle) return;
    const snapshotColumns = columns;
    const nextColumns = snapshotColumns.map((column) => (column.id === editingColumn.id ? { ...column, title: nextTitle } : column));
    setColumns(nextColumns);
    try {
      await saveKanbanColumns.mutateAsync({ boardType: 'task', columns: nextColumns });
      setColumnModalOpen(false);
      setEditingColumn(null);
      setColumnTitle('');
    } catch (error) {
      setColumns(snapshotColumns);
      toast.error(error?.message || 'Failed to save column');
    }
  }, [columnTitle, columns, editingColumn, saveKanbanColumns]);

  async function handleAddColumn(title) {
    const nextTitle = String(title || '').trim();
    if (!nextTitle) return;
    const nextIdBase = slugify(nextTitle);
    if (!nextIdBase) return;
    const existingIds = new Set(columns.map((column) => String(column.id)));
    let nextId = nextIdBase;
    let suffix = 2;
    while (existingIds.has(nextId)) {
      nextId = `${nextIdBase}-${suffix}`;
      suffix += 1;
    }
    const nextColumns = [
      ...columns,
      {
        id: nextId,
        title: nextTitle,
        color: nextColumnColor(columns.filter((column) => !BOARD_COLUMNS.some((base) => base.id === column.id)).length),
      },
    ];
    const snapshotColumns = columns;
    setColumns(nextColumns);
    try {
      await saveKanbanColumns.mutateAsync({ boardType: 'task', columns: nextColumns });
    } catch (error) {
      setColumns(snapshotColumns);
      toast.error(error?.message || 'Failed to add column');
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-white/80 text-sm text-slate-500">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${project?.projectName || 'tasks'}...`}
              className="h-11 w-full rounded-2xl bg-transparent py-2 pl-10 pr-3 outline-none placeholder:text-slate-400"
            />
          </div>
          <FilterChips
            value={scope}
            onChange={setScope}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Mine', value: 'mine' },
              { label: 'Critical', value: 'critical' },
              { label: 'Overdue', value: 'overdue' },
            ]}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-600 ring-1 ring-sky-200/70">
            <Users className="h-3.5 w-3.5" />
            {project?.projectName || 'Selected project'}
          </span>
          <span className="text-xs text-slate-500">
            Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto overflow-y-hidden pb-2">
          <div className="flex min-w-max gap-4 px-1 pr-4">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                tasks={groupedTasks[column.id] || []}
                count={(groupedTasks[column.id] || []).length}
                onAdd={handleCreateTask}
                addCardProps={{
                  employees,
                  projectId: project?.id,
                }}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onEditColumn={canManageColumns ? handleEditColumn : undefined}
                onDeleteColumn={canManageColumns ? handleDeleteColumn : undefined}
              />
            ))}
            {canManageColumns ? <KanbanAddColumn onAdd={handleAddColumn} /> : null}
          </div>
        </div>
      </DndContext>

      {taskModalOpen && editingTask ? (
        <ModalShell
          title="Edit Task"
          description="Update the task details."
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          widthClassName="max-w-4xl"
        >
          <TaskForm
            initialValues={editingTask}
            projects={[project]}
            teams={teams}
            employees={employees}
            currentUser={user}
            reporter={user?.id || ''}
            onSubmit={handleTaskSave}
            onCancel={() => {
              setTaskModalOpen(false);
              setEditingTask(null);
            }}
          />
        </ModalShell>
      ) : null}

      {columnModalOpen && editingColumn ? (
        <ModalShell
          title="Edit Column"
          description="Rename this custom column."
          onClose={() => {
            setColumnModalOpen(false);
            setEditingColumn(null);
            setColumnTitle('');
          }}
          widthClassName="max-w-lg"
        >
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Column name</span>
              <input className="input" value={columnTitle} onChange={(event) => setColumnTitle(event.target.value)} autoFocus />
            </label>
            <div className="flex justify-end gap-2 border-t border-[rgb(var(--line)/0.16)] pt-4">
              <button
                type="button"
                className="rounded-xl border border-[rgb(var(--line)/0.16)] bg-white/80 px-4 py-2 text-sm font-semibold text-[rgb(var(--text))] transition hover:bg-slate-50"
                onClick={() => {
                  setColumnModalOpen(false);
                  setEditingColumn(null);
                  setColumnTitle('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-sky-500/20 transition hover:bg-sky-400"
                onClick={handleSaveColumn}
              >
                Save
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nextColumnColor(index) {
  return EXTRA_COLUMN_COLORS[index % EXTRA_COLUMN_COLORS.length];
}
