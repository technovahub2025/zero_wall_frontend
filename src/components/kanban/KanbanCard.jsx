import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CalendarDays, GripVertical, Layers3, UserCircle2 } from 'lucide-react';
import { Card, CardBody } from '../ui/card';
import { TaskPriorityBadge } from '../tasks/TaskPriorityBadge';
import { TaskStatusBadge } from '../tasks/TaskStatusBadge';
import { TaskCountdown } from '../tasks/TaskCountdown';
import { cn } from '../../lib/utils';

function KanbanCardImpl({ task, showProject = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task, showProject },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
      className={cn('transition-transform', isDragging && 'opacity-55 scale-[0.98]')}
      {...attributes}
      {...listeners}
    >
      <Card
        className={cn(
          'border-white/10 bg-white/75 shadow-sm shadow-black/10 transition hover:-translate-y-[1px] hover:border-sky-200/40 hover:shadow-md',
          isDragging && 'rotate-[0.3deg] shadow-xl shadow-sky-500/10 ring-1 ring-sky-300/40',
        )}
      >
        <CardBody className="p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="line-clamp-2 text-sm font-semibold text-[rgb(var(--text))] sm:text-[15px]">
                {showProject ? task.projectName || task.name || 'Untitled Project' : task.title}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 sm:text-xs">
                {showProject ? (
                  <>
                    <Layers3 className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{task.clientName || task.client || 'Client'}</span>
                  </>
                ) : (
                  <span className="line-clamp-1">{task.projectName || 'Project'}</span>
                )}
              </div>
            </div>
            <GripVertical className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {showProject ? (
              <>
                <TaskStatusBadge value={task.overallStatus || task.status} />
                <TaskPriorityBadge value={task.priority} />
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-1 text-[11px] font-semibold text-sky-600 ring-1 ring-sky-200/70">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {task.taskCount || 0} tasks
                </span>
              </>
            ) : (
              <>
                <TaskPriorityBadge value={task.priority} />
                <TaskStatusBadge value={task.status} />
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
                  <Layers3 className="h-3.5 w-3.5" />
                  {task.projectName || 'Project'}
                </span>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 sm:text-xs">
            {showProject ? (
              <>
                <UserCircle2 className="h-3.5 w-3.5" />
                <span className="truncate">{task.responsibleEngineer?.name || task.engineer || 'Unassigned'}</span>
                <span className="text-slate-500">•</span>
                <span className="truncate">{task.currentStage || 'No stage'}</span>
              </>
            ) : (
              <>
                <span className="truncate">{task.assigneeName || 'Unassigned'}</span>
              </>
            )}
          </div>
          {!showProject ? (
            <div className="mt-3">
              <TaskCountdown dueDate={task.dueDate} />
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}

function areEqual(prevProps, nextProps) {
  const prev = prevProps.task || {};
  const next = nextProps.task || {};
  return (
    prevProps.showProject === nextProps.showProject &&
    prev.id === next.id &&
    prev.status === next.status &&
    prev.updatedAt === next.updatedAt &&
    prev.priority === next.priority &&
    prev.taskCount === next.taskCount &&
    prev.currentStage === next.currentStage &&
    prev.overallStatus === next.overallStatus &&
    prev.assigneeName === next.assigneeName &&
    prev.responsibleEngineer?.name === next.responsibleEngineer?.name &&
    prev.projectName === next.projectName &&
    prev.clientName === next.clientName
  );
}

export const KanbanCard = memo(KanbanCardImpl, areEqual);
