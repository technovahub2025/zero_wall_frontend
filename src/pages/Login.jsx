import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuthStore } from '../store/authStore';
import { getHomePathForRole } from '../utils/roleUtils';
import logo from '../assets/logo.png';
import { cardVariants, staggerContainer, staggerItem } from '../utils/motionVariants';

function FeatureItem({ children }) {
  return (
    <motion.li variants={staggerItem} className="flex items-start gap-3 text-sm text-slate-300">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F0A428]" />
      <span>{children}</span>
    </motion.li>
  );
}

export default function Login() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return (
    <motion.div
      className="min-h-screen bg-[#0B1929] text-slate-100 lg:grid lg:grid-cols-[40%_60%]"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={cardVariants}
    >
      <div className="relative hidden min-h-screen overflow-hidden bg-[#0F2236] lg:flex lg:flex-col lg:justify-center">
        <div className="absolute inset-0 opacity-60" style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative mx-auto flex w-full max-w-md flex-col items-start gap-8 px-10">
          <img src={logo} alt="PG Infrastructure logo" className="h-16 w-16 object-contain" />
          <div>
            <p className="font-display text-4xl font-bold tracking-tight text-white">PG Infrastructure</p>
            <p className="mt-3 text-lg text-slate-300">Project master tracker</p>
          </div>
          <motion.ul variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            <FeatureItem>Real-time project tracking</FeatureItem>
            <FeatureItem>Role-based team collaboration</FeatureItem>
            <FeatureItem>Stage-by-stage approval workflow</FeatureItem>
          </motion.ul>
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute inset-0 bg-[#0B1929]" />
        <motion.div
          className="relative w-full max-w-md rounded-[20px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mb-8">
            <img src={logo} alt="PG Infrastructure logo" className="mb-5 h-12 w-12 object-contain" />
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to PG Infrastructure</p>
          </div>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account? Contact your admin
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
