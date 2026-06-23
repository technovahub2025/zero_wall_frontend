import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pageVariants } from '../utils/motionVariants';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { useEmployees } from '../hooks/useEmployees';
import { useProjectStore } from '../store/projectStore';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { exportProjectsToExcel } from '../lib/export';
import { ProjectTable } from '../components/projects/ProjectTable';
import { ProjectFilters } from '../components/projects/ProjectFilters';
import { ProjectForm } from '../components/projects/ProjectForm';
import { ProjectExportButton } from '../components/projects/ProjectExportButton';
import { ModalShell } from '../components/shared/ModalShell';
import { SkeletonTable } from '../components/shared/SkeletonTable';
import { EmptyState } from '../components/shared/EmptyState';
import { Card, CardBody } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useDebouncedValue } from '../utils/performance';

export default function Projects() {
  const location = useLocation();
  const navigate = useNavigate();
  const projectsQuery = useProjects();
  const employeesQuery = useEmployees();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const userRole = useAuthStore((state) => state.user?.role);
  const canDelete = userRole === 'superadmin';
  const { filters, setFilter, resetFilters } = useProjectStore();
  const { activeModal, modalData, openModal, closeModal, openConfirm } = useUiStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const deferredSearch = useDeferredValue(filters.search);

  useEffect(() => {
    if (location.state?.openProjectDialog) {
      openModal('project', null);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate, openModal]);

  useEffect(() => {
    setFilter('search', debouncedSearch);
  }, [debouncedSearch, setFilter]);

  useEffect(() => {
    resetFilters();
    setSearchInput('');
  }, [resetFilters]);

  useEffect(() => {
    setSelectedProjectIds((current) => current.filter((id) => (projectsQuery.data || []).some((project) => project.id === id)));
  }, [projectsQuery.data]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const rows = (projectsQuery.data || []).filter((project) => {
      const matchesSearch =
        !q ||
        [project.projectName, project.clientName, project.location, project.currentStage, project.companySegment, ...(project.projectType || [])]
          .join(' ')
          .toLowerCase()
          .includes(q);
      const matchesStatus = !filters.status || filters.status === 'all' || project.overallStatus === filters.status;
      const matchesSegment = !filters.segment || filters.segment === 'all' || project.companySegment === filters.segment;
      const matchesPriority = !filters.priority || filters.priority === 'all' || project.priority === filters.priority;
      return matchesSearch && matchesStatus && matchesSegment && matchesPriority;
    });
    return rows.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return filters.sort === 'oldest' ? aDate - bDate : bDate - aDate;
    });
  }, [deferredSearch, filters, projectsQuery.data]);
  const employees = employeesQuery.data || [];

  async function handleSave(values) {
    if (modalData?.id) {
      await updateProject.mutateAsync({ id: modalData.id, payload: values });
    } else {
      await createProject.mutateAsync(values);
    }
    closeModal();
  }

  function handleDelete(project) {
    openConfirm({
      title: 'Delete project',
      message: `Delete ${project.projectName}? This removes the project and related data.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: () => deleteProject.mutateAsync(project.id),
    });
  }

  function handleToggleProjectSelection(projectId) {
    setSelectedProjectIds((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId],
    );
  }

  function handleToggleAllProjects(allSelected) {
    setSelectedProjectIds(allSelected ? [] : filtered.map((project) => project.id));
  }

  function handleDeleteSelected() {
    if (!selectedProjectIds.length) return;
    openConfirm({
      title: 'Delete selected projects',
      message: `Delete ${selectedProjectIds.length} selected project${selectedProjectIds.length === 1 ? '' : 's'} permanently? This removes the projects and related data.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: async () => {
        await Promise.all(selectedProjectIds.map((projectId) => deleteProject.mutateAsync(projectId)));
        setSelectedProjectIds([]);
      },
    });
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-slate p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Projects</p>
            <h1 className="hero-title">All projects</h1>
            <p className="hero-subtitle max-w-3xl">Search, filter, create, update, export, and delete project records.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ProjectExportButton onClick={() => exportProjectsToExcel(filtered)} />
            <Button onClick={() => openModal('project', null)}>Add Project</Button>
          </div>
        </div>
      </section>

      <Card>
        <CardBody className="space-y-4">
          {projectsQuery.isError ? (
            <Card>
              <CardBody className="flex items-center gap-3 py-10">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[rgb(var(--text))]">{projectsQuery.error?.message || 'Failed to load projects'}</div>
                  <div className="text-xs text-slate-500">Refresh once the API is available.</div>
                </div>
                <Button variant="secondary" onClick={() => projectsQuery.refetch()}>Retry</Button>
              </CardBody>
            </Card>
          ) : null}
          <ProjectFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            filters={filters}
            onChange={(key, value) => setFilter(key, value)}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((current) => !current)}
            selectedCount={selectedProjectIds.length}
            allSelected={filtered.length > 0 && selectedProjectIds.length === filtered.length}
            onToggleAllSelection={(allSelected) => handleToggleAllProjects(allSelected)}
            onDeleteSelected={canDelete ? handleDeleteSelected : undefined}
          />

          {projectsQuery.isLoading ? (
            <SkeletonTable rows={6} columns={9} />
          ) : filtered.length ? (
            <ProjectTable
              rows={filtered}
              onEdit={(project) => openModal('project', project)}
              onDelete={canDelete ? handleDelete : undefined}
              selectedIds={selectedProjectIds}
              onToggleRowSelection={handleToggleProjectSelection}
              showSelection={showFilters}
            />
          ) : (
            <EmptyState title="No matching projects" description="Try adjusting search or filters." />
          )}
        </CardBody>
      </Card>

      {activeModal === 'project' ? (
      <ModalShell
        title={modalData?.id ? 'Edit Project' : 'Add Project'}
        description="Create or update a project record."
        onClose={closeModal}
      >
        <ProjectForm
          key={modalData?.id || 'project-form'}
          initialValues={modalData}
          employees={employees}
          onSubmit={handleSave}
          onCancel={closeModal}
        />
      </ModalShell>
      ) : null}
    </motion.div>
  );
}
