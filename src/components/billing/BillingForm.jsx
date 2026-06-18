import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';
import { DatePickerField } from '../shared/DatePickerField';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

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
  const [submitError, setSubmitError] = useState('');
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
  const project = form.watch('project');
  const billingStatus = form.watch('billingStatus');

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
      onSubmit={form.handleSubmit(async (values) => {
        try {
          setSubmitError('');
          await onSubmit({
            ...values,
            dueDate: values.dueDate || undefined,
            paidDate: values.paidDate || undefined,
          });
        } catch (error) {
          setSubmitError(error?.response?.data?.message || error?.message || 'Could not save billing record');
        }
      })}
    >
      <Field label="Project" error={form.formState.errors.project?.message}>
        <DropdownField
          value={project}
          onChange={(nextValue) => form.setValue('project', nextValue, { shouldDirty: true, shouldValidate: true })}
          options={projects.map((projectItem) => ({
            value: projectItem.id,
            label: projectItem.projectName || projectItem.name,
          }))}
          placeholder="Select project"
        />
      </Field>
      <Field label="Invoice No">
        <input className="input" {...form.register('invoiceNo')} />
      </Field>
      <Field label="Billing Status">
        <DropdownField
          value={billingStatus}
          onChange={(nextValue) => form.setValue('billingStatus', nextValue, { shouldDirty: true, shouldValidate: true })}
          options={['Not Started', 'LOI Received', 'Advance Received', 'Mobilisation Advance Received', '1st Running Bill Submitted', '50% Received', 'Final Invoice Pending', 'Retention Refund Pending', 'Paid', 'Overdue'].map((status) => ({
            value: status,
            label: status,
          }))}
          placeholder="Select billing status"
        />
      </Field>
      <Field label="Total Value">
        <input className="input" type="number" step="0.01" {...form.register('amountTotal')} />
      </Field>
      <Field label="Received">
        <input className="input" type="number" step="0.01" {...form.register('amountReceived')} />
      </Field>
      <DatePickerField label="Due Date" value={form.watch('dueDate')} onChange={(nextValue) => form.setValue('dueDate', nextValue, { shouldDirty: true, shouldValidate: true })} />
      <DatePickerField label="Paid Date" value={form.watch('paidDate')} onChange={(nextValue) => form.setValue('paidDate', nextValue, { shouldDirty: true, shouldValidate: true })} />
      <Field label="Remarks" className="sm:col-span-2">
        <textarea className="input min-h-24" {...form.register('remarks')} />
      </Field>
      <SubmitErrorAlert className="sm:col-span-2" message={submitError} title="Could not save billing record" />
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
