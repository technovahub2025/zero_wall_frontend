import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getHomePathForRole } from '../utils/roleUtils';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import logo from '../assets/logo.png';
import { cardVariants } from '../utils/motionVariants';

export default function ForgotPassword() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState('');

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return (
    <motion.div className="min-h-screen bg-[#0B1929] px-5 py-10 text-slate-100" initial="initial" animate="animate" exit="exit" variants={cardVariants}>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <motion.div
          className="w-full rounded-[20px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link to="/login" className="text-sm font-medium text-sky-300 hover:text-sky-200">
            Back to login
          </Link>
          <div className="mt-5">
            <img src={logo} alt="PG Infrastructure logo" className="mb-5 h-12 w-12 object-contain" />
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Forgot your password?</h1>
            <p className="mt-2 text-sm text-slate-400">Enter your email and we will send you a reset link.</p>
          </div>

          {email ? (
            <motion.div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-center" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#F0A428]" />
              <h2 className="font-display text-2xl font-bold text-white">Check your inbox</h2>
              <p className="mt-2 text-sm text-slate-400">Reset link sent to {email}</p>
              <Link to="/login" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#2E83F5] text-sm font-semibold text-white hover:bg-[#1d6fe0]">
                Back to login
              </Link>
            </motion.div>
          ) : (
            <div className="mt-8">
              <ForgotPasswordForm onSuccess={setEmail} />
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
