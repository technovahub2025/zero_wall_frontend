import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const schema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  taskId: z.string().optional(),
  stageId: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  note: z.string().optional(),
});

export function TimerManualEntry({ projects = [], tasks = [], initialValues, onSubmit, onCancel }) {
  const [submitError, setSubmitError] = useState('');
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: '',
      taskId: '',
      stageId: '',
      startTime: '',
      endTime: '',
      note: '',
    },
  });

  const projectId = watch('projectId');
  const filteredTasks = tasks.filter((task) => String(task.projectId || task.project?._id || task.project?.id || task.project) === String(projectId));

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  return (
    <form
      className="grid gap-3 sm:grid-cols-2 sm:gap-4"
      onSubmit={handleSubmit(async (values) => {
        try {
          setSubmitError('');
          const start = new Date(values.startTime);
          const end = new Date(values.endTime);
          await onSubmit({
            ...values,
            duration: Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000)),
          });
        } catch (error) {
          setSubmitError(error?.response?.data?.message || error?.message || 'Could not save entry');
        }
      })}
    >
      <Field label="Project">
        <DropdownField
          value={watch('projectId')}
          onChange={(nextValue) => {
            setValue('projectId', nextValue, { shouldDirty: true, shouldValidate: true });
            setValue('taskId', '', { shouldDirty: true, shouldValidate: true });
          }}
          options={projects.map((project) => ({
            value: project.id,
            label: project.projectName,
          }))}
          placeholder="Select project"
        />
      </Field>
      <Field label="Task">
        <DropdownField
          value={watch('taskId')}
          onChange={(nextValue) => setValue('taskId', nextValue, { shouldDirty: true, shouldValidate: true })}
          options={filteredTasks.map((task) => ({
            value: task.id,
            label: task.title,
          }))}
          placeholder="Optional task"
        />
      </Field>
      <Field label="Start Time">
        <input type="datetime-local" className="input" {...register('startTime')} />
      </Field>
      <Field label="End Time">
        <input type="datetime-local" className="input" {...register('endTime')} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Note">
          <textarea className="input min-h-[120px]" {...register('note')} />
        </Field>
      </div>
      <SubmitErrorAlert className="sm:col-span-2" message={submitError} title="Could not save entry" />
      <div className="sm:col-span-2 mt-2 flex flex-col gap-3 border-t border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.96)] px-5 py-4 -mx-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Save Entry</Button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
