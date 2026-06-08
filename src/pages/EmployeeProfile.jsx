import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  BadgeInfo,
  Building2,
  CalendarDays,
  Clock3,
  FolderKanban,
  LayoutGrid,
  Mail,
  ListTodo,
  Phone,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { buildAvatarUrl } from '../utils/avatarUrl';
import { useEmployees, useEmployee, useEmployeeTasks, useEmployeeWorkload, useUpdateEmployee, useUpdateEmployeeRole } from '../hooks/useEmployees';
import { useCreateTask, useUpdateTask } from '../hooks/useTasks';
import { AvatarUpload } from '../components/upload/AvatarUpload';
import { EmployeeProfileTabs } from '../components/employees/EmployeeProfileTabs';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { EmployeeTimesheetTab } from '../components/employees/EmployeeTimesheetTab';
import { EmployeeWorkload } from '../components/employees/EmployeeWorkload';
import { EmployeeDocuments } from '../components/employees/EmployeeDocuments';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { ModalShell } from '../components/shared/ModalShell';
import { DropdownField } from '../components/shared/DropdownField';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FilterChips } from '../components/shared/FilterChips';
import { useProjects } from '../hooks/useProjects';
import { useTeams } from '../hooks/useTeams';
import { useUiStore } from '../store/uiStore';

