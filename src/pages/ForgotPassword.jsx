import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getHomePathForRole } from '../utils/roleUtils';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { AuthPageShell } from '../components/auth/AuthPageShell';

export default function ForgotPassword() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState('');

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return (
      <AuthPageShell
      mode="center"
      backLink={{ to: '/login', label: 'Back to login' }}
      title="Forgot your password?"
      subtitle="Enter your work email and we will send a secure reset link."
    >
      {email ? (
        <motion.div
          className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-center"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 130, damping: 18 }}
        >
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#F0A428]" />
          <h2 className="font-display text-2xl font-bold text-white">Check your inbox</h2>
          <p className="mt-2 text-sm text-white/78">Reset link sent to {email}</p>
        </motion.div>
      ) : (
        <ForgotPasswordForm onSuccess={setEmail} />
      )}
    </AuthPageShell>
  );
}
