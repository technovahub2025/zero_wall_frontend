import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, CircleUserRound, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export function KanbanAddCard({
  onAdd,
  defaultStatus = 'todo',
  defaultPriority = 'Medium',
  employees = [],
  projectId = '',
  defaultAssigneeId = '',
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(defaultPriority);
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState(defaultAssigneeId);

  const employeesOptions = useMemo(() => employees || [], [employees]);

  function resetForm() {
    setTitle('');
    setPriority(defaultPriority);
    setDueDate('');
    setAssignee(defaultAssigneeId);
  }

  function handleSubmit() {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onAdd?.({
      title: nextTitle,
      status: defaultStatus,
      priority,
      dueDate: dueDate || undefined,
      assignee: assignee || undefined,
      project: projectId || undefined,
    });
    resetForm();
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        className="flex w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400 transition hover:border-sky-200/30 hover:bg-sky-50/60 hover:text-sky-600"
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add task
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/70 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="text-sm font-semibold text-[rgb(var(--text))]">New task</div>
        <Button type="button" size="icon" variant="ghost" onClick={() => { resetForm(); setOpen(false); }} aria-label="Cancel add task">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 grid gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Task title</span>
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" autoFocus />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Priority</span>
            <div className="relative">
              <select className="input pr-10" value={priority} onChange={(event) => setPriority(event.target.value)}>
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Due date</span>
            <div className="relative">
              <input className="input pr-10" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Assignee</span>
          <div className="relative">
            <select className="input pr-10" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
              <option value="">Unassigned</option>
              {employeesOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            <CircleUserRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </label>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className={cn('inline-flex items-center gap-2')}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
