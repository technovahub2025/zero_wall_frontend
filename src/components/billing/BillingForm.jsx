import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';

const schema = z.object({
  project: z.string().min(1, 'Project is required'),
  invoiceNo: z.string().optional().default(''),
  billingStatus: z.string().min(1),
  amountTotal: z.coerce.number().min(0),
  amountReceived: z.coerce.number().min(0),
  dueDate: z.string().optional().default(''),
  paidDate: z.string().optional().default(''),
  remarks: z.string().optional().default(''),
});

export function BillingForm({ initialValues, projects = [], onSubmit, onCancel }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      project: initialValues?.project?._id || initialValues?.project || '',
      invoiceNo: initialValues?.invoiceNo || '',
      billingStatus: initialValues?.billingStatus || 'Not Started',
      amountTotal: initialValues?.amountTotal || 0,
      amountReceived: initialValues?.amountReceived || 0,
      dueDate: initialValues?.dueDate ? String(initialValues.dueDate).slice(0, 10) : '',
      paidDate: initialValues?.paidDate ? String(initialValues.paidDate).slice(0, 10) : '',
      remarks: initialValues?.remarks || '',
    },
  });

  useEffect(() => {
    if (!initialValues) return;
    form.reset({
      project: initialValues?.project?._id || initialValues?.project || '',
      invoiceNo: initialValues?.invoiceNo || '',
      billingStatus: initialValues?.billingStatus || 'Not Started',
      amountTotal: initialValues?.amountTotal || 0,
      amountReceived: initialValues?.amountReceived || 0,
      dueDate: initialValues?.dueDate ? String(initialValues.dueDate).slice(0, 10) : '',
      paidDate: initialValues?.paidDate ? String(initialValues.paidDate).slice(0, 10) : '',
      remarks: initialValues?.remarks || '',
    });
  }, [initialValues, form]);

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({
          ...values,
          dueDate: values.dueDate || undefined,
          paidDate: values.paidDate || undefined,
        }),
      )}
    >
      <Field label="Project" error={form.formState.errors.project?.message}>
        <select className="input" {...form.register('project')}>
          <option value="">Select project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.projectName || project.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Invoice No">
        <input className="input" {...form.register('invoiceNo')} />
      </Field>
      <Field label="Billing Status">
        <select className="input" {...form.register('billingStatus')}>
          {['Not Started', 'LOI Received', 'Advance Received', 'Mobilisation Advance Received', '1st Running Bill Submitted', '50% Received', 'Final Invoice Pending', 'Retention Refund Pending', 'Paid', 'Overdue'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Total Value">
        <input className="input" type="number" step="0.01" {...form.register('amountTotal')} />
      </Field>
      <Field label="Received">
        <input className="input" type="number" step="0.01" {...form.register('amountReceived')} />
      </Field>
      <Field label="Due Date">
        <input className="input" type="date" {...form.register('dueDate')} />
      </Field>
      <Field label="Paid Date">
        <input className="input" type="date" {...form.register('paidDate')} />
      </Field>
      <Field label="Remarks" className="sm:col-span-2">
        <textarea className="input min-h-24" {...form.register('remarks')} />
      </Field>
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

function Field({ label, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
      {error ? <div className="mt-1 text-xs text-rose-400">{error}</div> : null}
    </label>
  );
}
