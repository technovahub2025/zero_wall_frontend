import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Building2,
  CheckCheck,
  Clock3,
  Cpu,
  LockKeyhole,
  Palette,
  PencilLine,
  ShieldCheck,
  UserCircle2,
  Wrench,
} from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { buildAvatarUrl } from '../utils/avatarUrl';
import { useUiStore } from '../store/uiStore';
import { settingsService } from '../services/settingsService';
import { AvatarUpload } from '../components/upload/AvatarUpload';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { PasswordSettings } from '../components/settings/PasswordSettings';
import { ThemeSettings } from '../components/settings/ThemeSettings';
import { OrgSettings } from '../components/settings/OrgSettings';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { Card, CardBody } from '../components/ui/card';

export default function SettingsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const theme = useUiStore((state) => state.theme);
  const resolvedTheme = useUiStore((state) => state.resolvedTheme);
  const setTheme = useUiStore((state) => state.setTheme);
  const queryClient = useQueryClient();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [activeTab, setActiveTab] = useState('Profile');
  const profileQuery = useQuery({
    queryKey: ['settings-profile'],
    queryFn: () => settingsService.getProfile(),
  });
  const orgQuery = useQuery({
    queryKey: ['settings-org'],
    queryFn: () => settingsService.getOrg().catch(() => null),
    enabled: currentUser?.role === 'superadmin',
  });

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const profile = useMemo(() => profileQuery.data || currentUser || {}, [profileQuery.data, currentUser]);
  const avatarSrc = useMemo(() => buildAvatarUrl(profile.avatar, profile.updatedAt), [profile.avatar, profile.updatedAt]);
  const settingsTabs = useMemo(
    () => [
      { label: 'Profile', icon: UserCircle2, tone: 'blue' },
      { label: 'Password', icon: LockKeyhole, tone: 'rose' },
      { label: 'Theme', icon: Palette, tone: 'amber' },
      ...(currentUser?.role === 'superadmin' ? [{ label: 'Org', icon: Building2, tone: 'green' }] : []),
    ],
    [currentUser?.role],
  );
  const profileCompleteness = useMemo(() => {
    const fields = [profile.name, profile.phone, profile.designation, profile.department].filter(Boolean).length;
    return Math.round((fields / 4) * 100);
  }, [profile.department, profile.designation, profile.name, profile.phone]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-slate relative overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_30%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
              <CheckCheck className="h-3.5 w-3.5" />
              Personal workspace
            </div>
            <p className="hero-kicker">Settings</p>
            <h1 className="hero-title">Profile and organization settings</h1>
            <p className="hero-subtitle max-w-3xl">Update your profile, password, theme, and organization information.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat icon={UserCircle2} label="Profile" value={profileCompleteness} suffix="%" tone="blue" />
            <MiniStat icon={ShieldCheck} label="Security" value={theme === 'system' ? 'Auto' : 'Set'} tone="rose" />
            <MiniStat icon={Palette} label="Theme" value={resolvedTheme} tone="amber" />
            <MiniStat icon={Wrench} label="Mode" value={currentUser?.role || 'user'} tone="green" />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          return (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.label)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.label
                ? 'bg-sky-500 text-slate-950'
                : 'bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] ring-1 ring-[rgb(var(--line)/0.16)]'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {tab.label}
            </span>
          </button>
          );
        })}
      </div>

      {profileQuery.isLoading ? <SkeletonCard /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          {activeTab === 'Profile' ? (
            <Card>
              <CardBody className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <AvatarUpload avatar={avatarSrc} name={profile.name} />
                  </div>
                  <ProfileSettings
                    initialValues={profile}
                    onSubmit={async (payload) => {
                      const updated = await settingsService.updateProfile(payload);
                      useAuthStore.setState((state) => ({
                        user: { ...state.user, ...updated },
                      }));
                      await queryClient.invalidateQueries({ queryKey: ['settings-profile'] });
                      toast.success('Profile updated');
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          ) : null}

          {activeTab === 'Password' ? (
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  <LockKeyhole className="h-3.5 w-3.5 text-slate-400" />
                  Security
                </div>
                <PasswordSettings
                  onSubmit={async (payload) => {
                    await settingsService.changePassword(payload);
                    toast.success('Password changed');
                  }}
                />
              </CardBody>
            </Card>
          ) : null}

          {activeTab === 'Theme' ? (
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text))]">
                  <Palette className="h-4 w-4 text-sky-500" />
                  Theme
                </div>
                <ThemeSettings
                  theme={selectedTheme}
                  onChange={async (theme) => {
                    const previousTheme = useUiStore.getState().theme;
                    setSelectedTheme(theme);
                    setTheme(theme);
                    try {
                      const response = await settingsService.updateTheme({ theme });
                      const savedTheme = response?.theme || theme;
                      setSelectedTheme(savedTheme);
                      setTheme(savedTheme);
                      toast.success('Theme updated');
                    } catch (error) {
                      setSelectedTheme(previousTheme);
                      setTheme(previousTheme);
                      toast.error(error?.response?.data?.message || 'Theme update failed');
                    }
                  }}
                />
              </CardBody>
            </Card>
          ) : null}

          {activeTab === 'Org' ? (
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Organization
                </div>
                {orgQuery.data ? <OrgSettings org={orgQuery.data} /> : <div className="text-sm text-slate-400">Organization settings available to superadmin only.</div>}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <Card className="overflow-hidden">
          <CardBody className="max-h-[calc(100vh-22rem)] space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Account Snapshot</div>
              <span className="rounded-full border border-[rgb(var(--line)/0.12)] bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Live profile
              </span>
            </div>

            <div className="rounded-3xl border border-[rgb(var(--line)/0.12)] bg-[linear-gradient(180deg,rgba(46,131,245,0.08),rgba(255,255,255,0.86))] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[rgb(var(--text))]">{profile.name || 'Signed in user'}</div>
                  <div className="text-xs text-slate-500">{profile.role || 'Employee'}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SnapshotItem icon={UserCircle2} label="Name" value={profile.name} />
              <SnapshotItem icon={Bell} label="Email" value={profile.email} />
              <SnapshotItem icon={ShieldCheck} label="Role" value={profile.role} />
              <SnapshotItem icon={Cpu} label="Employee ID" value={profile.employeeId || 'Pending'} />
              <SnapshotItem icon={PencilLine} label="Designation" value={profile.designation || '-'} />
              <SnapshotItem icon={Building2} label="Department" value={profile.department || '-'} />
              <SnapshotItem icon={Clock3} label="Theme" value={theme} />
              <SnapshotItem icon={CheckCheck} label="Status" value="Synced" />
            </div>

            {orgQuery.data ? (
              <div className="rounded-3xl border border-[rgb(var(--line)/0.12)] bg-white/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Organization
                </div>
                <div className="space-y-2 text-sm text-slate-500">
                  <p className="font-semibold text-[rgb(var(--text))]">{orgQuery.data?.name || 'PG Infrastructure'}</p>
                  <p>{orgQuery.data?.email || '-'}</p>
                  <p className="truncate">{orgQuery.data?.clientUrl || '-'}</p>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}

function MiniStat({ icon: Icon, label, value, suffix = '', tone = 'slate' }) {
  const toneClasses = {
    blue: 'border-sky-200/70 bg-sky-500/10 text-sky-700',
    rose: 'border-rose-200/70 bg-rose-500/10 text-rose-700',
    amber: 'border-amber-200/70 bg-amber-500/10 text-amber-700',
    green: 'border-emerald-200/70 bg-emerald-500/10 text-emerald-700',
    slate: 'border-slate-200/70 bg-slate-500/10 text-slate-700',
  };

  return (
    <div className={`rounded-2xl border px-3 py-2 shadow-sm ${toneClasses[tone] || toneClasses.slate}`}>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold">{value}{suffix}</div>
    </div>
  );
}

function SnapshotItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.12)] bg-white/70 p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-[rgb(var(--text))]">{String(value || '-')}</div>
    </div>
  );
}
