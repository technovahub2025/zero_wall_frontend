import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const schema = z.object({
  name: z.string().min(3, 'Project name is required'),
  client: z.string().min(2, 'Client name is required'),
  type: z.string().min(2, 'Type is required'),
  location: z.string().min(2, 'Location is required'),
  value: z.string().min(1, 'Project value is required'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
});

export function ProjectDialog({ open, onClose, onSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      client: '',
      type: 'Residential',
      location: '',
      value: '',
      priority: 'high',
    },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  if (!open) return null;

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    reset();
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl">
        <div className="flex items-center justify-between border-b border-[rgb(var(--line)/0.16)] px-5 py-4">
          <div>
            <div className="font-display text-lg font-semibold text-[rgb(var(--text))]">New Project</div>
            <div className="text-sm text-slate-500">Create a new project record</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] p-2 text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.96)]"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
          <Field label="Project Name" error={errors.name?.message}>
            <input className="input" {...register('name')} />
          </Field>
          <Field label="Client Name" error={errors.client?.message}>
            <input className="input" {...register('client')} />
          </Field>
          <Field label="Type" error={errors.type?.message}>
            <input className="input" {...register('type')} />
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <input className="input" {...register('location')} />
          </Field>
          <Field label="Project Value (Rs. L)" error={errors.value?.message}>
            <input className="input" {...register('value')} />
          </Field>
          <Field label="Priority" error={errors.priority?.message}>
            <select className="input" {...register('priority')}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>

          <div className="sm:col-span-2 flex flex-col gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save Project
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}
