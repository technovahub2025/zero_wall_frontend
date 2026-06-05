import { useEffect, Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AcceptInvite from './pages/AcceptInvite';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { ToastProvider } from './components/shared/ToastProvider';
import { useAuthStore } from './store/authStore';
import { RoleGuard } from './components/layout/RoleGuard';
import { PageLoader } from './components/shared/PageLoader';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { NetworkStatus } from './components/shared/NetworkStatus';
import { PWAInstallBanner } from './components/shared/PWAInstallBanner';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Kanban = lazy(() => import('./pages/Kanban'));
const StageDetail = lazy(() => import('./pages/StageDetail'));
const StageGuidePage = lazy(() => import('./pages/StageGuidePage'));
const CeoDashboard = lazy(() => import('./pages/CeoDashboard'));
const MyTasksPage = lazy(() => import('./pages/MyTasksPage'));
const MyTimesheetsPage = lazy(() => import('./pages/MyTimesheetsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Clients = lazy(() => import('./pages/Clients'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
      gcTime: 5 * 60 * 1000,
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function App() {
  const location = useLocation();
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider />
      <NetworkStatus />
      <PWAInstallBanner />
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route
                  path="/dashboard"
                  element={
                    <RoleGuard roles={['superadmin', 'admin', 'project_manager']} fallback={<Navigate to="/my-tasks" replace />}>
                      <Dashboard />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <RoleGuard roles={['superadmin', 'admin', 'project_manager']} fallback={<Navigate to="/my-tasks" replace />}>
                      <Projects />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/projects/:id"
                  element={
                    <RoleGuard roles={['superadmin', 'admin', 'project_manager']} fallback={<Navigate to="/my-tasks" replace />}>
                      <ProjectDetail />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/kanban"
                  element={
                    <RoleGuard roles={['superadmin', 'admin', 'project_manager', 'employee']} fallback={<Navigate to="/my-tasks" replace />}>
                      <Kanban />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/stages"
                  element={
                    <RoleGuard roles={['superadmin', 'admin', 'project_manager']} fallback={<Navigate to="/my-tasks" replace />}>
                      <StageDetail />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/stage-guide"
                  element={
                    <RoleGuard roles={['superadmin', 'admin', 'project_manager', 'employee']} fallback={<Navigate to="/my-tasks" replace />}>
                      <StageGuidePage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/ceo"
                  element={
                    <RoleGuard roles={['superadmin']} fallback={<Navigate to="/my-tasks" replace />}>
                      <CeoDashboard />
                    </RoleGuard>
                  }
                />
                <Route path="/my-tasks" element={<MyTasksPage />} />
                <Route path="/my-timesheets" element={<MyTimesheetsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/clients" element={<RoleGuard roles={['superadmin', 'admin', 'project_manager', 'employee']} fallback={<Navigate to="/my-tasks" replace />}><Clients /></RoleGuard>} />
                <Route path="/clients/:id" element={<RoleGuard roles={['superadmin', 'admin', 'project_manager', 'employee']} fallback={<Navigate to="/my-tasks" replace />}><Clients /></RoleGuard>} />
                <Route path="/employees" element={<RoleGuard roles={['superadmin', 'admin', 'project_manager']} fallback={<Navigate to="/my-tasks" replace />}><Employees /></RoleGuard>} />
                <Route path="/employees/:id" element={<RoleGuard roles={['superadmin', 'admin', 'project_manager']} fallback={<Navigate to="/my-tasks" replace />}><EmployeeProfile /></RoleGuard>} />
                <Route
                  path="/team"
                  element={
                    <RoleGuard roles={['superadmin', 'admin', 'project_manager']} fallback={<Navigate to="/my-tasks" replace />}>
                      <TeamPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <RoleGuard roles={['superadmin', 'admin']} fallback={<Navigate to="/my-tasks" replace />}>
                      <BillingPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <RoleGuard roles={['superadmin', 'admin', 'project_manager']} fallback={<Navigate to="/my-tasks" replace />}>
                      <ReportsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RoleGuard roles={['superadmin']} fallback={<Navigate to="/my-tasks" replace />}>
                      <SettingsPage />
                    </RoleGuard>
                  }
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
        </AnimatePresence>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
