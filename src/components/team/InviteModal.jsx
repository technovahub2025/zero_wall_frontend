import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { ModalShell } from '../shared/ModalShell';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['employee', 'admin', 'project_manager']),
  phone: z.string().optional().default(''),
  designation: z.string().optional().default(''),
  department: z.string().optional().default(''),
});

export function InviteModal({ open, onClose, onSubmit, initialValues }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name || '',
      email: initialValues?.email || '',
      role: initialValues?.role || 'employee',
      phone: initialValues?.phone || '',
      designation: initialValues?.designation || '',
      department: initialValues?.department || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues?.name || '',
        email: initialValues?.email || '',
        role: initialValues?.role || 'employee',
        phone: initialValues?.phone || '',
        designation: initialValues?.designation || '',
        department: initialValues?.department || '',
      });
    }
  }, [open, initialValues, form]);

  if (!open) return null;

  return (
    <ModalShell title="Invite Member" description="Send an invitation email." onClose={onClose} widthClassName="max-w-3xl">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Name"><input className="input" {...form.register('name')} /></Field>
        <Field label="Email"><input className="input" {...form.register('email')} /></Field>
        <Field label="Role">
          <select className="input" {...form.register('role')}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
            <option value="project_manager">Project Manager</option>
          </select>
        </Field>
        <Field label="Phone"><input className="input" {...form.register('phone')} /></Field>
        <Field label="Designation"><input className="input" {...form.register('designation')} /></Field>
        <Field label="Department"><input className="input" {...form.register('department')} /></Field>
        <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Send Invite</Button>
        </div>
      </form>
    </ModalShell>
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
