import { Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { getHomePathForRole } from '../utils/roleUtils';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import logo from '../assets/logo.png';
import { cardVariants } from '../utils/motionVariants';

export default function ResetPassword() {
  const { token } = useParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

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
          <img src={logo} alt="PG Infrastructure logo" className="mb-5 h-12 w-12 object-contain" />
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-400">Create a new password to continue.</p>
          <div className="mt-8">
            <ResetPasswordForm token={token} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
