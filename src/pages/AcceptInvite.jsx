import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getHomePathForRole } from '../utils/roleUtils';
import { AcceptInviteForm } from '../components/auth/AcceptInviteForm';
import { PageLoader } from '../components/shared/PageLoader';
import logo from '../assets/logo.png';
import { cardVariants } from '../utils/motionVariants';

export default function AcceptInvite() {
  const { token } = useParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const validateInvite = useAuthStore((state) => state.validateInvite);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const response = await validateInvite(token);
        if (!mounted) return;
        setInvite(response?.data || response?.data?.data || response?.data || response);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'This invite has expired or is invalid');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [token, validateInvite]);

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  if (loading) {
    return <PageLoader />;
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
          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-center">
              <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-[#F05252]" />
              <h1 className="font-display text-2xl font-bold text-white">This invite has expired or is invalid</h1>
              <p className="mt-2 text-sm text-slate-400">Please contact your administrator.</p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white">Join PG Infrastructure</h1>
              <p className="mt-2 text-sm text-slate-400">Complete your account setup to continue.</p>
              <div className="mt-8">
                <AcceptInviteForm invite={invite} token={token} />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
