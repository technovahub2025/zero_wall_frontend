import { useQuery } from '@tanstack/react-query';
import { fetchTeam } from '../api/dashboard';
import { TeamGridCard } from '../components/dashboard/Widgets';

export function TeamPage() {
  const { data: members = [] } = useQuery({
    queryKey: ['team'],
    queryFn: fetchTeam,
  });

  return (
    <div className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <p className="hero-kicker">Team</p>
        <h1 className="hero-title">Team and roles</h1>
      </section>
      <TeamGridCard members={members} />
    </div>
  );
}