const tabs = ['Profile', 'Assigned Tasks', 'Timesheets', 'Workload', 'Documents'];

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const employeeQuery = useEmployee(id);
  const employeesQuery = useEmployees();
  const tasksQuery = useEmployeeTasks(id);
  const workloadQuery = useEmployeeWorkload(id);
  const projectsQuery = useProjects();
  const teamsQuery = useTeams();
  const updateEmployee = useUpdateEmployee();
  const updateEmployeeRole = useUpdateEmployeeRole();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const openConfirm = useUiStore((state) => state.openConfirm);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const [activeTab, setActiveTab] = useState('Profile');
  const [taskFilter, setTaskFilter] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const employee = employeeQuery.data;
  const taskData = tasksQuery.data || {};
  const projects = employee?.projects?.length ? employee.projects : projectsQuery.data || [];
  const teams = teamsQuery.data || [];
  const employees = employeesQuery.data || [];
  const tasks = taskData.tasks || [];
  const employeeProjects = useMemo(
    () =>
      (projects || []).map((project) => ({
        id: project.id || project._id,
        projectName: project.projectName,
        clientName: project.clientName,
        overallStatus: project.overallStatus,
        currentStage: project.currentStage,
      })),
    [projects],
  );
  const taskCounts = taskData.counts || {};
  const workloadHours = Number(workloadQuery.data?.totalHours || 0);
  const lastSeen = employee?.updatedAt || employee?.createdAt || null;
  const avatarSrc = useMemo(() => buildAvatarUrl(employee?.avatar, employee?.updatedAt), [employee?.avatar, employee?.updatedAt]);
  const profileStats = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status !== 'done').length;
    return [
      { label: 'Projects', value: employeeProjects.length, hint: 'Linked projects', icon: FolderKanban, tone: 'blue' },
      { label: 'Tasks', value: tasks.length, hint: 'Assigned tasks', icon: ListTodo, tone: 'amber' },
      { label: 'Open', value: openTasks, hint: 'Pending work', icon: Clock3, tone: 'rose' },
      { label: 'Hours', value: workloadHours.toFixed(1), hint: 'Logged hours', icon: Clock3, tone: 'green' },
    ];
  }, [employeeProjects.length, tasks, workloadHours]);
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    return tasks.filter((task) => task.status === taskFilter);
  }, [taskFilter, tasks]);

  if (employeeQuery.isLoading) {
    return <SkeletonCard />;
  }

  if (!employee) {
    return (
      <EmptyState
        title="Employee not found"
        description="The requested employee could not be loaded."
        action={<Button onClick={() => navigate('/employees')}>Back to Employees</Button>}
      />
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AvatarUpload
              avatar={avatarSrc}
              name={employee.name}
              uploadMode="employee"
              employeeId={employee.id}
            />
            <div className="space-y-3">
              <div>
                <p className="hero-kicker">Employee Profile</p>
                <h1 className="hero-title">{employee.name}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="amber">{employee.employeeId || 'Pending'}</Badge>
                <Badge tone="blue">{employee.role}</Badge>
                <Badge tone="slate">{employee.department || 'Unassigned'}</Badge>
                <Badge tone={employee.isActive ? 'green' : 'rose'}>{employee.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="hero-subtitle flex flex-wrap items-center gap-2">
                <span>{employee.designation || 'Employee'}</span>
                <span className="text-slate-400">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {employee.joiningDate ? format(new Date(employee.joiningDate), 'dd MMM yyyy') : '—'}
                </span>
                {lastSeen ? (
                  <>
                    <span className="text-slate-400">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      Updated {format(new Date(lastSeen), 'dd MMM yyyy')}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <UserCog className="h-4 w-4" />
                Edit Profile
              </Button>
              {currentUser?.role === 'superadmin' ? (
                <Button variant="secondary" onClick={() => setRoleOpen(true)}>
                  <ShieldCheck className="h-4 w-4" />
                  Change Role
                </Button>
              ) : null}
              <Button onClick={() => forgotPassword({ email: employee.email })}>
                <Mail className="h-4 w-4" />
                Send reset email
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {profileStats.map(({ label, value, hint, icon: Icon, tone }) => (
          <Card key={label}>
            <CardBody className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span>{label}</span>
                </div>
                <div className="mt-3 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
                <div className="mt-1 text-xs text-slate-500">{hint}</div>
              </div>
              <Badge tone={tone}>{label}</Badge>
            </CardBody>
          </Card>
        ))}
      </section>

      <div className="rounded-2xl border border-white/10 bg-white/55 p-2 shadow-sm backdrop-blur">
        <EmployeeProfileTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'Profile' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <Card>
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Employee ID', value: employee.employeeId, icon: BadgeInfo },
                { label: 'Full Name', value: employee.name, icon: UserCog },
                { label: 'Email', value: employee.email, icon: Mail },
                { label: 'Phone', value: employee.phone, icon: Phone },
                { label: 'Designation', value: employee.designation, icon: UserCog },
                { label: 'Department', value: employee.department, icon: Building2 },
                { label: 'Role', value: employee.role, icon: ShieldCheck },
                { label: 'Joining Date', value: employee.joiningDate ? format(new Date(employee.joiningDate), 'dd MMM yyyy') : '-', icon: CalendarDays },
                { label: 'Status', value: employee.isActive ? 'Active' : 'Inactive', icon: Users },
                { label: 'Created By', value: employee.createdBy?.name || '-', icon: UserCog },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-[rgb(var(--line)/0.14)] bg-white/70 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{label}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[rgb(var(--text))]">{String(value || '-')}</div>
                </div>
              ))}
            </CardBody>
          </Card>

          <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Quick Actions</div>
                    <div className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">Focused controls</div>
                  </div>
                  <Badge tone={employee.isActive ? 'green' : 'rose'}>{employee.isActive ? 'online' : 'offline'}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                    <UserCog className="h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setActiveTab('Assigned Tasks')}>
                    <ListTodo className="h-4 w-4" />
                    View Tasks
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Work Summary</div>
                  <div className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">{workloadHours.toFixed(1)} hours logged</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-[rgb(var(--line)/0.14)] bg-white/70 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Assigned Projects</div>
                    <div className="mt-2 text-lg font-semibold text-[rgb(var(--text))]">{employeeProjects.length}</div>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--line)/0.14)] bg-white/70 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Current Tasks</div>
                    <div className="mt-2 text-lg font-semibold text-[rgb(var(--text))]">{tasks.length}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === 'Assigned Tasks' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card className="overflow-hidden">
            <CardBody className="flex min-h-[32rem] flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <FilterChips
                  value={taskFilter}
                  onChange={setTaskFilter}
                  options={[
                    { label: 'All', value: 'all' },
                    { label: 'Todo', value: 'todo' },
                    { label: 'In Progress', value: 'in-progress' },
                    { label: 'Review', value: 'review' },
                    { label: 'Done', value: 'done' },
                  ]}
                />
                <Button onClick={() => { setEditingTask(null); setTaskOpen(true); }}>
                  <ListTodo className="h-4 w-4" />
                  Add Task
                  </Button>
                </div>
              <div className="scrollbar-none min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} showProject compact onClick={() => setEditingTask(task)} />
                ))}
                {!filteredTasks.length ? <EmptyState title="No tasks for this filter" description="Try another status or create a task." /> : null}
              </div>
            </CardBody>
          </Card>

          <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Task Overview</div>
                    <div className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">Live counts from the API</div>
                  </div>
                  <Badge tone="blue">{taskCounts.total || tasks.length} total</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {[
                    ['Todo', taskCounts.todo || 0],
                    ['In Progress', taskCounts['in-progress'] || 0],
                    ['Review', taskCounts.review || 0],
                    ['Done', taskCounts.done || 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-[rgb(var(--line)/0.14)] bg-white/70 p-4">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
                      <div className="mt-2 text-xl font-semibold text-[rgb(var(--text))]">{value}</div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Project Links</div>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {employeeProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="w-full rounded-2xl border border-[rgb(var(--line)/0.14)] bg-white/70 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50/70"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[rgb(var(--text))]">{project.projectName}</div>
                          <div className="mt-1 truncate text-xs text-slate-500">{project.clientName || 'Client not set'}</div>
                        </div>
                        <Badge tone={project.overallStatus === 'Completed' ? 'green' : project.overallStatus === 'On Hold' ? 'amber' : 'blue'}>
                          {project.overallStatus || 'Live'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                  {!employeeProjects.length ? <div className="rounded-2xl border border-dashed border-[rgb(var(--line)/0.18)] p-4 text-sm text-slate-500">No linked projects.</div> : null}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === 'Timesheets' ? (
        <Card>
          <CardBody className="p-4 sm:p-5">
            <EmployeeTimesheetTab employeeId={id} />
          </CardBody>
        </Card>
      ) : null}
      {activeTab === 'Workload' ? (
        <Card>
          <CardBody className="p-4 sm:p-5">
            <EmployeeWorkload data={workloadQuery.data} employeeId={id} />
          </CardBody>
        </Card>
      ) : null}
      {activeTab === 'Documents' ? (
        <Card>
          <CardBody className="p-4 sm:p-5">
            <EmployeeDocuments employeeId={id} />
          </CardBody>
        </Card>
      ) : null}

      {editOpen ? (
        <ModalShell title="Edit Profile" description="Update employee profile." onClose={() => setEditOpen(false)}>
          <EmployeeForm
            initialValues={employee}
            onCancel={() => setEditOpen(false)}
            onSubmit={async (values) => {
              const { role, ...payload } = values;
              await updateEmployee.mutateAsync({ id: employee.id, payload });

              if (role && role !== employee.role) {
                await updateEmployeeRole.mutateAsync({ id: employee.id, payload: { role } });
              }

              setEditOpen(false);
            }}
          />
        </ModalShell>
      ) : null}

      {roleOpen ? (
        <ModalShell title="Change Role" description="Update employee role." onClose={() => setRoleOpen(false)} widthClassName="max-w-xl">
          <RoleChangeForm
            role={employee.role}
            onCancel={() => setRoleOpen(false)}
            onSubmit={async (payload) => {
              await updateEmployeeRole.mutateAsync({ id: employee.id, payload });
              setRoleOpen(false);
            }}
          />
        </ModalShell>
      ) : null}

      {taskOpen || editingTask ? (
        <ModalShell
          title={editingTask ? 'Edit Task' : 'Add Task'}
          description="Assign a task to this employee."
          onClose={() => {
            setTaskOpen(false);
            setEditingTask(null);
          }}
        >
            <TaskForm
              initialValues={editingTask || { assignee: employee.id }}
              assignee={employee.id}
              currentUser={currentUser}
              reporter={currentUser?.id || ''}
              projects={projects}
              teams={teams}
              employees={employees}
              onCancel={() => {
                setTaskOpen(false);
                setEditingTask(null);
              }}
              onSubmit={async (values) => {
                const payload = {
                  ...values,
                  assignee: values.assignee || employee.id,
                  project: values.project,
                };
              if (editingTask) {
                await updateTask.mutateAsync({ id: editingTask.id, payload });
              } else {
                await createTask.mutateAsync(payload);
              }
              setTaskOpen(false);
              setEditingTask(null);
            }}
          />
        </ModalShell>
      ) : null}
    </motion.div>
  );
}

function RoleChangeForm({ role, onSubmit, onCancel }) {
  const [nextRole, setNextRole] = useState(role || 'employee');
  return (
    <div className="space-y-4">
      <Field label="Role">
        <DropdownField
          value={nextRole}
          onChange={(nextValue) => setNextRole(nextValue)}
          options={[
            { value: 'employee', label: 'Employee' },
            { value: 'admin', label: 'Admin' },
            { value: 'project_manager', label: 'Project Manager' },
          ]}
          placeholder="Select role"
        />
      </Field>
      <div className="flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit({ role: nextRole })}>Save</Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
