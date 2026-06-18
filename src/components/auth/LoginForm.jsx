import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getHomePathForRole } from '../../utils/roleUtils';
import { cn } from '../../lib/utils';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Email or mobile number required'),
  password: z.string().min(1, 'Password required'),
});

export function LoginForm() {
  const navigate = useNavigate();
  const login = useAuth((state) => state.login);
  const homePath = useAuth((state) => state.homePath);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      setSubmitError('');
      await login(values);
      toast.success('Signed in');
      navigate(homePath() || getHomePathForRole('employee'), { replace: true });
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to sign in';
      setSubmitError(message);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Email or Mobile Number</label>
        <p className="mb-2 text-xs leading-5 text-slate-400">Use your work email address or registered mobile number.</p>
        <input
          {...register('identifier')}
          type="text"
          inputMode="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          placeholder="name@company.com or 9876543210"
          className="input rounded-xl"
        />
        {errors.identifier ? <p className="mt-2 text-xs text-rose-300">{errors.identifier.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            placeholder="Enter your password"
            className="input rounded-xl pr-12"
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

      <div className="flex items-center justify-end">
        <Link to="/forgot-password" className="text-sm font-medium text-sky-300 transition hover:text-sky-200">
          Forgot password?
        </Link>
      </div>

      <SubmitErrorAlert message={submitError} title="Could not sign in" />

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={cn(
          'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2E83F5] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6fe0] disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Sign In
      </motion.button>
    </form>
  );
}
