import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'project_manager', 'employee']),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  joiningDate: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  sendInvite: z.boolean().optional(),
}).superRefine((values, ctx) => {
  if (values.password && values.password !== values.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });
  }
});

export function EmployeeForm({ initialValues, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      role: 'employee',
      phone: '',
      designation: '',
      department: '',
      joiningDate: '',
      avatar: '',
      isActive: true,
      password: '',
      confirmPassword: '',
      sendInvite: false,
    },
  });

  const sendInvite = watch('sendInvite');

  useEffect(() => {
    if (initialValues) {
      reset({
        name: initialValues.name || '',
        email: initialValues.email || '',
        role: initialValues.role || 'employee',
        phone: initialValues.phone || '',
        designation: initialValues.designation || '',
        department: initialValues.department || '',
        joiningDate: (initialValues.joiningDate || '').slice?.(0, 10) || '',
        avatar: initialValues.avatar || '',
        isActive: Boolean(initialValues.isActive ?? true),
        password: '',
        confirmPassword: '',
        sendInvite: Boolean(initialValues.sendInvite),
      });
    }
  }, [initialValues, reset]);

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={handleSubmit(async (values) => onSubmit(values))}
    >
      <Field label="Name" error={errors.name?.message}><input className="input" {...register('name')} /></Field>
      <Field label="Email" error={errors.email?.message}><input className="input" {...register('email')} /></Field>
      <Field label="Role">
        <select className="input" {...register('role')}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
        </select>
      </Field>
      <Field label="Phone"><input className="input" {...register('phone')} /></Field>
      <Field label="Designation"><input className="input" {...register('designation')} /></Field>
      <Field label="Department">
        <select className="input" {...register('department')}>
          <option value="">Select</option>
          <option value="Structural">Structural</option>
          <option value="Architectural">Architectural</option>
          <option value="Electrical">Electrical</option>
          <option value="PEB">PEB</option>
          <option value="Management">Management</option>
        </select>
      </Field>
      <Field label="Joining Date"><input type="date" className="input" {...register('joiningDate')} /></Field>
      <Field label="Avatar URL"><input className="input" {...register('avatar')} /></Field>
      <Field label="Active">
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <input type="checkbox" {...register('isActive')} />
          Active account
        </label>
      </Field>
      <Field label="Send Invite">
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <input type="checkbox" {...register('sendInvite')} />
          Send invite email
        </label>
      </Field>
      {!sendInvite ? (
        <Field label="Password">
          <input type="password" className="input" {...register('password')} />
        </Field>
      ) : null}
      {!sendInvite ? (
        <Field label="Confirm Password">
          <input type="password" className="input" {...register('confirmPassword')} />
        </Field>
      ) : null}
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Save Employee</Button>
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
