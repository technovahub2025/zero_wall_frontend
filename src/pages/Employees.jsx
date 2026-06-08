import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  UserPlus,
  UserX,
  Users,
  UserCheck,
} from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useEmployees, useCreateEmployee, useUpdateEmployee } from '../hooks/useEmployees';
import { EmployeeTable } from '../components/employees/EmployeeTable';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { ModalShell } from '../components/shared/ModalShell';
import { SearchInput } from '../components/shared/SearchInput';
import { FilterChips } from '../components/shared/FilterChips';
import { SkeletonTable } from '../components/shared/SkeletonTable';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardBody } from '../components/ui/card';
import { useUiStore } from '../store/uiStore';
import { useDebouncedValue } from '../utils/performance';
import { useNavigate } from 'react-router-dom';

const departmentOptions = [
  { label: 'All', value: 'all' },
  { label: 'Structural', value: 'Structural' },
  { label: 'Architectural', value: 'Architectural' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'PEB', value: 'PEB' },
  { label: 'Management', value: 'Management' },
];

export default function Employees() {
  const navigate = useNavigate();
  const [department, setDepartment] = useState('all');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const employeesQuery = useEmployees({ search: debouncedSearch, department });
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const openConfirm = useUiStore((state) => state.openConfirm);

  const employees = useMemo(() => employeesQuery.data || [], [employeesQuery.data]);
  const stats = useMemo(() => {
    const active = employees.filter((employee) => employee.isActive).length;
    const inactive = employees.length - active;
    const managers = employees.filter((employee) => ['admin', 'project_manager'].includes(employee.role)).length;
    const departments = new Set(employees.map((employee) => employee.department).filter(Boolean)).size;

    return [
      { label: 'Total Employees', value: employees.length, note: 'All loaded records', icon: Users, tone: 'blue' },
      { label: 'Active', value: active, note: 'Currently enabled', icon: UserCheck, tone: 'green' },
      { label: 'Inactive', value: inactive, note: 'Archived or blocked', icon: UserX, tone: 'rose' },
      { label: 'Managers', value: managers, note: 'Admin and PM roles', icon: CircleUserRound, tone: 'amber' },
      { label: 'Teams', value: departments, note: 'Unique departments', icon: Building2, tone: 'blue' },
    ];
  }, [employees]);

  function openEmployee(employee) {
    navigate(`/employees/${employee.id}`);
  }

  function editEmployee(employee) {
    setEditingEmployee(employee);
    setFormOpen(true);
  }

  function toggleEmployeeStatus(employee) {
    const nextActive = !employee.isActive;
    openConfirm({
      title: nextActive ? 'Reactivate employee' : 'Deactivate employee',
      message: `${nextActive ? 'Reactivate' : 'Deactivate'} ${employee.name}?`,
      confirmLabel: nextActive ? 'Activate' : 'Deactivate',
      tone: nextActive ? 'blue' : 'rose',
      onConfirm: async () => {
        await updateEmployee.mutateAsync({ id: employee.id, payload: { isActive: nextActive } });
      },
    });
  }

  function deleteEmployee(employee) {
    openConfirm({
      title: 'Delete employee',
      message: `Delete ${employee.name}? This will deactivate the account and remove access.`,
      confirmLabel: 'Delete',
      tone: 'rose',
      onConfirm: async () => {
        await updateEmployee.mutateAsync({ id: employee.id, payload: { isActive: false } });
      },
    });
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="hero-kicker">Employees</p>
            <h1 className="hero-title">Employee system</h1>
            <p className="hero-subtitle max-w-3xl">Manage people, invite members, and review assignments, workloads, and documents.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setEditingEmployee(null); setFormOpen(true); }}>
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, note, icon: Icon, tone }) => (
          <Card key={label}>
            <CardBody className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span>{label}</span>
                </div>
                <div className="mt-3 text-2xl font-semibold text-[rgb(var(--text))]">{value}</div>
                <div className="mt-1 text-xs text-slate-500">{note}</div>
              </div>
              <Badge tone={tone}>{label}</Badge>
            </CardBody>
          </Card>
        ))}
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <SearchInput
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search employees..."
        />
        <FilterChips options={departmentOptions} value={department} onChange={setDepartment} />
      </div>

      {employeesQuery.isError ? (
        <Card>
          <CardBody className="flex items-center gap-3 py-10">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[rgb(var(--text))]">{employeesQuery.error?.message || 'Failed to load employees'}</div>
              <div className="text-xs text-slate-500">Try again after a moment.</div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody className="space-y-4 p-0">
          <div className="flex flex-col gap-2 border-b border-[rgb(var(--line)/0.14)] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Employee Directory</div>
              <div className="mt-2 text-sm text-slate-500">
                Showing {employees.length} employee{employees.length === 1 ? '' : 's'} across {stats[4]?.value || 0} teams and {stats[3]?.value || 0} managers
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="slate">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                {department === 'all' ? 'All departments' : department}
              </Badge>
            </div>
          </div>

          {employeesQuery.isLoading ? (
            <SkeletonTable rows={6} columns={7} />
          ) : employees.length ? (
            <EmployeeTable
              rows={employees}
              onOpen={openEmployee}
              onEdit={editEmployee}
              onToggleStatus={toggleEmployeeStatus}
              onDelete={deleteEmployee}
            />
          ) : (
            <div className="px-5 py-8">
              <EmptyState title="No employees found" description="Adjust the search or department filter." />
            </div>
          )}
        </CardBody>
      </Card>

      {formOpen ? (
        <ModalShell
          title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
          description="Save people updates using the live API."
          onClose={() => setFormOpen(false)}
          widthClassName="max-w-4xl"
        >
          <EmployeeForm
            initialValues={editingEmployee}
            onCancel={() => setFormOpen(false)}
            onSubmit={async (values) => {
              if (editingEmployee) {
                await updateEmployee.mutateAsync({ id: editingEmployee.id, payload: values });
              } else {
                await createEmployee.mutateAsync(values);
              }
              setFormOpen(false);
            }}
          />
        </ModalShell>
      ) : null}
    </motion.div>
  );
}
