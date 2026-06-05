import { useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { LayoutGrid, Search } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { useUpdateProject } from '../../hooks/useProjects';
import { stageGuideRows } from '../../data/stageGuide';
import { FilterChips } from '../shared/FilterChips';
import { cn } from '../../lib/utils';

const STAGE_COLUMNS = stageGuideRows.map((row) => row.name);

export function KanbanOverviewBoard({ projects = [], columns = [], stats = {} }) {
  const updateProject = useUpdateProject();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [localProjects, setLocalProjects] = useState(projects);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('all');
  const stageColumns = columns.length ? columns : STAGE_COLUMNS.map((name) => ({ id: name, title: name, count: 0 }));

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

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
        const key = stageColumns.find((column) => column.id === normalizeStage(project.currentStage))?.id || normalizeStage(project.currentStage);
        if (!acc[key]) acc[key] = [];
        acc[key].push(project);
        return acc;
      }, {}),
    [filteredProjects, stageColumns],
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

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[280px] flex-1 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-white/80 px-3 py-2 text-sm text-slate-500">
            <Search className="mr-2 inline h-4 w-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects, clients, engineers..."
              className="w-[calc(100%-20px)] bg-transparent outline-none placeholder:text-slate-400"
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
          <div className="ml-auto flex flex-wrap gap-2">
            <MiniStat label="Projects" value={stats.totalProjects || filteredProjects.length} icon={LayoutGrid} />
            <MiniStat label="Tasks" value={stats.taskCount || 0} icon={LayoutGrid} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-600 ring-1 ring-sky-200/70">
            <LayoutGrid className="h-3.5 w-3.5" />
            11 stage columns
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
              />
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

function normalizeStage(stage = '') {
  const raw = String(stage || '').trim();
  if (!raw) return STAGE_COLUMNS[0];
  if (STAGE_COLUMNS.includes(raw)) return raw;
  const aliases = {
    'Load Schedule & SLD': 'Detailed Engineering',
    'Panel Schedule & Drawings': 'Detailed Engineering',
  };
  return aliases[raw] || raw;
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className={cn('rounded-2xl border border-sky-200 bg-sky-50/80 px-3 py-2 text-sky-600 shadow-sm')}>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">{value}</div>
    </div>
  );
}
