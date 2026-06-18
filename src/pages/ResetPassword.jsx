import { useParams } from 'react-router-dom';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { AuthPageShell } from '../components/auth/AuthPageShell';

export default function ResetPassword() {
  const { token } = useParams();

  return (
    <AuthPageShell
      mode="center"
      backLink={{ to: '/login', label: 'Back to login' }}
      title="Reset your password"
      subtitle="Create a new password to continue."
    >
      <ResetPasswordForm token={token} />
    </AuthPageShell>
  );
}
