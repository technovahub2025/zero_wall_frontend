import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const schema = z.object({
  email: z.string().email('Invalid email'),
});

export function ForgotPasswordForm({ onSuccess }) {
  const forgotPassword = useAuth((state) => state.forgotPassword);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    try {
      setSubmitError('');
      await forgotPassword(values);
      toast.success('Reset link sent');
      onSuccess?.(values.email);
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Could not send reset link');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
        <input
          {...register('email')}
          type="email"
          placeholder="name@company.com"
          className="input rounded-xl"
        />
        {errors.email ? <p className="mt-2 text-xs text-rose-300">{errors.email.message}</p> : null}
      </div>
      <SubmitErrorAlert message={submitError} title="Could not send reset link" />

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2E83F5] px-4 text-sm font-semibold text-white transition hover:bg-[#1d6fe0] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Send Reset Link
      </motion.button>
    </form>
  );
}
