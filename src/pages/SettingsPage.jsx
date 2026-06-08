import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
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
  const [activeTab, setActiveTab] = useState('Profile');
  const profileQuery = useQuery({
    queryKey: ['settings-profile'],
    queryFn: () => settingsService.getProfile(),
  });
  const orgQuery = useQuery({
    queryKey: ['settings-org'],
    queryFn: () => settingsService.getOrg().catch(() => null),
  });

  const profile = useMemo(() => profileQuery.data || currentUser || {}, [profileQuery.data, currentUser]);
  const avatarSrc = useMemo(() => buildAvatarUrl(profile.avatar, profile.updatedAt), [profile.avatar, profile.updatedAt]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-slate p-5 sm:p-6">
        <p className="hero-kicker">Settings</p>
        <h1 className="hero-title">Profile and organization settings</h1>
        <p className="hero-subtitle max-w-3xl">Update your profile, password, theme, and organization information.</p>
      </section>

      <div className="flex flex-wrap gap-2">
        {['Profile', 'Password', 'Theme', 'Org'].map((tab) => (
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

      {profileQuery.isLoading ? <SkeletonCard /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          {activeTab === 'Profile' ? (
            <Card>
              <CardBody className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <AvatarUpload avatar={avatarSrc} name={profile.name} />
                  <ProfileSettings
                    initialValues={profile}
                    onSubmit={async (payload) => {
                      const updated = await settingsService.updateProfile(payload);
                      useAuthStore.setState((state) => ({
                        user: { ...state.user, ...updated },
                      }));
                      toast.success('Profile updated');
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          ) : null}

          {activeTab === 'Password' ? (
            <Card>
              <CardBody>
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
                <div className="text-sm font-semibold text-[rgb(var(--text))]">Theme</div>
                <ThemeSettings
                  theme={theme}
                  onChange={async (theme) => {
                    await settingsService.updateTheme({ theme });
                    toast.success('Theme updated');
                  }}
                />
              </CardBody>
            </Card>
          ) : null}

          {activeTab === 'Org' ? (
            <Card>
              <CardBody>
                {orgQuery.data ? <OrgSettings org={orgQuery.data} /> : <div className="text-sm text-slate-400">Organization settings available to superadmin only.</div>}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardBody className="space-y-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Account Snapshot</div>
            <div className="space-y-2 text-sm text-slate-300">
              <p>Name: {profile.name}</p>
              <p>Email: {profile.email}</p>
              <p>Role: {profile.role}</p>
              <p>Employee ID: {profile.employeeId || 'Pending'}</p>
              <p>Designation: {profile.designation || '-'}</p>
              <p>Department: {profile.department || '-'}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}
