import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, TimerReset, Users2 } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { AuthPageShell } from '../components/auth/AuthPageShell';
import { useAuthStore } from '../store/authStore';
import { getHomePathForRole } from '../utils/roleUtils';
import logo from '../assets/logo.png';
import { staggerContainer, staggerItem } from '../utils/motionVariants';

function FeatureItem({ children }) {
  return (
    <motion.li variants={staggerItem} className="flex items-start gap-3 text-sm text-white/82">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F0A428]" />
      <span>{children}</span>
    </motion.li>
  );
}

function HeroCard({ icon: Icon, title, description, toneClass = 'text-sky-300' }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
        <Icon className={`h-5 w-5 ${toneClass}`} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-700">{description}</p>
    </div>
  );
}

export default function Login() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return (
    <AuthPageShell
      mode="split"
      title="Welcome back"
      subtitle="Sign in to PG Infrastructure with your work credentials."
      footer={<p className="text-center text-sm text-white/72">Don&apos;t have an account? Contact your admin</p>}
      hero={
        <div className="hidden min-h-full flex-col justify-center lg:flex">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/95 shadow-sm">
                <img src={logo} alt="PG Infrastructure logo" className="h-7 w-7 object-contain" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-900">Project master tracker</span>
            </div>

            <h1 className="mt-8 font-display text-5xl font-bold tracking-tight text-white xl:text-6xl">
              Workflows that stay
              <span className="block text-sky-300">fast, visible, and controlled.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/82">
              Sign in with your work email or mobile number to track projects, manage approvals, and keep time entries
              in sync across the team.
            </p>

            <motion.ul variants={staggerContainer} initial="initial" animate="animate" className="mt-8 space-y-4">
              <FeatureItem>Real-time project tracking</FeatureItem>
              <FeatureItem>Role-based access for employees, admins, and super admins</FeatureItem>
              <FeatureItem>Stage-by-stage approval workflow with live task timing</FeatureItem>
            </motion.ul>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              <HeroCard
                icon={ShieldCheck}
                title="Secure access"
                description="Role-aware login and permissions."
                toneClass="text-sky-300"
              />
              <HeroCard
                icon={TimerReset}
                title="Live timer"
                description="Track time without page refreshes."
                toneClass="text-amber-300"
              />
              <HeroCard
                icon={Users2}
                title="Team view"
                description="Shared visibility across projects."
                toneClass="text-emerald-300"
              />
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </AuthPageShell>
  );
}
