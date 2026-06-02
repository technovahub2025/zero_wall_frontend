import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Bell,
  ChartPie,
  BarChart3,
  Columns3,
  FolderKanban,
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
import { navItems } from '../../config/navigation';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

const iconMap = {
  LayoutDashboard,
  ChartPie,
  FolderKanban,
  Columns3,
  Route,
  Users,
  ReceiptText,
  BarChart3,
};

function NavIcon({ name, className }) {
  const Icon = iconMap[name] || LayoutDashboard;
  return <Icon className={className} />;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, theme, toggleTheme } = useUiStore();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  async function handleLogout() {
    try {
      await api.post('/api/auth/logout');
      toast.success('Logged out');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Logout failed');
    }
  }

  function handleNewProject() {
    navigate('/projects', { state: { openProjectDialog: true } });
  }

  function handleNotifications() {
    toast('2 approvals pending, 1 invoice awaiting review');
  }

  function handleSettings() {
    toast('Settings panel opened');
  }

  return (
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
            <div className="flex items-center gap-3 border-b border-[rgb(var(--line)/0.16)] px-5 py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 font-display text-sm font-bold text-slate-950">
                PG
              </div>
              <div className={cn('min-w-0', sidebarCollapsed && 'lg:hidden')}>
                <div className="font-display text-[15px] font-bold tracking-wide">PG Infrastructure</div>
                <div className="text-xs text-slate-400">Project Suite</div>
              </div>
            </div>

            <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-6">
                <div>
                  <p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500', sidebarCollapsed && 'lg:hidden')}>
                    Overview
                  </p>
                  <div className="space-y-1">
                    {navItems.slice(0, 2).map((item) => (
                      <SidebarLink key={item.path} item={item} collapsed={sidebarCollapsed} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500', sidebarCollapsed && 'lg:hidden')}>
                    Projects
                  </p>
                  <div className="space-y-1">
                    {navItems.slice(2, 5).map((item) => (
                      <SidebarLink key={item.path} item={item} collapsed={sidebarCollapsed} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={cn('mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500', sidebarCollapsed && 'lg:hidden')}>
                    Team
                  </p>
                  <div className="space-y-1">
                    {navItems.slice(5).map((item) => (
                      <SidebarLink key={item.path} item={item} collapsed={sidebarCollapsed} />
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            <div className="border-t border-[rgb(var(--line)/0.16)] p-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.84)] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 font-semibold text-white">
                  SA
                </div>
                <div className={cn('min-w-0 flex-1', sidebarCollapsed && 'lg:hidden')}>
                  <div className="truncate text-sm font-semibold">Super Admin</div>
                  <div className="text-xs text-sky-300">Superadmin</div>
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
                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  Project operations dashboard
                </p>
              </div>

              <div className="hidden min-w-[260px] max-w-[420px] flex-1 items-center gap-2 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] px-3 py-2 text-sm text-slate-500 md:flex">
                <Search className="h-4 w-4" />
                <span className="truncate">Search projects, clients, invoices, approvals...</span>
              </div>

              <Button variant="secondary" className="hidden md:inline-flex" onClick={handleNewProject}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel-2)/0.82)] text-[rgb(var(--text))] transition hover:bg-[rgb(var(--panel-2)/0.96)]"
                aria-label="Notifications"
                onClick={handleNotifications}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-400" />
              </button>
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
            </div>
          </header>

          <main className="relative min-w-0 flex-1 overflow-x-hidden">
            <div className="soft-grid absolute inset-0 pointer-events-none opacity-25" />
            <div className="relative min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ item, collapsed }) {
  const theme = useUiStore((state) => state.theme);
  const isLight = theme === 'light';

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
      <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
      <span className={cn('min-w-0 flex-1 truncate', collapsed && 'lg:hidden')}>{item.label}</span>
      {item.badge ? (
        <span className={cn('rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300', collapsed && 'lg:hidden')}>
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  );
}
