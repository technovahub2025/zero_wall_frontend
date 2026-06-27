import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  AlertCircle,
  BadgeIndianRupee,
  CalendarDays,
  CalendarRange,
  Clock3,
  FileText,
  FolderKanban,
  CheckCircle2,
  Building2,
  AlertTriangle,
  BookOpen,
  Layers3,
  LayoutDashboard,
  ListTodo,
  MapPin,
  PencilLine,
  ReceiptText,
  Trash2,
  UserRound,
  UserRoundCog,
  Wallet,
} from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { useProject, useProjectStages, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { useEmployees } from '../hooks/useEmployees';
import { useTeams } from '../hooks/useTeams';
import { useStages, useCreateStage, useUpdateStage, useDeleteStage, useApproveStage } from '../hooks/useStages';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useAddTaskComment } from '../hooks/useTasks';
import { useProjectInvoice, useCreateInvoice, useUpdateInvoice } from '../hooks/useBilling';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useUiStore } from '../store/uiStore';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
import { ProjectForm } from '../components/projects/ProjectForm';
import { formatIndiaTime } from '../utils/formatters';
import { StageTimeline } from '../components/stages/StageTimeline';
import { StageTable } from '../components/stages/StageTable';
import { StageForm } from '../components/stages/StageForm';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskComments } from '../components/tasks/TaskComments';
import { TimeExtensionRequestsPanel } from '../components/tasks/TimeExtensionRequestsPanel';
import { TaskPriorityBadge } from '../components/tasks/TaskPriorityBadge';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { EmptyState } from '../components/shared/EmptyState';
import { TaskStatusBadge } from '../components/tasks/TaskStatusBadge';
import { ProjectStatusBadge } from '../components/projects/ProjectStatusBadge';
import { ModalShell } from '../components/shared/ModalShell';
import { DocumentList } from '../components/upload/DocumentList';
import { FilterChips } from '../components/shared/FilterChips';
import { SearchInput } from '../components/shared/SearchInput';
import { BillingProgressBar } from '../components/billing/BillingProgressBar';
import { BillingForm } from '../components/billing/BillingForm';
import { RoleGuard } from '../components/layout/RoleGuard';

const tabs = ['Overview', 'Stages', 'Tasks', 'Documents', 'Billing', 'Activity Log'];

const TAB_ICONS = {
  Overview: LayoutDashboard,
  Stages: Layers3,
  Tasks: ListTodo,
  Documents: FileText,
  Billing: ReceiptText,
  'Activity Log': Clock3,
};

