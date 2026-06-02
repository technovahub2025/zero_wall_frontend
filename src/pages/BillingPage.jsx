import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchProjects } from '../api/dashboard';
import { BillingTableCard } from '../components/dashboard/Widgets';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/card';

export function BillingPage() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const summary = useMemo(() => {
    const total = projects.reduce((sum, item) => sum + Number(item.value), 0);
    const received = projects.reduce((sum, item) => sum + item.recv, 0);
    const balance = projects.reduce((sum, item) => sum + item.balance, 0);
    return { total, received, balance };
  }, [projects]);

  return (
    <div className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-amber p-5 sm:p-6">
        <p className="hero-kicker">Billing</p>
        <h1 className="hero-title">Revenue and billing overview</h1>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Total Value" value={`Rs. ${summary.total.toFixed(2)}L`} tone="blue" />
        <Metric label="Received" value={`Rs. ${summary.received.toFixed(2)}L`} tone="green" />
        <Metric label="Balance" value={`Rs. ${summary.balance.toFixed(2)}L`} tone="amber" />
      </div>

      <BillingTableCard rows={projects} />
    </div>
  );
}

function Metric({ label, value, tone }) {
  const toneMap = {
    blue: 'text-sky-300',
    green: 'text-emerald-300',
    amber: 'text-amber-300',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</CardTitle>
      </CardHeader>
      <CardBody>
        <div className={`font-display text-2xl font-semibold ${toneMap[tone]}`}>{value}</div>
      </CardBody>
    </Card>
  );
}
