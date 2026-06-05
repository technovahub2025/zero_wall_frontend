import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';

const schema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  project: z.string().min(1, 'Project is required'),
  stage: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
  nextAction: z.string().optional(),
  tags: z.string().optional(),
});

export function TaskForm({ initialValues, projects = [], employees = [], assignee = '', onSubmit, onCancel }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      project: '',
      stage: '',
      priority: 'Medium',
      status: 'todo',
      startDate: '',
      dueDate: '',
      assignee,
      nextAction: '',
      tags: '',
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        title: initialValues.title || '',
        description: initialValues.description || '',
        project: initialValues.projectId || initialValues.project?.id || initialValues.project?._id || initialValues.project || '',
        stage: initialValues.stageId || initialValues.stage?.id || initialValues.stage?._id || initialValues.stage || '',
        priority: initialValues.priority || 'Medium',
        status: initialValues.status || 'todo',
        startDate: (initialValues.startDate || '').slice?.(0, 10) || '',
        dueDate: (initialValues.dueDate || '').slice?.(0, 10) || '',
        assignee: initialValues.assigneeId || initialValues.assignee?._id || initialValues.assignee?.id || initialValues.assignee || assignee || '',
        nextAction: initialValues.nextAction || '',
        tags: Array.isArray(initialValues.tags) ? initialValues.tags.join(', ') : initialValues.tags || '',
      });
    }
  }, [assignee, initialValues, reset]);

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Field label="Title"><input className="input" {...register('title')} /></Field>
      <Field label="Project">
          <select className="input" {...register('project')}>
            <option value="">Select project</option>
          {projects.map((project) => {
            const projectId = project.id || project._id;
            return (
              <option key={projectId} value={projectId}>
                {project.projectName || project.name}
              </option>
            );
          })}
        </select>
      </Field>
      <Field label="Description" className="sm:col-span-2"><textarea className="input min-h-[96px]" {...register('description')} /></Field>
      <Field label="Stage"><input className="input" {...register('stage')} /></Field>
      <Field label="Priority"><input className="input" {...register('priority')} /></Field>
      <Field label="Status"><input className="input" {...register('status')} /></Field>
      <Field label="Start Date"><input className="input" type="date" {...register('startDate')} /></Field>
      <Field label="Due Date"><input className="input" type="date" {...register('dueDate')} /></Field>
      <Field label="Assignee">
        <select className="input" {...register('assignee')}>
          <option value="">Unassigned</option>
          {employees.map((employee) => {
            const employeeId = employee.id || employee._id;
            return (
              <option key={employeeId} value={employeeId}>
                {employee.name || employee.label || employee.email}
              </option>
            );
          })}
        </select>
      </Field>
      <Field label="Next Action" className="sm:col-span-2"><input className="input" {...register('nextAction')} /></Field>
      <Field label="Tags" className="sm:col-span-2"><input className="input" {...register('tags')} /></Field>
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Save Task</Button>
      </div>
    </form>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
