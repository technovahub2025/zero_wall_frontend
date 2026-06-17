import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';
import { useAuthStore } from '../../store/authStore';

const phoneMessage = 'Must be exactly 10 digits';
const phoneSchema = z
  .string()
  .min(1, 'Required')
  .refine((value) => /^\d{10}$/.test(value.replace(/[\s-]/g, '').trim()), phoneMessage);

const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['superadmin', 'admin', 'project_manager', 'employee']).optional().default('employee'),
  phone: phoneSchema,
  emergencyPhone: phoneSchema,
  designation: z.string().optional(),
  department: z.string().optional(),
  joiningDate: z.string().min(1, 'Joining date is required'),
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
  const currentUserRole = useAuthStore((state) => state.user?.role || 'employee');
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      employeeId: '',
      email: '',
      role: 'employee',
      phone: '',
      emergencyPhone: '',
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
  const role = watch('role');
  const department = watch('department');
  const canCreateSuperadmin = currentUserRole === 'superadmin';
  const roleOptions = [
    ...(canCreateSuperadmin ? [{ value: 'superadmin', label: 'Superadmin' }] : []),
    { value: 'employee', label: 'Employee' },
    { value: 'admin', label: 'Admin' },
    { value: 'project_manager', label: 'Project Manager' },
  ];

  useEffect(() => {
    if (initialValues) {
      reset({
        employeeId: initialValues.employeeId || '',
        name: initialValues.name || '',
        email: initialValues.email || '',
        role: initialValues.role || 'employee',
        phone: initialValues.phone || '',
        emergencyPhone: initialValues.emergencyPhone || '',
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
      onSubmit={handleSubmit(async (values) => {
        try {
          setSubmitError('');
          await onSubmit(values);
        } catch (error) {
          setSubmitError(error?.response?.data?.message || error?.message || 'Could not save employee');
        }
      })}
    >
      <Field label="Employee ID" required error={errors.employeeId?.message}><input className="input" {...register('employeeId')} /></Field>
      <Field label="Name" required error={errors.name?.message}><input className="input" {...register('name')} /></Field>
      <Field label="Email" required error={errors.email?.message}><input type="email" className="input" {...register('email')} /></Field>
      <Field label="Mobile Number" required error={errors.phone?.message}><input className="input" inputMode="numeric" {...register('phone')} /></Field>
      <Field label="Emergency Number" required error={errors.emergencyPhone?.message}><input className="input" inputMode="numeric" {...register('emergencyPhone')} /></Field>
      <Field label="Joining Date" required error={errors.joiningDate?.message}><input type="date" className="input" {...register('joiningDate')} /></Field>
      <Field label="Role">
        <DropdownField
          value={role}
          onChange={(nextValue) => setValue('role', nextValue, { shouldDirty: true, shouldValidate: true })}
          options={roleOptions}
          placeholder="Select role"
        />
        {role === 'superadmin' ? (
          <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            Superadmin has full system access. Creation should be used carefully.
          </div>
        ) : null}
      </Field>
      <Field label="Designation"><input className="input" {...register('designation')} /></Field>
      <Field label="Department">
        <DropdownField
          value={department || ''}
          onChange={(nextValue) => setValue('department', nextValue, { shouldDirty: true, shouldValidate: true })}
          options={[
            { value: 'Structural', label: 'Structural' },
            { value: 'Architectural', label: 'Architectural' },
            { value: 'Electrical', label: 'Electrical' },
            { value: 'PEB', label: 'PEB' },
            { value: 'Management', label: 'Management' },
          ]}
          placeholder="Select department"
        />
      </Field>
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
        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input pr-12"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      ) : null}
      {!sendInvite ? (
        <Field label="Confirm Password" error={errors.confirmPassword?.message}>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="input pr-12"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      ) : null}
      <SubmitErrorAlert className="sm:col-span-2" message={submitError} title="Could not save employee" />
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Save Employee</Button>
      </div>
    </form>
  );
}

function Field({ label, required = false, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}