const PROJECT_FIELD_ICONS = {
  'Project Name': FolderKanban,
  Client: UserRound,
  Segment: Building2,
  Type: Layers3,
  Location: MapPin,
  'Start Date': CalendarDays,
  'Planned End': CalendarRange,
  'Actual End': CalendarDays,
  Value: BadgeIndianRupee,
  Stage: Layers3,
  Completion: CheckCircle2,
  Approval: CheckCircle2,
  Billing: ReceiptText,
  'Next Action': ListTodo,
  Priority: AlertTriangle,
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeDocCategory, setActiveDocCategory] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskSort, setTaskSort] = useState('due-soon');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const projectQuery = useProject(id);
  const invoiceQuery = useProjectInvoice(id);
  const stagesQuery = useProjectStages(id);
  const tasksQuery = useTasks({ project: id });
  const activityQuery = useActivityLogs({ project: id, limit: 20 });
  const { activeModal, modalData, openModal, closeModal, openConfirm } = useUiStore();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const currentUser = useAuthStore((state) => state.user);
  const canDelete = currentUser?.role === 'superadmin';
  const employeesQuery = useEmployees();
  const teamsQuery = useTeams();
  const createStage = useCreateStage();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();
  const approveStage = useApproveStage();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addComment = useAddTaskComment();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const project = projectQuery.data;
  const invoice = invoiceQuery.data;
  const stages = stagesQuery.data || [];
  const tasks = tasksQuery.data || [];
  const employees = employeesQuery.data || [];
  const teams = teamsQuery.data || [];
  const activityItems = activityQuery.data?.items || [];
  const activitySummary = useMemo(() => {
    const latest = activityItems[0] || null;
    return {
      total: activityItems.length,
      latest,
    };
  }, [activityItems]);
  const orderedTasks = useMemo(() => {
    const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusRank = { blocked: 0, 'in-progress': 1, review: 2, todo: 3, done: 4 };
    const safeDateValue = (value) => {
      if (!value) return Number.POSITIVE_INFINITY;
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
    };
    return [...tasks].sort((left, right) => {
      const leftDue = safeDateValue(left.dueDate);
      const rightDue = safeDateValue(right.dueDate);
      const leftCreated = safeDateValue(left.createdAt || left.updatedAt);
      const rightCreated = safeDateValue(right.createdAt || right.updatedAt);
      const leftPriority = priorityRank[String(left.priority || '').toLowerCase()] ?? 4;
      const rightPriority = priorityRank[String(right.priority || '').toLowerCase()] ?? 4;
      const leftStatus = statusRank[String(left.status || '').toLowerCase()] ?? 4;
      const rightStatus = statusRank[String(right.status || '').toLowerCase()] ?? 4;

      if (taskSort === 'newest') return rightCreated - leftCreated;
      if (taskSort === 'due-soon') {
        const leftDueMissing = leftDue === Number.POSITIVE_INFINITY;
        const rightDueMissing = rightDue === Number.POSITIVE_INFINITY;
        if (leftDueMissing !== rightDueMissing) return leftDueMissing ? 1 : -1;
        if (leftDue !== rightDue) return leftDue - rightDue;
        if (leftStatus !== rightStatus) return leftStatus - rightStatus;
        return leftCreated - rightCreated;
      }
      if (taskSort === 'priority') {
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
        if (leftStatus !== rightStatus) return leftStatus - rightStatus;
        return leftCreated - rightCreated;
      }

      if (leftStatus !== rightStatus) return leftStatus - rightStatus;
      if (leftDue !== rightDue) return leftDue - rightDue;
      return leftCreated - rightCreated;
    });
  }, [taskSort, tasks]);
  const visibleTasks = useMemo(() => {
    const query = taskSearch.trim().toLowerCase();
    return orderedTasks.filter((task) => {
      const matchesSearch =
        !query ||
        [
          task.title,
          task.description,
          task.projectName,
          task.teamName,
          task.team?.name,
          task.assignee?.name,
          task.reporter?.name,
          task.reporterName,
          ...(Array.isArray(task.assignedTeamNames) ? task.assignedTeamNames : []),
          ...(Array.isArray(task.teamMemberNames) ? task.teamMemberNames : []),
          task.priority,
          task.status,
          task.dueDate,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesStatus = taskStatusFilter === 'all' ? true : String(task.status || '').toLowerCase() === taskStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orderedTasks, taskSearch, taskStatusFilter]);
  const selectedTask = useMemo(
    () => visibleTasks.find((task) => task.id === selectedTaskId) || visibleTasks[0] || null,
    [visibleTasks, selectedTaskId],
  );
  const taskStats = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status !== 'done');
    const overdueTasks = tasks.filter((task) => task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== 'done');
    const doneTasks = tasks.filter((task) => task.status === 'done');
    return {
      total: tasks.length,
      open: openTasks.length,
      overdue: overdueTasks.length,
      done: doneTasks.length,
    };
  }, [tasks]);

  useEffect(() => {
    if (!visibleTasks.length) {
      if (selectedTaskId !== null) setSelectedTaskId(null);
      return;
    }

    const selectedVisible = visibleTasks.some((task) => task.id === selectedTaskId);
    if (!selectedVisible) {
      setSelectedTaskId(visibleTasks[0].id);
    }
  }, [selectedTaskId, visibleTasks]);

  async function handleProjectSave(values) {
    await updateProject.mutateAsync({ id, payload: values });
    closeModal();
  }

  async function handleStageSave(values) {
    if (modalData?.id) {
      await updateStage.mutateAsync({ id: modalData.id, payload: values });
    } else {
      await createStage.mutateAsync({ projectId: id, payload: values });
    }
    closeModal();
  }

  async function handleTaskSave(values) {
    const payload = {
      ...values,
      project: values.project || id,
    };
    if (modalData?.id) {
      await updateTask.mutateAsync({ id: modalData.id, payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    closeModal();
  }

  async function handleInvoiceSave(values) {
    const payload = {
      ...values,
      project: id,
    };
    if (modalData?.id) {
      await updateInvoice.mutateAsync({ id: modalData.id, payload });
    } else {
      await createInvoice.mutateAsync(payload);
    }
    closeModal();
  }

  function handleDeleteProject() {
    openConfirm({
      title: 'Delete project',
      message: `Delete ${project?.projectName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: async () => {
        await deleteProject.mutateAsync(id);
        navigate('/projects');
      },
    });
  }

  function handleDeleteStage(row) {
    openConfirm({
      title: 'Delete stage',
      message: `Delete ${row.stageName}?`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: () => deleteStage.mutateAsync(row.id),
    });
  }

  function handleDeleteTask(row) {
    openConfirm({
      title: 'Delete task',
      message: `Delete ${row.title}?`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: () => deleteTask.mutateAsync(row.id),
    });
  }

  function renderModal() {
    if (activeModal === 'project') {
      const projectValues = modalData?.id ? modalData : project;
      return (
        <ProjectForm
          key={projectValues?.id || 'project-form'}
          initialValues={projectValues}
          employees={employees}
          onSubmit={handleProjectSave}
          onCancel={closeModal}
        />
      );
    }
    if (activeModal === 'stage') {
      return <StageForm initialValues={modalData} onSubmit={handleStageSave} onCancel={closeModal} />;
    }
    if (activeModal === 'task') {
      return <TaskForm initialValues={modalData} projects={[project]} stageOptions={stages} teams={teams} employees={employees} currentUser={currentUser} reporter={currentUser?.id || ''} onSubmit={handleTaskSave} onCancel={closeModal} />;
    }
    if (activeModal === 'invoice') {
      return <BillingForm initialValues={modalData} projects={[project]} onSubmit={handleInvoiceSave} onCancel={closeModal} />;
    }
    return null;
  }

  if (projectQuery.isLoading) {
    return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  }

  if (projectQuery.isError) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3 py-10">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[rgb(var(--text))]">{projectQuery.error?.message || 'Failed to load project'}</div>
            <div className="text-xs text-slate-500">Refresh the page or go back to Projects.</div>
          </div>
          <Button variant="secondary" onClick={() => navigate('/projects')}>Back</Button>
        </CardBody>
      </Card>
    );
  }

  if (!project) {
    return <EmptyState title="Project not found" description="The requested project could not be loaded." action={<Button onClick={() => navigate('/projects')}>Back to Projects</Button>} />;
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Project Detail</p>
            <h1 className="hero-title">{project.projectName}</h1>
            <p className="hero-subtitle flex flex-wrap items-center gap-2">
              <span>{project.clientName}</span>
              <span className="text-slate-400">·</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {project.location}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/stage-guide')}>
              <BookOpen className="h-4 w-4" />
              Stage Guide
            </Button>
            <Button variant="secondary" onClick={() => openModal('project', project)}>
              <PencilLine className="h-4 w-4" />
              Edit Project
            </Button>
            {canDelete ? (
              <Button variant="danger" onClick={handleDeleteProject}>
                <Trash2 className="h-4 w-4" />
                Delete Project
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ProjectStatusBadge value={project.overallStatus} />
          <TaskStatusBadge value={project.overallStatus === 'Completed' ? 'done' : project.overallStatus === 'On Hold' ? 'blocked' : 'in-progress'} />
        </div>
      </section>

      <div className="scrollbar-none flex flex-nowrap gap-2 overflow-x-auto rounded-[24px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.92)] p-2.5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`relative isolate shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-300 ease-out ${
              activeTab === tab ? 'text-slate-950' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {activeTab === tab ? (
              <motion.span
                layoutId="project-detail-tab-pill"
                className="absolute inset-0 -z-10 rounded-full bg-sky-500 shadow-[0_10px_24px_rgba(14,165,233,0.24)]"
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            ) : null}
            {TAB_ICONS[tab] ? (
              <span className="relative z-10 inline-flex h-4 w-4 items-center justify-center">
                {(() => {
                  const Icon = TAB_ICONS[tab];
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
              </span>
            ) : null}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      {activeTab === 'Overview' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card>
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {[
                ['Project Name', project.projectName],
                ['Client', project.clientName],
                ['Segment', project.companySegment],
                ['Type', (project.projectType || []).join(', ')],
                ['Location', project.location],
                ['Start Date', project.startDate?.slice?.(0, 10) || project.start || '-'],
                ['Planned End', project.targetDate?.slice?.(0, 10) || project.end || '-'],
                ['Actual End', project.actualEnd?.slice?.(0, 10) || project.actualEndDate || '-'],
                ['Value', project.projectValue],
                ['Stage', project.currentStage],
                ['Completion', `${project.stageCompletion}%`],
                ['Approval', project.clientApprovalStatus],
                ['Billing', project.invoiceStatus],
                ['Next Action', project.nextActionRequired],
                ['Priority', project.priority],
              ].map(([label, value]) => {
                const Icon = PROJECT_FIELD_ICONS[label];
                return (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      {Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" /> : null}
                      <span>{label}</span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[rgb(var(--text))]">{String(value || '-')}</div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <UserRoundCog className="h-3.5 w-3.5 text-slate-400" />
                  <span>Responsible Engineer</span>
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {project.responsibleEngineer?.name || project.engineer || 'Unassigned'}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <Wallet className="h-3.5 w-3.5 text-slate-400" />
                  <span>Billing</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-300">
                  <div>Received: {project.recv}</div>
                  <div>Balance: {project.balance}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {activeTab === 'Stages' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openModal('stage', { project: id })}>Add Stage</Button>
          </div>
          {stagesQuery.isError ? (
            <Card>
              <CardBody className="flex items-center gap-3 py-10">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[rgb(var(--text))]">
                    Could not load stages - please try again
                  </div>
                  <div className="text-xs text-slate-500">{stagesQuery.error?.message || 'The stage list could not be loaded.'}</div>
                </div>
                <Button variant="secondary" onClick={() => stagesQuery.refetch()}>Retry</Button>
              </CardBody>
            </Card>
          ) : (
            <>
              <StageTimeline stages={stages} />
              <StageTable
                rows={stages}
                onEdit={(row) => openModal('stage', row)}
                onDelete={canDelete ? handleDeleteStage : undefined}
                onApprove={(row) => approveStage.mutate({ id: row.id, payload: { action: 'approve' } })}
                onReject={(row) => approveStage.mutate({ id: row.id, payload: { action: 'reject' } })}
              />
            </>
          )}
        </div>
      ) : null}

      {activeTab === 'Tasks' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/55 p-4 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-2 sm:grid-cols-4">
                  {[
                    ['Tasks', taskStats.total, ListTodo],
                    ['Open', taskStats.open, Clock3],
                    ['Overdue', taskStats.overdue, AlertTriangle],
                    ['Done', taskStats.done, CheckCircle2],
                  ].map(([label, value, Icon]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/50 px-4 py-3 shadow-sm backdrop-blur">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{label}</span>
                      </div>
                      <div className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => openModal('task', { project: id, status: 'todo' })}>
                    <ListTodo className="h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-start">
                <SearchInput
                  value={taskSearch}
                  onChange={(event) => setTaskSearch(event.target.value)}
                  placeholder="Search task title, description, assignee, reporter..."
                />
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Status</div>
                  <FilterChips
                    value={taskStatusFilter}
                    onChange={setTaskStatusFilter}
                    options={[
                      { label: 'All', value: 'all' },
                      { label: 'Todo', value: 'todo' },
                      { label: 'In Progress', value: 'in-progress' },
                      { label: 'Review', value: 'review' },
                      { label: 'Blocked', value: 'blocked' },
                      { label: 'Done', value: 'done' },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Sort</div>
                  <FilterChips
                    value={taskSort}
                    onChange={setTaskSort}
                    options={[
                      { label: 'Due Soon', value: 'due-soon' },
                      { label: 'Newest', value: 'newest' },
                      { label: 'Priority', value: 'priority' },
                    ]}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>Showing {visibleTasks.length} of {tasks.length} tasks</span>
                <button
                  type="button"
                  className="font-medium text-sky-600 hover:text-sky-500"
                  onClick={() => {
                    setTaskSearch('');
                    setTaskStatusFilter('all');
                  }}
                >
                  Clear filters
                </button>
              </div>
            </div>
            <div className="max-h-[calc(100vh-29rem)] space-y-2 overflow-y-auto pr-2">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={selectedTask?.id === task.id}
                  compact
                  onClick={() => navigate(`/tasks/${task.id}`)}
                />
              ))}
            </div>
            {!visibleTasks.length ? (
              <EmptyState
                title="No tasks match"
                description="Try a different search or clear the current filter."
              />
            ) : null}
          </div>
          <Card className="xl:sticky xl:top-24 xl:self-start">
            <CardBody className="space-y-4">
              <TimeExtensionRequestsPanel compact />
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[rgb(var(--text))]">Selected Task</div>
                {selectedTask ? <TaskStatusBadge value={selectedTask.status} /> : null}
              </div>
              {selectedTask ? (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-[rgb(var(--text))]">{selectedTask.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{selectedTask.description}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <TaskPriorityBadge value={selectedTask.priority} />
                      <TaskStatusBadge value={selectedTask.status} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MetaItem label="Project" value={selectedTask.projectName || selectedTask.project?.projectName || project.projectName} />
                    <MetaItem label="Assignee" value={selectedTask.assignee?.name || selectedTask.assigneeName || 'Unassigned'} />
                    <MetaItem label="Raised by" value={selectedTask.reporter?.name || selectedTask.reporterName || selectedTask.createdBy?.name || 'Unknown'} />
                    <MetaItem label="Team" value={selectedTask.team?.name || selectedTask.teamName || 'No team'} />
                    <MetaItem
                      label="Team Members"
                      value={
                        Array.isArray(selectedTask.teamMemberNames) && selectedTask.teamMemberNames.length
                          ? selectedTask.teamMemberNames.join(', ')
                          : Array.isArray(selectedTask.teamMembers) && selectedTask.teamMembers.length
                            ? selectedTask.teamMembers.map((member) => member?.name || member?.label || '').filter(Boolean).join(', ') || 'No members'
                            : 'No members'
                      }
                    />
                    <MetaItem label="Due Date" value={selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'dd MMM yyyy') : '-'} />
                    <MetaItem label="Logged" value={Number(selectedTask.totalTimeLogged || 0) > 0 ? `${selectedTask.totalTimeLogged} min` : '-'} />
                  </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openModal('task', selectedTask)}>
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Button>
                      {canDelete ? (
                        <Button size="sm" variant="danger" onClick={() => handleDeleteTask(selectedTask)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <TaskComments
                    comments={selectedTask.comments || []}
                    onAdd={(text) => addComment.mutate({ id: selectedTask.id, text })}
                  />
                </>
              ) : (
                <EmptyState title="Select a task" description="Click a task card to view details and comments." />
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {activeTab === 'Documents' ? (
        <div className="space-y-4">
          <FilterChips
            value={activeDocCategory}
            onChange={setActiveDocCategory}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Drawings', value: 'drawing' },
              { label: 'Reports', value: 'report' },
              { label: 'Approvals', value: 'approval' },
              { label: 'Other', value: 'other' },
            ]}
          />
          <DocumentList projectId={id} category={activeDocCategory} />
        </div>
      ) : null}
      {activeTab === 'Billing' ? (
        invoice ? (
          <div className="space-y-4">
            <Card>
              <CardBody className="space-y-4">
                <BillingProgressBar received={invoice.amountReceived} total={invoice.amountTotal} />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    ['Invoice No', invoice.invoiceNo],
                    ['Status', invoice.billingStatus],
                    ['Total', `Rs. ${Number(invoice.amountTotal || 0).toFixed(2)}L`],
                    ['Received', `Rs. ${Number(invoice.amountReceived || 0).toFixed(2)}L`],
                    ['Balance', `Rs. ${Number(invoice.balance || 0).toFixed(2)}L`],
                    ['Due Date', invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
                      <div className="mt-2 text-sm font-semibold text-[rgb(var(--text))]">{String(value || '-')}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Remarks</div>
                  <div className="mt-2 text-sm text-slate-300">{invoice.remarks || '-'}</div>
                </div>
                <div className="flex justify-end">
                  <RoleGuard roles={['superadmin', 'admin']}>
                    <Button onClick={() => openModal('invoice', invoice)}>Edit Invoice</Button>
                  </RoleGuard>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <EmptyState
            title="No invoice yet"
            description="Create an invoice for this project."
            action={
              <RoleGuard roles={['superadmin', 'admin']}>
                <Button onClick={() => openModal('invoice', { project: id })}>Create Invoice</Button>
              </RoleGuard>
            }
          />
        )
      ) : null}
      {activeTab === 'Activity Log' ? (
        activityQuery.isLoading ? (
          <SkeletonCard />
        ) : activityQuery.isError ? (
          <Card>
            <CardBody className="flex items-center gap-3 py-10">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[rgb(var(--text))]">{activityQuery.error?.message || 'Failed to load activity log'}</div>
                <div className="text-xs text-slate-500">Try again after a moment.</div>
              </div>
              <Button variant="secondary" onClick={() => activityQuery.refetch()}>Retry</Button>
            </CardBody>
          </Card>
        ) : activityItems.length ? (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/50 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Activity Stream</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">
                    {activitySummary.total} events tracked
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-600 ring-1 ring-sky-400/20">
                    Live updates
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-500/10 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-400/20">
                    {activitySummary.latest?.occurredAt ? format(new Date(activitySummary.latest.occurredAt), 'dd MMM yyyy') : 'Recent first'}
                  </span>
                </div>
              </div>
              <div className="max-h-[calc(100vh-24rem)] space-y-3 overflow-y-auto pr-2">
                {activityItems.map((item) => (
                  <div key={item.id} className="group flex gap-4 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <div
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-transparent ${
                        item.tone === 'emerald'
                          ? 'bg-emerald-400/90'
                          : item.tone === 'violet'
                            ? 'bg-violet-400/90'
                            : item.tone === 'amber'
                              ? 'bg-amber-400/90'
                              : item.tone === 'rose'
                                ? 'bg-rose-400/90'
                                : item.tone === 'blue'
                                  ? 'bg-blue-400/90'
                                  : 'bg-sky-400/90'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[rgb(var(--text))]">{item.title}</div>
                          <div className="mt-1 text-sm text-slate-500">{item.detail}</div>
                        </div>
                        <div className="shrink-0 text-right text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          <div>{item.occurredAt ? format(new Date(item.occurredAt), 'dd MMM yyyy') : '-'}</div>
                          <div className="mt-1 text-[9px] tracking-[0.24em] text-slate-400">
                            {item.occurredAt ? formatIndiaTime(new Date(item.occurredAt)) : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ) : (
          <EmptyState title="Activity Log" description="Activity will appear here as stages, tasks, and billing records change." />
        )
      ) : null}

      {activeModal ? (
        <ModalShell
          widthClassName={activeModal === 'project' ? 'max-w-5xl' : 'max-w-4xl'}
          title={
            activeModal === 'project'
              ? modalData?.id
                ? 'Edit Project'
                : 'Add Project'
              : activeModal === 'stage'
                ? modalData?.id
                  ? 'Edit Stage'
                  : 'Add Stage'
                : activeModal === 'invoice'
                  ? modalData?.id
                    ? 'Edit Invoice'
                    : 'Add Invoice'
                  : modalData?.id
                  ? 'Edit Task'
                  : 'Add Task'
          }
          description="Save changes using the live API."
          onClose={closeModal}
        >
          {renderModal()}
        </ModalShell>
      ) : null}
    </motion.div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/60 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">{String(value || '-')}</div>
    </div>
  );
}
