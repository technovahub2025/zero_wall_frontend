import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { AcceptInviteForm } from '../components/auth/AcceptInviteForm';
import { PageLoader } from '../components/shared/PageLoader';
import { AuthPageShell } from '../components/auth/AuthPageShell';

export default function AcceptInvite() {
  const { token } = useParams();
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

  if (loading) {
    return <PageLoader />;
  }

  return (
    <AuthPageShell
      mode="center"
      backLink={{ to: '/login', label: 'Back to login' }}
      title={error ? 'Invitation issue' : 'Join PG Infrastructure'}
      subtitle={error ? 'Please contact your administrator.' : 'Complete your account setup to continue.'}
    >
      {error ? (
        <motion.div
          className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-center"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 130, damping: 18 }}
        >
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-[#F05252]" />
          <h1 className="font-display text-2xl font-bold text-white">This invite has expired or is invalid</h1>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
        </motion.div>
      ) : (
        <AcceptInviteForm invite={invite} token={token} />
      )}
    </AuthPageShell>
  );
}
