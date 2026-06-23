import { useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { KanbanColumn } from './KanbanColumn';
import { KanbanAddColumn } from './KanbanAddColumn';
import { useDeleteProject, useUpdateProject } from '../../hooks/useProjects';
import { useKanbanColumns, useSaveKanbanColumns } from '../../hooks/useTasks';
import { FilterChips } from '../shared/FilterChips';
import { ModalShell } from '../shared/ModalShell';
import { ProjectForm } from '../projects/ProjectForm';
import { useAuthStore } from '../../store/authStore';

export function KanbanOverviewBoard({ projects = [], columns = [], employees = [] }) {
  const role = useAuthStore((state) => state.user?.role || 'employee');
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const kanbanColumnsQuery = useKanbanColumns('overview');
  const saveKanbanColumns = useSaveKanbanColumns();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [localProjects, setLocalProjects] = useState(projects);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('all');
  const normalizedColumns = useMemo(() => normalizeColumns(columns), [columns]);
  const fallbackColumns = useMemo(() => deriveColumnsFromProjects(projects), [projects]);
  const sourceColumns = normalizedColumns.length ? normalizedColumns : fallbackColumns;
  const [stageColumns, setStageColumns] = useState(() => sourceColumns);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnTitle, setColumnTitle] = useState('');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const canManageColumns = ['superadmin', 'admin', 'project_manager'].includes(role);
  const canDelete = role === 'superadmin';

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  useEffect(() => {
    const nextColumns = Array.isArray(kanbanColumnsQuery.data?.columns) && kanbanColumnsQuery.data.columns.length
      ? normalizeColumns(kanbanColumnsQuery.data.columns)
      : sourceColumns;
    setStageColumns(nextColumns);
  }, [kanbanColumnsQuery.data, sourceColumns]);

  const filteredProjects = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return localProjects.filter((project) => {
      if (scope !== 'all') {
        if (scope === 'critical' && String(project.priority).toLowerCase() !== 'critical') return false;
        if (scope === 'review' && !['Pending', 'In Review', 'Escalate', 'Scheduled'].includes(project.clientApprovalStatus || '')) return false;
        if (scope === 'completed' && project.overallStatus !== 'Completed') return false;
        if (scope === 'open' && project.overallStatus === 'Completed') return false;
      }
      if (!needle) return true;
      const haystack = [
        project.projectName,
        project.clientName,
        project.companySegment,
        project.currentStage,
        project.responsibleEngineer?.name || project.engineer,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [localProjects, scope, search]);

  const groupedProjects = useMemo(
    () =>
      filteredProjects.reduce((acc, project) => {
        const normalizedStage = normalizeStage(project.currentStage);
        const key = stageColumns.find((column) => column.id === normalizedStage)?.id || normalizedStage || stageColumns[0]?.id || fallbackColumns[0]?.id || '';
        if (!acc[key]) acc[key] = [];
        acc[key].push(project);
        return acc;
      }, {}),
    [fallbackColumns, filteredProjects, stageColumns],
  );

  async function handleDragEnd(event) {
    const project = event.active.data.current?.task;
    const targetStage = event.over?.id;
    if (!project || !targetStage || project.currentStage === targetStage) return;

    const snapshot = localProjects;
    setLocalProjects((current) => current.map((item) => (item.id === project.id ? { ...item, currentStage: targetStage } : item)));

    try {
      await updateProject.mutateAsync({ id: project.id, payload: { currentStage: targetStage } });
    } catch {
      setLocalProjects(snapshot);
    }
  }

  function handleEditColumn(columnId) {
    const column = stageColumns.find((item) => item.id === columnId);
    if (!column) return;
    setEditingColumn(column);
    setColumnTitle(column.title);
    setColumnModalOpen(true);
  }

  function handleEditProject(project) {
    if (!project) return;
    setEditingProject(project);
    setProjectModalOpen(true);
  }

  async function handleDeleteProject(project) {
    if (!project) return;
    if (typeof window !== 'undefined' && !window.confirm(`Delete project "${project.projectName || 'Project'}"?`)) return;
    await deleteProject.mutateAsync(project.id);
    setLocalProjects((current) => current.filter((item) => String(item.id) !== String(project.id)));
  }

  async function handleDeleteColumn(columnId) {
    const column = stageColumns.find((item) => item.id === columnId);
    if (!column) return;
    if (stageColumns.length <= 1) {
      toast.error('At least one stage column must remain');
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(`Delete stage column "${column.title}"? Projects in it will move to the first remaining stage.`)) return;

    const fallbackColumnId = stageColumns.find((item) => item.id !== columnId)?.id || stageColumns[0]?.id || fallbackColumns[0]?.id || '';
    const affected = localProjects.filter((project) => normalizeStage(project.currentStage) === columnId);
    const snapshotProjects = localProjects;
    const snapshotColumns = stageColumns;
    setLocalProjects((current) =>
      current.map((project) =>
        normalizeStage(project.currentStage) === columnId ? { ...project, currentStage: fallbackColumnId } : project,
      ),
    );

    try {
      await Promise.all(
        affected.map((project) => updateProject.mutateAsync({ id: project.id, payload: { currentStage: fallbackColumnId } })),
      );
      const nextColumns = snapshotColumns.filter((item) => item.id !== columnId);
      setStageColumns(nextColumns);
      await saveKanbanColumns.mutateAsync({ boardType: 'overview', columns: nextColumns });
    } catch (error) {
      setLocalProjects(snapshotProjects);
      setStageColumns(snapshotColumns);
      toast.error(error?.message || 'Failed to delete stage column');
    }
  }

  async function handleSaveColumn() {
    const nextTitle = String(columnTitle || '').trim();
    if (!editingColumn || !nextTitle) return;
    const snapshotColumns = stageColumns;
    const nextColumns = snapshotColumns.map((column) => (column.id === editingColumn.id ? { ...column, title: nextTitle } : column));
    setStageColumns(nextColumns);
    try {
      await saveKanbanColumns.mutateAsync({ boardType: 'overview', columns: nextColumns });
      setColumnModalOpen(false);
      setEditingColumn(null);
      setColumnTitle('');
    } catch (error) {
      setStageColumns(snapshotColumns);
      toast.error(error?.message || 'Failed to save stage column');
    }
  }

  async function handleProjectSave(values) {
    if (!editingProject) return;
    await updateProject.mutateAsync({ id: editingProject.id, payload: values });
    setProjectModalOpen(false);
    setEditingProject(null);
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
              placeholder="Search projects, clients, engineers..."
              className="h-11 w-full rounded-2xl bg-transparent py-2 pl-10 pr-3 outline-none placeholder:text-slate-400"
            />
          </div>
          <FilterChips
            value={scope}
            onChange={setScope}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Open', value: 'open' },
              { label: 'Completed', value: 'completed' },
              { label: 'Review', value: 'review' },
              { label: 'Critical', value: 'critical' },
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-600 ring-1 ring-sky-200/70">
            {stageColumns.length} stage columns
          </span>
          <span className="text-xs text-slate-500">
            Showing {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto overflow-y-hidden pb-2">
          <div className="flex min-w-max gap-4 px-1 pr-4">
            {stageColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color="#3b82f6"
                tasks={groupedProjects[column.id] || []}
                count={groupedProjects[column.id]?.length || 0}
                showProject
                onEditColumn={handleEditColumn}
                onDeleteColumn={canDelete ? handleDeleteColumn : undefined}
                onEditTask={handleEditProject}
                onDeleteTask={canDelete ? handleDeleteProject : undefined}
              />
            ))}
            {canManageColumns ? <KanbanAddColumn onAdd={(title) => {
              const nextTitle = String(title || '').trim();
              if (!nextTitle) return;
              const nextIdBase = slugify(nextTitle);
              if (!nextIdBase) return;
              const existingIds = new Set(stageColumns.map((column) => String(column.id)));
              let nextId = nextIdBase;
              let suffix = 2;
              while (existingIds.has(nextId)) {
                nextId = `${nextIdBase}-${suffix}`;
                suffix += 1;
              }
              const nextColumns = [
                ...stageColumns,
                {
                  id: nextId,
                  title: nextTitle,
                  color: nextColumnColor(stageColumns.length),
                },
              ];
              const snapshotColumns = stageColumns;
              setStageColumns(nextColumns);
              saveKanbanColumns.mutateAsync({ boardType: 'overview', columns: nextColumns }).catch((error) => {
                setStageColumns(snapshotColumns);
                toast.error(error?.message || 'Failed to add stage column');
              });
            }} /> : null}
          </div>
        </div>
      </DndContext>

      {columnModalOpen && editingColumn ? (
        <ModalShell
          title="Edit Stage Column"
          description="Rename this stage column."
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

      {projectModalOpen && editingProject ? (
        <ModalShell
          title="Edit Project"
          description="Update the project details."
          onClose={() => {
            setProjectModalOpen(false);
            setEditingProject(null);
          }}
          widthClassName="max-w-4xl"
        >
          <ProjectForm
            initialValues={editingProject}
            employees={employees}
            onSubmit={handleProjectSave}
            onCancel={() => {
              setProjectModalOpen(false);
              setEditingProject(null);
            }}
          />
        </ModalShell>
      ) : null}
    </div>
  );
}

function normalizeStage(stage = '') {
  const raw = String(stage || '').trim();
  if (!raw) return '';
  const aliases = {
    'Load Schedule & SLD': 'Detailed Engineering',
    'Panel Schedule & Drawings': 'Detailed Engineering',
  };
  return aliases[raw] || raw;
}

function normalizeColumns(columns = []) {
  return columns.map((column, index) => ({
    id: String(column.id || '').trim() || slugify(String(column.title || '').trim()) || `stage-${index + 1}`,
    title: String(column.title || '').trim() || `Stage ${index + 1}`,
    color: String(column.color || '#3b82f6'),
    count: Number(column.count || 0),
  }));
}

function deriveColumnsFromProjects(projects = []) {
  const stageNames = [...new Set(projects.map((project) => normalizeStage(project.currentStage)).filter(Boolean))];

  return stageNames.map((name, index) => ({
    id: slugify(name) || `stage-${index + 1}`,
    title: name,
    color: nextColumnColor(index),
    count: 0,
  }));
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nextColumnColor(index) {
  const palette = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#10b981'];
  return palette[index % palette.length];
}
