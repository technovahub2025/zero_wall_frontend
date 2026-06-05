import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanAddColumn } from './KanbanAddColumn';

export const DEFAULT_KANBAN_COLUMNS = [
  { id: 'todo', title: 'Todo', color: '#94a3b8' },
  { id: 'in-progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'review', title: 'In Review', color: '#f59e0b' },
  { id: 'blocked', title: 'Blocked', color: '#ef4444' },
  { id: 'done', title: 'Done', color: '#22c55e' },
];

export function KanbanBoard({ tasks = [], columns = DEFAULT_KANBAN_COLUMNS, onDragEnd, onAddTask, onAddColumn }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const grouped = useMemo(
    () =>
      tasks.reduce((acc, task) => {
        const key = task.status || 'todo';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {}),
    [tasks],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex min-w-max gap-4 px-1 pr-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={grouped[column.id] || []}
              count={(grouped[column.id] || []).length}
              onAdd={
                onAddTask
                  ? (payload) =>
                      onAddTask({
                        status: column.id,
                        ...(typeof payload === 'string' ? { title: payload } : payload),
                      })
                  : null
              }
            />
          ))}
          {onAddColumn ? <KanbanAddColumn onAdd={onAddColumn} /> : null}
        </div>
      </div>
    </DndContext>
  );
}
