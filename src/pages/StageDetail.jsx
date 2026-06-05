import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, CheckCircle2, Clock3, Layers3, MapPin, Users } from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useProjects } from '../hooks/useProjects';
import { useEmployees } from '../hooks/useEmployees';
import { useProjectStore } from '../store/projectStore';
import { useStages, useCreateStage, useUpdateStage, useDeleteStage, useApproveStage } from '../hooks/useStages';
import { useUiStore } from '../store/uiStore';
import { StageTimeline } from '../components/stages/StageTimeline';
import { StageTable } from '../components/stages/StageTable';
import { StageForm } from '../components/stages/StageForm';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/shared/EmptyState';
import { ModalShell } from '../components/shared/ModalShell';

export default function StageDetail() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { selectedProjectId, setSelectedProjectId } = useProjectStore();
  const { activeModal, modalData, openModal, closeModal, openConfirm } = useUiStore();
  const createStage = useCreateStage();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();
  const approveStage = useApproveStage();
  const employeesQuery = useEmployees();
  const selectedId = selectedProjectId || projects[0]?.id || '';
  const stagesQuery = useStages(selectedId);
  const employees = employeesQuery.data || [];
  const selectedProject = projects.find((project) => project.id === selectedId) || null;
  const stageStats = {
    total: stagesQuery.data?.length || 0,
    completed: (stagesQuery.data || []).filter((stage) => String(stage.stageStatus).toLowerCase() === 'completed').length,
    inProgress: (stagesQuery.data || []).filter((stage) => String(stage.stageStatus).toLowerCase() === 'in progress').length,
  };

  useEffect(() => {
    if (!selectedProjectId && projects[0]?.id) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  async function handleSave(values) {
    if (modalData?.id) {
      await updateStage.mutateAsync({ id: modalData.id, payload: values });
    } else {
      await createStage.mutateAsync({ projectId: selectedId, payload: values });
    }
    closeModal();
  }

  function handleDelete(row) {
    openConfirm({
      title: 'Delete stage',
      message: `Delete ${row.stageName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: async () => {
        await deleteStage.mutateAsync(row.id);
      },
    });
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-green p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="hero-kicker">Stage Detail</p>
            <h1 className="hero-title">{selectedProject?.projectName || 'Stage timeline and approval log'}</h1>
            <p className="hero-subtitle max-w-3xl">
              {selectedProject?.clientName || 'Select a project'}{selectedProject?.location ? ' · ' : ''}
              {selectedProject?.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedProject.location}
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge tone="slate">
                <Layers3 className="h-3.5 w-3.5" />
                {selectedProject?.projectName || 'Select a project'}
              </Badge>
              <Badge tone="blue">
                <Users className="h-3.5 w-3.5" />
                {selectedProject?.clientName || 'Client not selected'}
              </Badge>
              <Badge tone="green">
                <MapPin className="h-3.5 w-3.5" />
                {selectedProject?.location || 'Location not set'}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Stages', stageStats.total, Layers3],
              ['Completed', stageStats.completed, CheckCircle2],
              ['In Progress', stageStats.inProgress, Clock3],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/60 px-4 py-3 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span>{label}</span>
                </div>
                <div className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Card>
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Project</div>
            <select
              className="input mt-2 min-w-[280px]"
              value={selectedId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/stage-guide')}>
              <BookOpen className="h-4 w-4" />
              Stage Guide
            </Button>
            <Button onClick={() => openModal('stage', { project: selectedId })}>
              <Layers3 className="h-4 w-4" />
              Add Stage
            </Button>
          </div>
        </CardBody>
      </Card>

      {stagesQuery.isLoading ? (
        <EmptyState title="Loading stages" description="Fetching stage data from the API." />
      ) : stagesQuery.isError ? (
        <Card>
          <CardBody className="flex items-center gap-3 py-10">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[rgb(var(--text))]">{stagesQuery.error?.message || 'Failed to load stages'}</div>
              <div className="text-xs text-slate-500">Try again after a moment.</div>
            </div>
            <Button variant="secondary" onClick={() => stagesQuery.refetch()}>Retry</Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          <StageTimeline stages={stagesQuery.data || []} />
          <StageTable
            rows={stagesQuery.data || []}
            onApprove={(row) => approveStage.mutate({ id: row.id, payload: { action: 'approve' } })}
            onReject={(row) => approveStage.mutate({ id: row.id, payload: { action: 'reject' } })}
            onEdit={(row) => openModal('stage', row)}
            onDelete={handleDelete}
          />
        </div>
      )}

      {activeModal === 'stage' ? (
        <ModalShell
          title={modalData?.id ? 'Edit Stage' : 'Add Stage'}
          description="Save stage changes using the live API."
          onClose={closeModal}
        >
          <StageForm initialValues={modalData} employees={employees} onSubmit={handleSave} onCancel={closeModal} />
        </ModalShell>
      ) : null}
    </motion.div>
  );
}
