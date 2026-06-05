import { useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '../ui/badge';
import { KanbanAddCard } from './KanbanAddCard';
import { KanbanCard } from './KanbanCard';
import { cn } from '../../lib/utils';

const COLUMN_MAX_HEIGHT = 'h-[calc(100vh-22rem)] min-h-[28rem]';

export function KanbanColumn({
  id,
  title,
  color = '#2E83F5',
  tasks = [],
  items,
  count = 0,
  onAdd,
  showProject = false,
  addCardProps = {},
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const scrollRef = useRef(null);
  const rows = useMemo(() => {
    if (Array.isArray(items)) return items;
    if (Array.isArray(tasks)) return tasks;
    return [];
  }, [items, tasks]);
  const shouldVirtualize = rows.length >= 20;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (showProject ? 204 : 218),
    overscan: 4,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-[320px] flex-col rounded-[1.4rem] border bg-white/5 p-3',
        COLUMN_MAX_HEIGHT,
        isOver ? 'border-sky-400/40 ring-2 ring-sky-400/30' : 'border-white/10',
      )}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-2 pb-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <div className="text-sm font-semibold text-[rgb(var(--text))]">{title}</div>
        <Badge className="ml-auto">{Number.isFinite(Number(count)) ? count : rows.length}</Badge>
      </div>

      <div ref={scrollRef} className="mt-3 flex-1 overflow-y-auto pr-1">
        {shouldVirtualize ? (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = rows[virtualItem.index];
              if (!item) return null;
              return (
                <div
                  key={item.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  className="absolute left-0 top-0 w-full pb-3"
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  <KanbanCard task={item} showProject={showProject} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((item) => (
              <KanbanCard key={item.id} task={item} showProject={showProject} />
            ))}
          </div>
        )}

        {onAdd ? (
          <div className="mt-3">
            <KanbanAddCard onAdd={onAdd} defaultStatus={id} {...addCardProps} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
