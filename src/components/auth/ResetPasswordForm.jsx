import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getHomePathForRole } from '../../utils/roleUtils';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/\d/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function strengthLevel(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function ResetPasswordForm({ token }) {
  const navigate = useNavigate();
  const resetPassword = useAuth((state) => state.resetPassword);
  const homePath = useAuth((state) => state.homePath);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const currentPassword = watch('password', '');
  const strength = useMemo(() => strengthLevel(currentPassword || password), [currentPassword, password]);
  const passwordField = register('password');

  const onSubmit = async (values) => {
    try {
      setSubmitError('');
      await resetPassword(token, { password: values.password });
      toast.success('Password updated');
      navigate(homePath() || getHomePathForRole('employee'), { replace: true });
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Reset failed');
    }
  };

  const widthMap = ['25%', '50%', '75%', '100%'];

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">New password</label>
        <div className="relative">
          <input
            {...passwordField}
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            className="input rounded-xl pr-12"
            onChange={(event) => {
              setPassword(event.target.value);
              passwordField.onChange(event);
            }}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? <p className="mt-2 text-xs text-rose-300">{errors.password.message}</p> : null}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-200">Password strength</label>
          <span className="text-xs text-slate-400">{['Weak', 'Fair', 'Good', 'Strong'][Math.max(0, strength - 1)] || 'Weak'}</span>
        </div>
        <div className="flex gap-2">
          {widthMap.map((width, index) => (
            <div
              key={width}
              className={`h-2 flex-1 rounded-full ${index < strength ? 'bg-emerald-400' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Confirm password</label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repeat the new password"
            className="input rounded-xl pr-12"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
            onClick={() => setShowConfirmPassword((value) => !value)}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword ? <p className="mt-2 text-xs text-rose-300">{errors.confirmPassword.message}</p> : null}
      </div>
      <SubmitErrorAlert message={submitError} title="Could not reset password" />

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2E83F5] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6fe0] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Reset Password
      </button>
    </form>
  );
}
