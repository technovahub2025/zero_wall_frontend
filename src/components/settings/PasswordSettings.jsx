import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export function PasswordSettings({ onSubmit }) {
  const [submitError, setSubmitError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          setSubmitError('');
          await onSubmit(values);
        } catch (error) {
          setSubmitError(error?.response?.data?.message || error?.message || 'Could not change password');
        }
      })}
    >
      <Field label="Current Password" error={form.formState.errors.currentPassword?.message}>
        <div className="relative">
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            className="input pr-12"
            {...form.register('currentPassword')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
            onClick={() => setShowCurrentPassword((value) => !value)}
            aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <Field label="New Password" error={form.formState.errors.newPassword?.message}>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            className="input pr-12"
            {...form.register('newPassword')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
            onClick={() => setShowNewPassword((value) => !value)}
            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <SubmitErrorAlert className="sm:col-span-2" message={submitError} title="Could not change password" />
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit">Change Password</Button>
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
