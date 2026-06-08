import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';

const schema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  project: z.string().min(1, 'Project is required'),
  stage: z.string().optional(),
  team: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
  reporter: z.string().optional(),
  assignedTeam: z.array(z.string()).optional(),
  nextAction: z.string().optional(),
  tags: z.string().optional(),
});

function extractId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
}

function extractIds(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => extractId(item)).filter(Boolean);
}

export function TaskForm({
  initialValues,
  projects = [],
  teams = [],
  employees = [],
  currentUser = null,
  assignee = '',
  reporter = '',
  assignedTeam = [],
  onSubmit,
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      project: '',
      stage: '',
      team: '',
      priority: 'Medium',
      status: 'todo',
      startDate: '',
      dueDate: '',
      assignee,
      reporter,
      assignedTeam: extractIds(assignedTeam),
      nextAction: '',
      tags: '',
    },
  });
  const projectValue = watch('project');
  const teamValue = watch('team');
  const assigneeValue = watch('assignee');
  const reporterValue = watch('reporter');
  const assignedTeamValue = watch('assignedTeam');

  useEffect(() => {
    if (initialValues) {
      reset({
        title: initialValues.title || '',
        description: initialValues.description || '',
        project: initialValues.projectId || initialValues.project?.id || initialValues.project?._id || initialValues.project || '',
        stage: initialValues.stageId || initialValues.stage?.id || initialValues.stage?._id || initialValues.stage || '',
        team: extractId(initialValues.team) || '',
        priority: initialValues.priority || 'Medium',
        status: initialValues.status || 'todo',
        startDate: (initialValues.startDate || '').slice?.(0, 10) || '',
        dueDate: (initialValues.dueDate || '').slice?.(0, 10) || '',
        assignee: extractId(initialValues.assignee) || assignee || '',
        reporter: extractId(initialValues.reporter) || extractId(initialValues.createdBy) || reporter || '',
        assignedTeam: extractIds(initialValues.assignedTeam),
        nextAction: initialValues.nextAction || '',
        tags: Array.isArray(initialValues.tags) ? initialValues.tags.join(', ') : initialValues.tags || '',
      });
    }
  }, [assignee, assignedTeam, initialValues, reporter, reset]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id || project._id) === String(projectValue)),
    [projectValue, projects],
  );
  const employeeOptionsSource = useMemo(() => {
    const list = Array.isArray(employees) ? [...employees] : [];
    const currentUserId = currentUser?.id || currentUser?._id || '';
    if (currentUserId && !list.some((employee) => String(employee.id || employee._id) === String(currentUserId))) {
      list.unshift(currentUser);
    }
    return list;
  }, [currentUser, employees]);
  const selectedAssignee = useMemo(
    () => employeeOptionsSource.find((employee) => String(employee.id || employee._id) === String(assigneeValue)),
    [assigneeValue, employeeOptionsSource],
  );
  const selectedReporter = useMemo(
    () => employeeOptionsSource.find((employee) => String(employee.id || employee._id) === String(reporterValue)),
    [employeeOptionsSource, reporterValue],
  );
  const selectedAssignedTeam = useMemo(
    () =>
      employeeOptionsSource.filter((employee) =>
        Array.isArray(assignedTeamValue) && assignedTeamValue.some((item) => String(item) === String(employee.id || employee._id)),
      ),
    [assignedTeamValue, employeeOptionsSource],
  );
  const projectOptions = useMemo(
    () =>
      projects.map((project) => {
        const projectId = project.id || project._id;
        return {
          value: projectId,
          label: project.projectName || project.name || 'Untitled project',
        };
      }),
    [projects],
  );
  const assigneeOptions = useMemo(
    () =>
      employeeOptionsSource.map((employee) => {
        const employeeId = employee.id || employee._id;
        return {
          value: employeeId,
          label: employee.name || employee.label || employee.email || 'Unnamed user',
        };
      }),
    [employeeOptionsSource],
  );
  const teamOptions = useMemo(
    () =>
      Array.isArray(teams)
        ? teams.map((team) => ({
            value: team.id || team._id,
            label: team.name || team.label || 'Untitled team',
          }))
        : [],
    [teams],
  );
  const selectedTeam = useMemo(
    () => teams.find((team) => String(team.id || team._id) === String(teamValue)),
    [teamValue, teams],
  );
  const teamMembersLabel = selectedTeam
    ? `${selectedTeam.name || selectedTeam.label || 'Team'}${Array.isArray(selectedTeam.members) && selectedTeam.members.length ? ` • ${selectedTeam.members.length} members` : ''}`
    : 'No team selected';
  const assignedTeamLabel = selectedAssignedTeam.length
    ? `${selectedAssignedTeam
        .slice(0, 2)
        .map((employee) => employee.name || employee.label || employee.email || 'Unnamed user')
        .join(', ')}${selectedAssignedTeam.length > 2 ? ` +${selectedAssignedTeam.length - 2}` : ''}`
    : 'No team selected';

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Field label="Title"><input className="input" {...register('title')} /></Field>
      <DropdownField
        label="Project"
        value={projectValue}
        onChange={(nextValue) => setValue('project', nextValue, { shouldValidate: true, shouldDirty: true })}
        placeholder="Select project"
        selectedLabel={selectedProject ? (selectedProject.projectName || selectedProject.name || 'Select project') : 'Select project'}
        options={projectOptions}
        searchable
        searchPlaceholder="Search projects..."
        className="sm:col-span-1"
      />
      <DropdownField
        label="Team"
        value={teamValue}
        onChange={(nextValue) => setValue('team', nextValue, { shouldValidate: true, shouldDirty: true })}
        placeholder="No team"
        selectedLabel={selectedTeam ? teamMembersLabel : 'No team'}
        options={teamOptions}
        searchable
        searchPlaceholder="Search teams..."
        emptyValue=""
        className="sm:col-span-1"
      />
      <DropdownField
        label="Raised By"
        value={reporterValue}
        onChange={(nextValue) => setValue('reporter', nextValue, { shouldValidate: true, shouldDirty: true })}
        placeholder="Raised by"
        selectedLabel={selectedReporter ? (selectedReporter.name || selectedReporter.label || selectedReporter.email || 'Raised by') : 'Raised by'}
        options={assigneeOptions}
        searchable
        searchPlaceholder="Search reporter..."
        emptyValue=""
        className="sm:col-span-1"
      />
      <Field label="Description" className="sm:col-span-2"><textarea className="input min-h-[96px]" {...register('description')} /></Field>
      <Field label="Stage"><input className="input" {...register('stage')} /></Field>
      <Field label="Priority"><input className="input" {...register('priority')} /></Field>
      <Field label="Status"><input className="input" {...register('status')} /></Field>
      <Field label="Start Date"><input className="input" type="date" {...register('startDate')} /></Field>
      <Field label="Due Date"><input className="input" type="date" {...register('dueDate')} /></Field>
      <DropdownField
        label="Assignee"
        value={assigneeValue}
        onChange={(nextValue) => setValue('assignee', nextValue, { shouldValidate: true, shouldDirty: true })}
        placeholder="Unassigned"
        selectedLabel={selectedAssignee ? (selectedAssignee.name || selectedAssignee.label || selectedAssignee.email || 'Unassigned') : 'Unassigned'}
        options={assigneeOptions}
        searchable
        searchPlaceholder="Search employees..."
        emptyValue=""
        className="sm:col-span-1"
      />
      <DropdownField
        label="Team Members"
        value={assignedTeamValue}
        onChange={(nextValue) => setValue('assignedTeam', nextValue, { shouldValidate: true, shouldDirty: true })}
        placeholder="Select team"
        selectedLabel={assignedTeamLabel}
        options={assigneeOptions}
        multiple
        searchable
        searchPlaceholder="Search team members..."
        className="sm:col-span-1"
      />
      <Field label="Next Action" className="sm:col-span-2"><input className="input" {...register('nextAction')} /></Field>
      <Field label="Tags" className="sm:col-span-2"><input className="input" {...register('tags')} /></Field>
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Save Task</Button>
      </div>
    </form>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
