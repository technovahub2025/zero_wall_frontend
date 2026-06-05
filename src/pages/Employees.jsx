import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { pageVariants } from '../utils/motionVariants';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeactivateEmployee } from '../hooks/useEmployees';
import { EmployeeCard } from '../components/employees/EmployeeCard';
import { EmployeeTable } from '../components/employees/EmployeeTable';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { ModalShell } from '../components/shared/ModalShell';
import { SearchInput } from '../components/shared/SearchInput';
import { FilterChips } from '../components/shared/FilterChips';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { SkeletonTable } from '../components/shared/SkeletonTable';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/ui/button';
import { Card, CardBody } from '../components/ui/card';
import { useUiStore } from '../store/uiStore';
import { useDebouncedValue } from '../utils/performance';

const departmentOptions = [
  { label: 'All', value: 'all' },
  { label: 'Structural', value: 'Structural' },
  { label: 'Architectural', value: 'Architectural' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'PEB', value: 'PEB' },
  { label: 'Management', value: 'Management' },
];

export default function Employees() {
  const [department, setDepartment] = useState('all');
  const [view, setView] = useState('grid');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const employeesQuery = useEmployees({ search: debouncedSearch, department });
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deactivateEmployee = useDeactivateEmployee();
  const openConfirm = useUiStore((state) => state.openConfirm);

  const employees = useMemo(() => employeesQuery.data || [], [employeesQuery.data]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-8">
      <section className="theme-hero theme-hero-blue p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hero-kicker">Employees</p>
            <h1 className="hero-title">Employee system</h1>
            <p className="hero-subtitle max-w-3xl">Manage people, invite members, and review assignments, workloads, and documents.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setView(view === 'grid' ? 'table' : 'grid')}>{view === 'grid' ? 'List View' : 'Grid View'}</Button>
            <Button onClick={() => { setEditingEmployee(null); setFormOpen(true); }}>Add Employee</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <SearchInput value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search employees..." />
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

      {employeesQuery.isLoading ? (
        view === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : (
          <SkeletonTable rows={6} columns={7} />
        )
      ) : employees.length ? (
        view === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onOpen={(row) => window.location.assign(`/employees/${row.id}`)}
                onEdit={(row) => {
                  setEditingEmployee(row);
                  setFormOpen(true);
                }}
                onDeactivate={(row) =>
                  openConfirm({
                    title: 'Deactivate employee',
                    message: `Deactivate ${row.name}?`,
                    confirmLabel: 'Deactivate',
                    tone: 'rose',
                    onConfirm: async () => deactivateEmployee.mutateAsync(row.id),
                  })
                }
              />
            ))}
          </div>
        ) : (
          <EmployeeTable
            rows={employees}
            onOpen={(row) => window.location.assign(`/employees/${row.id}`)}
            onEdit={(row) => {
              setEditingEmployee(row);
              setFormOpen(true);
            }}
            onDeactivate={(row) =>
              openConfirm({
                title: 'Deactivate employee',
                message: `Deactivate ${row.name}?`,
                confirmLabel: 'Deactivate',
                tone: 'rose',
                onConfirm: async () => deactivateEmployee.mutateAsync(row.id),
              })
            }
          />
        )
      ) : (
        <EmptyState title="No employees found" description="Adjust the search or department filter." />
      )}

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
