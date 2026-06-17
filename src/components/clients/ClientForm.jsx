import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const schema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Valid email required').or(z.literal('')).optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  segment: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  projectIds: z.array(z.string()).optional(),
});

export function ClientForm({ initialValues, projects = [], onSubmit, onCancel, isSubmitting = false }) {
  const [submitError, setSubmitError] = useState('');
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: '',
      contactPerson: '',
      email: '',
      phone: '',
      companyName: '',
      segment: '',
      address: '',
      city: '',
      status: 'Active',
      notes: '',
      projectIds: [],
    },
  });
  const segment = form.watch('segment');
  const status = form.watch('status');
  const projectIds = form.watch('projectIds');

  useEffect(() => {
    if (!initialValues) return;
    form.reset({
      clientName: initialValues.clientName || '',
      contactPerson: initialValues.contactPerson || '',
      email: initialValues.email || '',
      phone: initialValues.phone || '',
      companyName: initialValues.companyName || '',
      segment: initialValues.segment || '',
      address: initialValues.address || '',
      city: initialValues.city || '',
      status: initialValues.status || 'Active',
      notes: initialValues.notes || '',
      projectIds: (initialValues.projectIds || []).map((item) => String(item?._id || item?.id || item)),
    });
  }, [form, initialValues]);

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          setSubmitError('');
          await onSubmit({
            ...values,
            projectIds: Array.isArray(values.projectIds) ? values.projectIds.filter(Boolean) : [],
          });
        } catch (error) {
          setSubmitError(error?.response?.data?.message || error?.message || 'Could not save client');
        }
      })}
    >
      <Field label="Client Name" error={form.formState.errors.clientName?.message}>
        <input className="input" {...form.register('clientName')} />
      </Field>
      <Field label="Contact Person">
        <input className="input" {...form.register('contactPerson')} />
      </Field>
      <Field label="Email" error={form.formState.errors.email?.message}>
        <input className="input" type="email" {...form.register('email')} />
      </Field>
      <Field label="Phone">
        <input className="input" {...form.register('phone')} />
      </Field>
      <Field label="Company Name">
        <input className="input" {...form.register('companyName')} />
      </Field>
      <Field label="Segment">
        <DropdownField
          value={segment || ''}
          onChange={(nextValue) => form.setValue('segment', nextValue, { shouldDirty: true, shouldValidate: true })}
          options={[
            { value: 'Residential', label: 'Residential' },
            { value: 'Commercial', label: 'Commercial' },
            { value: 'Industrial', label: 'Industrial' },
            { value: 'Manufacturing', label: 'Manufacturing' },
          ]}
          placeholder="Select segment"
        />
      </Field>
      <Field label="City">
        <input className="input" {...form.register('city')} />
      </Field>
      <Field label="Status">
        <DropdownField
          value={status || ''}
          onChange={(nextValue) => form.setValue('status', nextValue, { shouldDirty: true, shouldValidate: true })}
          options={[
            { value: 'Active', label: 'Active' },
            { value: 'Lead', label: 'Lead' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Archived', label: 'Archived' },
          ]}
          placeholder="Select status"
        />
      </Field>
      <Field label="Address" className="sm:col-span-2">
        <textarea className="input min-h-[96px]" {...form.register('address')} />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea className="input min-h-[96px]" {...form.register('notes')} />
      </Field>
      <Field label="Projects" className="sm:col-span-2">
        <DropdownField
          value={projectIds || []}
          multiple
          onChange={(nextValue) => form.setValue('projectIds', nextValue, { shouldDirty: true, shouldValidate: true })}
          options={projects.map((projectItem) => ({
            value: projectItem.id,
            label: projectItem.projectName || projectItem.name,
          }))}
          placeholder="Select projects"
          selectedLabel={Array.isArray(projectIds) && projectIds.length ? `${projectIds.length} projects selected` : 'Select projects'}
        />
      </Field>
      <SubmitErrorAlert className="sm:col-span-2" message={submitError} title="Could not save client" />
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
          {isSubmitting || form.formState.isSubmitting ? 'Saving...' : 'Save Client'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}
