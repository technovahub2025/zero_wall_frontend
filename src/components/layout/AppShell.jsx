import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  BarChart3,
  ChartPie,
  Columns3,
  FolderKanban,
  Bell,
  LogOut,
  Menu,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  LayoutDashboard,
  MoonStar,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  SunMedium,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { RoleGuard } from './RoleGuard';
import { ROLE_LABELS } from '../../utils/roleUtils';
import logo from '../../assets/logo.png';
import { ConfirmModal } from '../shared/ConfirmModal';
import { TimerWidget } from '../timer/TimerWidget';
import { useTimer } from '../../hooks/useTimer';
import { useSocket } from '../../hooks/useSocket';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useDeleteNotification } from '../../hooks/useNotifications';
import { useNotificationStore } from '../../store/notificationStore';
import { NotificationBell } from '../notifications/NotificationBell';
import { NotificationPanel } from '../notifications/NotificationPanel';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, theme, toggleTheme } = useUiStore();
  const panelOpen = useNotificationStore((state) => state.panelOpen);
  const togglePanel = useNotificationStore((state) => state.togglePanel);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const deleteNotification = useDeleteNotification();
  useSocket();
  useTimer();
  useNotifications();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed');
    }
  }

  function handleNewProject() {
    navigate('/projects', { state: { openProjectDialog: true } });
  }

  function handleSettings() {
    navigate('/settings');
  }

  return (
    <>
    <ConfirmModal />
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1920px]">
        <aside
          className={cn(
            'glass-panel fixed inset-y-0 left-0 z-40 w-[292px] -translate-x-full shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:translate-x-0',
            sidebarCollapsed ? 'lg:w-[92px]' : 'lg:w-[292px]',
            sidebarOpen ? 'translate-x-0' : '',
          )}
        >
          <div className="flex h-full flex-col lg:overflow-y-auto">
            <div className="flex items-center justify-center border-b border-[rgb(var(--line)/0.16)] px-5 py-5">
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-white ring-1 ring-[rgb(var(--line)/0.14)]',
                  sidebarCollapsed ? 'h-16 w-16' : 'h-[76px] w-full max-w-[236px]',
                )}
              >
                <img src={logo} alt="PG Infrastructure logo" className="h-full w-full object-contain p-2" />
              </div>
            </div>

            <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-6">
                <div>
                  <p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500', sidebarCollapsed && 'lg:hidden')}>
                    Personal
                  </p>
                  <div className="space-y-1">
                    <SidebarLink item={{ label: 'My Tasks', path: '/my-tasks', icon: 'LayoutDashboard' }} collapsed={sidebarCollapsed} />
                    <SidebarLink item={{ label: 'My Timesheets', path: '/my-timesheets', icon: 'BarChart3' }} collapsed={sidebarCollapsed} />
                    <SidebarLink item={{ label: 'Profile', path: '/profile', icon: 'Users' }} collapsed={sidebarCollapsed} />
                    <SidebarLink item={{ label: 'Notifications', path: '/notifications', icon: 'Bell' }} collapsed={sidebarCollapsed} />
                    <SidebarLink item={{ label: 'Clients', path: '/clients', icon: 'Users' }} collapsed={sidebarCollapsed} />
                    <RoleGuard roles={['employee']}>
                      <SidebarLink item={{ label: 'Kanban', path: '/kanban', icon: 'Columns3' }} collapsed={sidebarCollapsed} />
                    </RoleGuard>
                  </div>
                </div>

                <RoleGuard roles={['superadmin', 'admin', 'project_manager']}>
                  <div>
                    <p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500', sidebarCollapsed && 'lg:hidden')}>
                      Operations
                    </p>
                    <div className="space-y-1">
                      <SidebarLink item={{ label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' }} collapsed={sidebarCollapsed} />
                      <SidebarLink item={{ label: 'Projects', path: '/projects', icon: 'FolderKanban' }} collapsed={sidebarCollapsed} />
                      <SidebarLink item={{ label: 'Kanban', path: '/kanban', icon: 'Columns3' }} collapsed={sidebarCollapsed} />
                      <SidebarLink item={{ label: 'Stage Detail', path: '/stages', icon: 'Route' }} collapsed={sidebarCollapsed} />
                      <SidebarLink item={{ label: 'Employees', path: '/employees', icon: 'Users' }} collapsed={sidebarCollapsed} />
                      <SidebarLink item={{ label: 'Team', path: '/team', icon: 'Users' }} collapsed={sidebarCollapsed} />
                      <SidebarLink item={{ label: 'Reports', path: '/reports', icon: 'BarChart3' }} collapsed={sidebarCollapsed} />
                    </div>
                  </div>
                </RoleGuard>

                <RoleGuard roles={['superadmin', 'admin']}>
                  <div>
                    <p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500', sidebarCollapsed && 'lg:hidden')}>
                      Finance
                    </p>
                    <div className="space-y-1">
                      <SidebarLink item={{ label: 'Billing', path: '/billing', icon: 'ReceiptText' }} collapsed={sidebarCollapsed} />
                    </div>
                  </div>
                </RoleGuard>

                <RoleGuard roles={['superadmin']}>
                  <div>
                    <p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500', sidebarCollapsed && 'lg:hidden')}>
                      Executive
                    </p>
                    <div className="space-y-1">
                      <SidebarLink item={{ label: 'CEO / MD View', path: '/ceo', icon: 'ChartPie' }} collapsed={sidebarCollapsed} />
                      <SidebarLink item={{ label: 'Settings', path: '/settings', icon: 'Settings2' }} collapsed={sidebarCollapsed} />
                    </div>
                  </div>
                </RoleGuard>
              </div>
            </nav>

            <div className="border-t border-[rgb(var(--line)/0.16)] p-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.84)] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-amber-500 font-semibold text-white">
                  {(user?.name || 'Z')[0]?.toUpperCase()}
                </div>
                <div className={cn('min-w-0 flex-1', sidebarCollapsed && 'lg:hidden')}>
                  <div className="truncate text-sm font-semibold">{user?.name || 'Signed in user'}</div>
                  <div className="text-xs text-sky-300">{ROLE_LABELS[user?.role] || user?.role || 'Employee'}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-9 w-9 shrink-0 rounded-xl px-0"
                  onClick={handleLogout}
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-0">
          <header className="glass-panel sticky top-0 z-20 border-x-0 border-t-0 shadow-none">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.96)] lg:hidden"
                onClick={() => useUiStore.getState().toggleSidebar()}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.96)] lg:inline-flex"
                onClick={toggleSidebarCollapsed}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="font-display text-base font-semibold tracking-wide text-[rgb(var(--text))] sm:text-lg">
                  PG Infrastructure
                </div>
                <p className="truncate text-xs text-slate-500 sm:text-sm">Project master tracker</p>
              </div>

              <div className="hidden min-w-[260px] max-w-[420px] flex-1 items-center gap-2 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] px-3 py-2 text-sm text-slate-500 md:flex">
                <Search className="h-4 w-4" />
                <span className="truncate">Search projects, clients, invoices, approvals...</span>
              </div>

              <Button variant="secondary" className="hidden md:inline-flex" onClick={handleNewProject}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
              <div className="hidden md:block">
                <TimerWidget />
              </div>
              <NotificationBell count={unreadCount} onClick={togglePanel} />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.96)]"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.96)]"
                aria-label="Settings"
                onClick={handleSettings}
              >
                <Settings2 className="h-4 w-4" />
              </button>
              <div className="md:hidden">
                <TimerWidget />
              </div>
            </div>
          </header>

          <main className="relative min-w-0 flex-1 overflow-x-hidden pb-10">
            <div className="soft-grid absolute inset-0 pointer-events-none opacity-25" />
            <div className="relative min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>

        <NotificationPanel
          open={panelOpen}
          notifications={notifications}
          onClose={() => useNotificationStore.getState().setPanelOpen(false)}
          onRead={(id) => markRead.mutate(id)}
          onDelete={(id) => deleteNotification.mutate(id)}
          onMarkAllRead={() => markAllRead.mutate()}
        />
      </div>
    </div>
    </>
  );
}

function SidebarLink({ item, collapsed }) {
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';
  const iconMap = {
    LayoutDashboard,
    ChartPie,
    FolderKanban,
    Columns3,
    Route,
    Users,
    ReceiptText,
    BarChart3,
    Settings2,
    Bell,
  };
  const Icon = iconMap[item.icon] || LayoutDashboard;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition',
          isActive
            ? isLight
              ? 'bg-sky-100 text-sky-800 ring-1 ring-sky-200'
              : 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20'
            : isLight
              ? 'text-slate-600 hover:bg-sky-50 hover:text-sky-800'
              : 'text-slate-300 hover:bg-[rgb(var(--panel-2)/0.8)] hover:text-white',
          collapsed && 'lg:justify-center lg:px-0',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn('min-w-0 flex-1 truncate', collapsed && 'lg:hidden')}>{item.label}</span>
      {item.badge ? (
        <span className={cn('rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300', collapsed && 'lg:hidden')}>
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  );
}
