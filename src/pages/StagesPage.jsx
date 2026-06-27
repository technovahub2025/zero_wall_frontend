import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpenText, ChevronRight, Filter, Layers3, Plus, RefreshCw, Search, CheckCircle2, Clock3 } from 'lucide-react';
import { fetchDashboard, fetchStages } from '../api/dashboard';
import { StageTimelineCard, TaskQueueCard } from '../components/dashboard/Widgets';
import { EmptyState } from '../components/shared/EmptyState';
import { ModalShell } from '../components/shared/ModalShell';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { DropdownField } from '../components/shared/DropdownField';
import { StageForm } from '../components/stages/StageForm';
import { StageTable } from '../components/stages/StageTable';
import { useEmployees } from '../hooks/useEmployees';
import { useProjects } from '../hooks/useProjects';
import { useApproveStage, useCreateStage, useDeleteStage, useUpdateStage } from '../hooks/useStages';
import { useUiStore } from '../store/uiStore';
import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';

const STORAGE_KEYS = {
  search: 'pg-infra-stages-search',
  project: 'pg-infra-stages-project-filter',
  status: 'pg-infra-stages-status-filter',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'not started', label: 'Not Started' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'in review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'on hold', label: 'On Hold' },
];

export default function StagesPage() {
  const navigate = useNavigate();
  const { data: dashboard = {} } = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: fetchDashboard,
  });
  const stagesQuery = useQuery({
    queryKey: ['stages'],
    queryFn: fetchStages,
  });
  const projectsQuery = useProjects();
  const employeesQuery = useEmployees();
  const createStage = useCreateStage();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();
  const approveStage = useApproveStage();
  const { openConfirm } = useUiStore();

  const [search, setSearch] = useState(() => readStoredValue(STORAGE_KEYS.search, ''));
  const [projectFilter, setProjectFilter] = useState(() => readStoredValue(STORAGE_KEYS.project, 'all'));
  const [statusFilter, setStatusFilter] = useState(() => readStoredValue(STORAGE_KEYS.status, 'all'));
  const [editor, setEditor] = useState(null);

  const projects = projectsQuery.data || [];
  const employees = employeesQuery.data || [];

  const stageRows = useMemo(
    () => (Array.isArray(stagesQuery.data) ? stagesQuery.data.filter(isObjectRecord).map(normalizeStageRow) : []),
    [stagesQuery.data],
  );

  const projectOptions = useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.clientName ? `${project.projectName} - ${project.clientName}` : project.projectName })),
    [projects],
  );

  const filterProjectOptions = useMemo(
    () => [{ value: 'all', label: 'All projects' }, ...projectOptions],
    [projectOptions],
  );

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stageRows.filter((row) => {
      const matchesProject = projectFilter === 'all' ? true : String(row.projectId || row.project?.id || '') === String(projectFilter);
      const matchesStatus = statusFilter === 'all' ? true : String(row.stageStatus || '').trim().toLowerCase() === statusFilter;
      const matchesSearch =
        !query ||
        [
          row.project?.projectName,
          row.projectName,
          row.clientName,
          row.stageNo,
          row.stageName,
          row.stageDescription,
          row.stageStatus,
          row.deliverable,
          row.clientApprovalStatus,
          row.clientComments,
          row.nextAction,
          row.approvalRequired,
          row.disciplines,
          row.duration,
          row.responsibleEngineer?.name,
          row.responsibleEngineer?.email,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesProject && matchesStatus && matchesSearch;
    });
  }, [projectFilter, search, stageRows, statusFilter]);

  const stageStats = useMemo(
    () => ({
      total: stageRows.length,
      completed: stageRows.filter((stage) => String(stage.stageStatus).toLowerCase() === 'completed').length,
      review: stageRows.filter((stage) => String(stage.stageStatus).toLowerCase() === 'in review').length,
      missingDates: stageRows.filter((stage) => !stage.stageStart || !stage.stageEndPlanned).length,
    }),
    [stageRows],
  );

  const steps = useMemo(() => [...new Set(stageRows.map((stage) => stage.stageName).filter(Boolean))], [stageRows]);
  const employeesLoaded = Array.isArray(employees) ? employees : [];
  const hasProjectChoices = projectOptions.length > 0;
  const filtersActive = search.trim() || projectFilter !== 'all' || statusFilter !== 'all';
  const createProjectId = editor?.mode === 'create' ? editor.projectId : '';
  const editProjectLabel = editor?.mode === 'edit'
    ? editor.stage?.project?.projectName || editor.stage?.projectName || editor.stage?.project?.name || 'Selected project'
    : '';

  useEffect(() => {
    persistStoredValue(STORAGE_KEYS.search, search);
  }, [search]);

  useEffect(() => {
    persistStoredValue(STORAGE_KEYS.project, projectFilter);
  }, [projectFilter]);

  useEffect(() => {
    persistStoredValue(STORAGE_KEYS.status, statusFilter);
  }, [statusFilter]);

  function openCreateStage() {
    const defaultProjectId = projectFilter !== 'all' ? projectFilter : projects[0]?.id || '';
    setEditor({
      mode: 'create',
      stage: null,
      projectId: defaultProjectId,
    });
  }

  function openEditStage(row) {
    setEditor({
      mode: 'edit',
      stage: row,
      projectId: row.projectId || row.project?._id || row.project?.id || '',
    });
  }

  function closeEditor() {
    setEditor(null);
  }

  async function handleStageSave(values) {
    if (editor?.mode === 'edit' && editor.stage?.id) {
      await updateStage.mutateAsync({ id: editor.stage.id, payload: values });
      closeEditor();
      return;
    }

    if (!editor?.projectId) {
      throw new Error('Select a project before creating a stage.');
    }

    await createStage.mutateAsync({ projectId: editor.projectId, payload: values });
    closeEditor();
  }

  function handleDelete(row) {
    openConfirm({
      title: 'Delete stage',
      message: `Delete ${row.stageName || row.stageNo || 'this stage'}? This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: async () => {
        await deleteStage.mutateAsync(row.id);
      },
    });
  }

  function handleApprove(row) {
    approveStage.mutateAsync({ id: row.id, payload: { action: 'approve' } });
  }

  function handleReject(row) {
    approveStage.mutateAsync({ id: row.id, payload: { action: 'reject' } });
  }

  function clearFilters() {
    setSearch('');
    setProjectFilter('all');
    setStatusFilter('all');
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-green p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="hero-kicker">Stage Detail</p>
            <h1 className="hero-title">Stage timeline and approval log</h1>
            <p className="hero-subtitle max-w-3xl">
              Manage stages across all projects, keep the approval log current, and jump to the reference guide whenever you need it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/stage-guide')}>
              <BookOpenText className="h-4 w-4" />
              Stage Guide Reference
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={openCreateStage} disabled={!hasProjectChoices}>
              <Plus className="h-4 w-4" />
              Add Stage
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Stages" value={stageStats.total} icon={Layers3} />
          <Metric label="Completed" value={stageStats.completed} icon={CheckCircle2} />
          <Metric label="In Review" value={stageStats.review} icon={Clock3} />
          <Metric label="Date Gaps" value={stageStats.missingDates} icon={AlertCircle} />
        </div>
      </section>

      <StageTimelineCard steps={steps} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
        <Card>
          <CardHeader className="flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <CardTitle>Project Stage Detail and Client Approval Log</CardTitle>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                {visibleRows.length} of {stageRows.length} stage rows
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filtersActive ? (
                <Button variant="secondary" onClick={clearFilters}>
                  <RefreshCw className="h-4 w-4" />
                  Clear Filters
                </Button>
              ) : null}
              <Button onClick={openCreateStage} disabled={!hasProjectChoices}>
                <Plus className="h-4 w-4" />
                Add Stage
              </Button>
            </div>
          </CardHeader>

          <CardBody className="space-y-4 p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.7fr)_minmax(220px,0.7fr)]">
              <label className="input flex w-full items-center gap-2 rounded-2xl px-4 py-3">
                <Search className="h-4 w-4 text-[rgb(var(--muted))]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search project, client, stage, approval, action..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[rgb(var(--muted))]"
                />
              </label>

              <DropdownField
                label="Project"
                value={projectFilter}
                onChange={setProjectFilter}
                options={filterProjectOptions}
                placeholder="All projects"
                selectedLabel={filterProjectOptions.find((option) => String(option.value) === String(projectFilter))?.label || 'All projects'}
                searchable
                searchPlaceholder="Search projects..."
                emptyValue="all"
                labelClassName="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
              />

              <DropdownField
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
                placeholder="All statuses"
                selectedLabel={STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label || 'All statuses'}
                emptyValue="all"
                labelClassName="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
              />
            </div>

            {stagesQuery.isLoading ? (
              <SkeletonCard />
            ) : stagesQuery.isError ? (
              <EmptyState
                title="Failed to load stages"
                description={stagesQuery.error?.message || 'Try refreshing the page.'}
                action={
                  <Button variant="secondary" onClick={() => stagesQuery.refetch()}>
                    Retry
                  </Button>
                }
              />
            ) : visibleRows.length ? (
              <StageTable
                rows={visibleRows}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={openEditStage}
                onDelete={handleDelete}
                showProject
                stickyHeader
                scrollAxis="both"
                scrollClassName="max-h-[68vh] rounded-2xl border border-[rgb(var(--line)/0.12)]"
              />
            ) : (
              <EmptyState
                title={filtersActive ? 'No stages match your filters' : 'No stages found'}
                description={
                  filtersActive
                    ? 'Try clearing the search or filter chips to reveal more stage rows.'
                    : 'Create the first stage to start tracking approval and delivery progress.'
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {filtersActive ? (
                      <Button variant="secondary" onClick={clearFilters}>
                        <RefreshCw className="h-4 w-4" />
                        Clear Filters
                      </Button>
                    ) : null}
                    <Button onClick={openCreateStage} disabled={!hasProjectChoices}>
                      <Plus className="h-4 w-4" />
                      Add Stage
                    </Button>
                  </div>
                }
              />
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <TaskQueueCard
            tasks={dashboard?.tasks?.items || []}
            title="Stage Work Queue"
            subtitle="Tasks linked to active stage delivery and approval timing"
            limit={4}
          />
        </div>
      </div>

      {editor ? (
        <ModalShell
          title={editor.mode === 'edit' ? 'Edit Stage' : 'Add Stage'}
          description={editor.mode === 'edit' ? 'Update the stage while keeping the project association intact.' : 'Choose a project, then create a new stage record.'}
          onClose={closeEditor}
          widthClassName="max-w-5xl"
        >
          <div className="space-y-4">
            {editor.mode === 'create' ? (
              <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.7)] p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <Filter className="h-4 w-4" />
                  Project selection
                </div>
                <DropdownField
                  label="Project"
                  value={createProjectId}
                  onChange={(nextValue) => setEditor((current) => (current ? { ...current, projectId: nextValue } : current))}
                  options={projectOptions}
                  placeholder={hasProjectChoices ? 'Select a project' : 'No projects available'}
                  selectedLabel={
                    projects.find((project) => String(project.id) === String(createProjectId))?.projectName ||
                    projects.find((project) => String(project.id) === String(createProjectId))?.clientName ||
                    'Select a project'
                  }
                  searchable
                  searchPlaceholder="Search project..."
                  emptyValue=""
                  error={!createProjectId ? 'A project is required before creating a stage.' : ''}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.7)] p-4 text-sm text-[rgb(var(--muted))] shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Project</div>
                <div className="mt-1 font-medium text-[rgb(var(--text))]">{editProjectLabel}</div>
              </div>
            )}

            <StageForm
              key={editor.mode === 'edit' ? editor.stage?.id || 'stage-edit' : `stage-create-${createProjectId || 'none'}`}
              initialValues={editor.stage || undefined}
              employees={employeesLoaded}
              onSubmit={handleStageSave}
              onCancel={closeEditor}
              submitLabel={editor.mode === 'edit' ? 'Save Changes' : 'Create Stage'}
              submitDisabled={editor.mode === 'create' && !createProjectId}
            />
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="theme-panel-muted rounded-2xl border px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">
        <Icon className="h-3.5 w-3.5 text-[rgb(var(--muted))]" />
        <span>{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">{value}</div>
    </div>
  );
}

function isObjectRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function displayText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizeStatus(value) {
  const status = displayText(value, 'Not Started');
  if (status === 'Completed') return 'Completed';
  if (status === 'In Review') return 'In Review';
  if (status === 'On Hold') return 'On Hold';
  if (status === 'done') return 'Completed';
  if (status === 'review') return 'In Review';
  if (status === 'hold') return 'On Hold';
  return status === '-' ? 'Not Started' : status;
}

function normalizeStageRow(stage = {}) {
  const project = isObjectRecord(stage.project) ? stage.project : {};
  const projectName = displayText(project.projectName || stage.projectName || stage.proj, '');
  const clientName = displayText(project.clientName || stage.clientName || stage.client, '');
  const stageNo = displayText(stage.stageNo || stage.stageNumber, '');
  const stageName = displayText(stage.stageName || stage.stage, '');

  return {
    ...stage,
    id: String(stage.id || stage._id || `${projectName}-${stageNo}-${stageName}`),
    project,
    projectName,
    clientName,
    projectId: stage.projectId || project.id || project._id || null,
    stageNo,
    stageName,
    stageDescription: stage.stageDescription || '',
    stageStart: stage.stageStart || stage.start || null,
    stageEndPlanned: stage.stageEndPlanned || stage.endPlan || stage.targetDate || null,
    stageEndActual: stage.stageEndActual || stage.endActual || null,
    stageStatus: normalizeStatus(stage.stageStatus || stage.status),
    deliverable: displayText(stage.deliverable || stage.output, ''),
    submittedToClientOn: stage.submittedToClientOn || null,
    clientApprovalStatus: displayText(stage.clientApprovalStatus || stage.approval, ''),
    clientApprovalDate: stage.clientApprovalDate || null,
    clientComments: stage.clientComments || '',
    nextAction: displayText(stage.nextAction || stage.next, ''),
    responsibleEngineer: stage.responsibleEngineer || null,
    approvalRequired: stage.approvalRequired || '',
    disciplines: stage.disciplines || '',
    duration: stage.duration || '',
  };
}

function readStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function persistStoredValue(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}
