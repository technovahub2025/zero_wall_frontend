import { useQuery } from '@tanstack/react-query';
import { fetchReports } from '../api/dashboard';
import { ReportsCard } from '../components/dashboard/Widgets';

export function ReportsPage() {
  const { data: report } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
  });

  return (
    <div className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-slate p-5 sm:p-6">
        <p className="hero-kicker">Reports</p>
        <h1 className="hero-title">Reports and analytics</h1>
      </section>
      <ReportsCard report={report} />
    </div>
  );
}
