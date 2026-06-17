import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS, getHomePathForRole } from '../../utils/roleUtils';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
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

export function AcceptInviteForm({ invite, token }) {
  const navigate = useNavigate();
  const acceptInvite = useAuth((state) => state.acceptInvite);
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
      name: invite?.inviteeName || '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const currentPassword = watch('password', '');
  const strength = useMemo(() => strengthLevel(currentPassword || password), [currentPassword, password]);
  const roleLabel = ROLE_LABELS[invite?.role] || invite?.role || 'Employee';
  const passwordField = register('password');

  const onSubmit = async (values) => {
    try {
      setSubmitError('');
      await acceptInvite(token, values);
      toast.success('Welcome to PG Infrastructure');
      navigate(homePath() || getHomePathForRole(invite?.role || 'employee'), { replace: true });
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Could not join');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p className="text-slate-100">You are joining as {roleLabel}</p>
        <p className="mt-1 text-slate-400">Invited by: {invite?.inviterName || 'A teammate'}</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
        <input
          value={invite?.email || ''}
          readOnly
          className="input rounded-xl bg-white/5 text-slate-400"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Name</label>
        <input {...register('name')} className="input rounded-xl" placeholder="Your name" />
        {errors.name ? <p className="mt-2 text-xs text-rose-300">{errors.name.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Phone</label>
        <input {...register('phone')} className="input rounded-xl" placeholder="+91..." />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
        <div className="relative">
          <input
            {...passwordField}
            type={showPassword ? 'text' : 'password'}
            className="input rounded-xl pr-12"
            placeholder="Create a password"
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
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full ${index < strength ? 'bg-[#22C97A]' : 'bg-white/10'}`}
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
            className="input rounded-xl pr-12"
            placeholder="Repeat password"
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
      <SubmitErrorAlert message={submitError} title="Could not join" />

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2E83F5] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6fe0] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Join PG Infrastructure
      </button>
    </form>
  );
}
