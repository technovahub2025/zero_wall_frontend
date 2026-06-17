export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  project_manager: 'Project Manager',
  employee: 'Employee',
};

export const ROLE_COLORS = {
  superadmin: '#F0A428',
  admin: '#2E83F5',
  project_manager: '#7C3AED',
  employee: '#22C97A',
};

export function canDo(userRole, action) {
  const permissions = {
    createProject: ['superadmin', 'admin', 'project_manager'],
    deleteProject: ['superadmin'],
    assignTask: ['superadmin', 'admin', 'project_manager'],
    approveStage: ['superadmin', 'admin', 'project_manager'],
    inviteMember: ['superadmin', 'admin', 'project_manager'],
    addEmployee: ['superadmin', 'admin', 'project_manager'],
    deleteEmployee: ['superadmin'],
    viewClients: ['superadmin', 'admin'],
    createClient: ['superadmin', 'admin', 'project_manager'],
    editClient: ['superadmin', 'admin', 'project_manager'],
    deleteClient: ['superadmin', 'admin'],
    viewCEODash: ['superadmin'],
    viewAllProjects: ['superadmin', 'admin', 'project_manager'],
    viewReports: ['superadmin', 'admin', 'project_manager'],
    viewBilling: ['superadmin', 'admin'],
    createTask: ['superadmin', 'admin', 'project_manager'],
    editTask: ['superadmin', 'admin', 'project_manager'],
    createStage: ['superadmin', 'admin', 'project_manager'],
    editStage: ['superadmin', 'admin', 'project_manager'],
  };

  return permissions[action]?.includes(userRole) ?? false;
}

export function getHomePathForRole(role) {
  if (role === 'superadmin') return '/dashboard';
  if (role === 'admin') return '/projects';
  if (role === 'project_manager') return '/projects';
  return '/my-tasks';
}
