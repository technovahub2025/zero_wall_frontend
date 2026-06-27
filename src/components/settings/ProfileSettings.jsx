import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().default(''),
  emergencyPhone: z.string().optional().default(''),
  designation: z.string().optional().default(''),
  department: z.string().optional().default(''),
});

export function ProfileSettings({ initialValues, onSubmit }) {
  const [submitError, setSubmitError] = useState('');
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name || '',
      phone: initialValues?.phone || '',
      emergencyPhone: initialValues?.emergencyPhone || '',
      designation: initialValues?.designation || '',
      department: initialValues?.department || '',
    },
  });

  useEffect(() => {
    form.reset({
      name: initialValues?.name || '',
      phone: initialValues?.phone || '',
      emergencyPhone: initialValues?.emergencyPhone || '',
      designation: initialValues?.designation || '',
      department: initialValues?.department || '',
    });
  }, [initialValues, form]);

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          setSubmitError('');
          await onSubmit(values);
        } catch (error) {
          setSubmitError(error?.response?.data?.message || error?.message || 'Could not save profile');
        }
      })}
    >
      <Field label="Name" error={form.formState.errors.name?.message}><input className="input" {...form.register('name')} /></Field>
      <Field label="Phone" error={form.formState.errors.phone?.message}><input className="input" {...form.register('phone')} /></Field>
      <Field label="Emergency Phone" error={form.formState.errors.emergencyPhone?.message}><input className="input" {...form.register('emergencyPhone')} /></Field>
      <Field label="Designation" error={form.formState.errors.designation?.message}><input className="input" {...form.register('designation')} /></Field>
      <Field label="Department" error={form.formState.errors.department?.message}><input className="input" {...form.register('department')} /></Field>
      <SubmitErrorAlert className="sm:col-span-2" message={submitError} title="Could not save profile" />
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit">Save Profile</Button>
      </div>
    </form>
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
