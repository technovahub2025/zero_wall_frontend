import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pageVariants } from '../utils/motionVariants';
import { useAuthStore } from '../store/authStore';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployee, useEmployeeTasks, useEmployeeWorkload, useUpdateEmployee, useUpdateEmployeeRole } from '../hooks/useEmployees';
import { useCreateTask, useDeleteTask, useUpdateTask } from '../hooks/useTasks';
import { AvatarUpload } from '../components/upload/AvatarUpload';
import { EmployeeProfileTabs } from '../components/employees/EmployeeProfileTabs';
import { EmployeeTimesheetTab } from '../components/employees/EmployeeTimesheetTab';
import { EmployeeWorkload } from '../components/employees/EmployeeWorkload';
import { EmployeeDocuments } from '../components/employees/EmployeeDocuments';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { EmptyState } from '../components/shared/EmptyState';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { ModalShell } from '../components/shared/ModalShell';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FilterChips } from '../components/shared/FilterChips';
import { useProjects } from '../hooks/useProjects';
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
  const updateEmployee = useUpdateEmployee();
  const updateEmployeeRole = useUpdateEmployeeRole();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
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
  const employees = employeesQuery.data || [];
  const tasks = taskData.tasks || [];
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    return tasks.filter((task) => task.status === taskFilter);
  }, [taskFilter, tasks]);

  if (employeeQuery.isLoading) {
    return <SkeletonCard />;
  }

  if (!employee) {
    return <EmptyState title="Employee not found" description="The requested employee could not be loaded." action={<Button onClick={() => navigate('/employees')}>Back to Employees</Button>} />;
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <AvatarUpload avatar={employee.avatar} name={employee.name} />
            <div>
              <p className="hero-kicker">Employee Profile</p>
              <h1 className="hero-title">{employee.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="amber">{employee.employeeId || 'Pending'}</Badge>
                <Badge tone="blue">{employee.role}</Badge>
                <Badge tone="slate">{employee.department || 'Unassigned'}</Badge>
              </div>
              <p className="hero-subtitle mt-3">{employee.designation || 'Employee'} · Joined {employee.joiningDate ? format(new Date(employee.joiningDate), 'dd MMM yyyy') : '—'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit Profile</Button>
            {currentUser?.role === 'superadmin' ? <Button variant="secondary" onClick={() => setRoleOpen(true)}>Change Role</Button> : null}
            <Button onClick={() => forgotPassword({ email: employee.email })}>Send password reset email</Button>
          </div>
        </div>
      </section>

      <EmployeeProfileTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'Profile' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <Card>
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {[
                ['Employee ID', employee.employeeId],
                ['Full Name', employee.name],
                ['Email', employee.email],
                ['Phone', employee.phone],
                ['Designation', employee.designation],
                ['Department', employee.department],
                ['Role', employee.role],
                ['Joining Date', employee.joiningDate ? format(new Date(employee.joiningDate), 'dd MMM yyyy') : '-'],
                ['Status', employee.isActive ? 'Active' : 'Inactive'],
                ['Created By', employee.createdBy?.name || '-'],
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
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Quick Actions</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>Edit Profile</Button>
                  <Button size="sm" variant="secondary" onClick={() => setActiveTab('Assigned Tasks')}>View Tasks</Button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Password Reset</div>
                <div className="mt-2 text-sm text-slate-300">Send a password reset email to the employee.</div>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {activeTab === 'Assigned Tasks' ? (
        <div className="space-y-4">
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
            <Button onClick={() => { setEditingTask(null); setTaskOpen(true); }}>Add Task</Button>
          </div>
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showProject
                onClick={() => setEditingTask(task)}
              />
            ))}
            {!filteredTasks.length ? <EmptyState title="No tasks for this filter" description="Try another status or create a task." /> : null}
          </div>
        </div>
      ) : null}

      {activeTab === 'Timesheets' ? <EmployeeTimesheetTab employeeId={id} /> : null}
      {activeTab === 'Workload' ? <EmployeeWorkload data={workloadQuery.data} /> : null}
      {activeTab === 'Documents' ? <EmployeeDocuments employeeId={id} /> : null}

      {editOpen ? (
        <ModalShell title="Edit Profile" description="Update employee profile." onClose={() => setEditOpen(false)}>
          <EmployeeEditForm
            employee={employee}
            onCancel={() => setEditOpen(false)}
            onSubmit={async (payload) => {
              await updateEmployee.mutateAsync({ id: employee.id, payload });
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
            projects={projects}
            employees={employees}
            onCancel={() => {
              setTaskOpen(false);
              setEditingTask(null);
            }}
            onSubmit={async (values) => {
              const payload = {
                ...values,
                assignee: employee.id,
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

function EmployeeEditForm({ employee, onSubmit, onCancel }) {
  const [name, setName] = useState(employee.name || '');
  const [phone, setPhone] = useState(employee.phone || '');
  const [designation, setDesignation] = useState(employee.designation || '');
  const [department, setDepartment] = useState(employee.department || '');

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Phone"><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <Field label="Designation"><input className="input" value={designation} onChange={(e) => setDesignation(e.target.value)} /></Field>
      <Field label="Department">
        <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">Select</option>
          <option value="Structural">Structural</option>
          <option value="Architectural">Architectural</option>
          <option value="Electrical">Electrical</option>
          <option value="PEB">PEB</option>
          <option value="Management">Management</option>
        </select>
      </Field>
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit({ name, phone, designation, department })}>Save</Button>
      </div>
    </div>
  );
}

function RoleChangeForm({ role, onSubmit, onCancel }) {
  const [nextRole, setNextRole] = useState(role || 'employee');
  return (
    <div className="space-y-4">
      <Field label="Role">
        <select className="input" value={nextRole} onChange={(e) => setNextRole(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
        </select>
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
