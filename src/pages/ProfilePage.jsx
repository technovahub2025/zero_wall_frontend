import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { buildAvatarUrl } from '../utils/avatarUrl';
import { useMyTasks } from '../hooks/useTasks';
import { useTimer } from '../hooks/useTimer';
import { TimesheetCalendar } from '../components/timer/TimesheetCalendar';
import { TaskCard } from '../components/tasks/TaskCard';
import { AvatarUpload } from '../components/upload/AvatarUpload';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardBody } from '../components/ui/card';
import { EmptyState } from '../components/shared/EmptyState';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const tasksQuery = useMyTasks();
  const timer = useTimer();
  const [activeTab, setActiveTab] = useState('Profile');

  const myTasks = tasksQuery.data || [];
  const todayTasks = myTasks.filter((task) => task.status !== 'done').slice(0, 4);
  const avatarSrc = buildAvatarUrl(user?.avatar, user?.updatedAt);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <AvatarUpload avatar={avatarSrc} name={user?.name} />
            <div>
              <p className="hero-kicker">Profile</p>
              <h1 className="hero-title">{user?.name || 'My Profile'}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="amber">{user?.employeeId || 'Pending'}</Badge>
                <Badge tone="blue">{user?.role || 'Employee'}</Badge>
                <Badge tone="slate">{user?.department || 'Unassigned'}</Badge>
              </div>
              <p className="hero-subtitle mt-3">
                {user?.designation || 'Employee'} · Joined {user?.joiningDate ? format(new Date(user.joiningDate), 'dd MMM yyyy') : '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setActiveTab('Profile')}>Edit Profile</Button>
            <Button variant="secondary" onClick={() => navigate('/my-tasks')}>My Tasks</Button>
            <Button variant="secondary" onClick={() => navigate('/my-timesheets')}>My Timesheets</Button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {['Profile', 'My Tasks', 'My Timesheets'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab
                ? 'bg-sky-500 text-slate-950'
                : 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-1 ring-[rgb(var(--line)/0.16)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Profile' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card>
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {[
                ['Employee ID', user?.employeeId],
                ['Full Name', user?.name],
                ['Email', user?.email],
                ['Phone', user?.phone],
                ['Designation', user?.designation],
                ['Department', user?.department],
                ['Role', user?.role],
                ['Joining Date', user?.joiningDate ? format(new Date(user.joiningDate), 'dd MMM yyyy') : '-'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
                  <div className="mt-2 text-sm font-semibold text-[rgb(var(--text))]">{String(value || '-')}</div>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Timer</div>
                <div className="mt-2 text-2xl font-semibold text-[rgb(var(--text))]">{timer.elapsedSeconds || 0}s</div>
                <div className="text-xs text-slate-500">{timer.isRunning ? 'Running now' : 'No active timer'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Quick Actions</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => navigate('/my-tasks')}>View Tasks</Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/my-timesheets')}>View Timesheets</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {activeTab === 'My Tasks' ? (
        <div className="space-y-4">
          {tasksQuery.isLoading ? <div className="text-sm text-slate-400">Loading tasks...</div> : null}
          <div className="grid gap-4">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} showProject />
            ))}
            {!todayTasks.length ? <EmptyState title="No tasks yet" description="Assigned tasks will show here." /> : null}
          </div>
        </div>
      ) : null}

      {activeTab === 'My Timesheets' ? <TimesheetCalendar dailySummary={timer.dailySummary || []} /> : null}
    </motion.div>
  );
}
