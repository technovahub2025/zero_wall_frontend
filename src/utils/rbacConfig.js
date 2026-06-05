export const ROLE_PERMISSIONS = {
  superadmin: {
    routes: ['/dashboard', '/projects', '/projects/:id', '/kanban', '/stages', '/ceo', '/employees', '/employees/:id', '/team', '/billing', '/reports', '/settings', '/clients', '/clients/:id'],
  },
  admin: {
    routes: ['/dashboard', '/projects', '/projects/:id', '/kanban', '/stages', '/employees', '/employees/:id', '/team', '/billing', '/reports', '/clients', '/clients/:id'],
  },
  project_manager: {
    routes: ['/dashboard', '/projects', '/projects/:id', '/kanban', '/stages', '/employees', '/employees/:id', '/team', '/reports', '/clients', '/clients/:id'],
  },
  employee: {
    routes: ['/my-tasks', '/my-timesheets', '/profile', '/notifications', '/clients', '/clients/:id'],
  },
};

export function canAccessRoute(role, path) {
  if (!role) return false;
  const routes = ROLE_PERMISSIONS[role]?.routes || [];
  return routes.some((route) => route === path || (route.endsWith('/:id') && path.startsWith(route.slice(0, -4))));
}
