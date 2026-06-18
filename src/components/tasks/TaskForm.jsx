import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';
import { DatePickerField } from '../shared/DatePickerField';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'].map((value) => ({ value, label: value }));
const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];
const EMPTY_ARRAY = [];

function buildSchema(isEditing) {
  return z.object({
    title: z.string().min(2, 'Task title is required'),
    description: z.string().optional(),
    project: z.string().min(1, 'Project is required'),
    stage: z.string().optional(),
    team: z.string().optional(),
    priority: z.string().optional(),
    status: z.string().optional(),
    startDate: isEditing ? z.string().optional() : z.string().min(1, 'Start date is required'),
    dueDate: z.string().min(1, 'End date is required'),
    estimatedDurationHours: z.coerce.number().min(0).optional(),
    estimatedDurationMinutesRemainder: z.coerce.number().min(0).max(59).optional(),
    assignee: isEditing ? z.string().optional() : z.string().min(1, 'Assignee is required'),
    reporter: z.string().optional(),
    backupReviewer: z.string().optional(),
    assignedTeam: z.array(z.string()).optional(),
    nextAction: z.string().optional(),
    tags: z.string().optional(),
  });
}

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
  projects = EMPTY_ARRAY,
  teams = EMPTY_ARRAY,
  employees = EMPTY_ARRAY,
  currentUser = null,
  stageOptions = EMPTY_ARRAY,
  assignee = '',
  reporter = '',
  assignedTeam = EMPTY_ARRAY,
  onSubmit,
  onCancel,
}) {
  const isEditing = Boolean(initialValues?.id || initialValues?._id);
  const schema = useMemo(() => buildSchema(isEditing), [isEditing]);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
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
      estimatedDurationHours: 0,
      estimatedDurationMinutesRemainder: 0,
      assignee,
      reporter,
      backupReviewer: '',
      assignedTeam: extractIds(assignedTeam),
      nextAction: '',
      tags: '',
    },
  });
  const projectValue = watch('project');
  const stageValue = watch('stage');
  const teamValue = watch('team');
  const assigneeValue = watch('assignee');
  const reporterValue = watch('reporter');
  const backupReviewerValue = watch('backupReviewer');
  const assignedTeamValue = watch('assignedTeam');
  const estimatedHours = watch('estimatedDurationHours');
  const estimatedMinutes = watch('estimatedDurationMinutesRemainder');

  useEffect(() => {
    if (initialValues) {
      const estimatedDuration = Number(initialValues.estimatedDurationMinutes || 0);
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
        estimatedDurationHours: Math.floor(estimatedDuration / 60),
        estimatedDurationMinutesRemainder: estimatedDuration % 60,
        assignee: extractId(initialValues.assignee) || assignee || '',
        reporter: extractId(initialValues.reporter) || extractId(initialValues.createdBy) || reporter || '',
        backupReviewer: extractId(initialValues.backupReviewer) || '',
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
  const normalizedStageOptions = useMemo(
    () =>
      Array.isArray(stageOptions)
        ? stageOptions.map((stage) => ({
            value: stage.id || stage._id || stage.stageName || stage.stageNo,
            label: [stage.stageNo, stage.stageName].filter(Boolean).join(' - ') || stage.stageName || stage.stageNo || 'Untitled stage',
          }))
        : [],
    [stageOptions],
  );
  const selectedStage = useMemo(
    () => normalizedStageOptions.find((stage) => String(stage.value) === String(stageValue)),
    [normalizedStageOptions, stageValue],
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
  const selectedBackupReviewer = useMemo(
    () => employeeOptionsSource.find((employee) => String(employee.id || employee._id) === String(backupReviewerValue)),
    [backupReviewerValue, employeeOptionsSource],
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

  function handleTeamChange(nextValue) {
    setValue('team', nextValue, { shouldValidate: true, shouldDirty: true });
    const team = teams.find((item) => String(item.id || item._id) === String(nextValue));
    const memberIds = Array.isArray(team?.members)
      ? team.members.map((member) => extractId(member)).filter(Boolean)
      : [];
    setValue('assignedTeam', memberIds, { shouldValidate: true, shouldDirty: true });
  }

  function submitForm(values) {
    const estimatedDurationMinutes =
      Math.max(0, Number(values.estimatedDurationHours || 0)) * 60 +
      Math.max(0, Number(values.estimatedDurationMinutesRemainder || 0));
    const {
      estimatedDurationHours: _estimatedDurationHours,
      estimatedDurationMinutesRemainder: _estimatedDurationMinutesRemainder,
      ...payload
    } = values;
    return onSubmit({
      ...payload,
      estimatedDurationMinutes,
    });
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={handleSubmit(async (values) => {
        try {
          setSubmitError('');
          await submitForm(values);
        } catch (error) {
          setSubmitError(error?.response?.data?.message || error?.message || 'Could not save task');
        }
      })}
    >
      <Field label="Title" error={errors.title?.message}>
        <input className="input" placeholder="Enter task title" {...register('title')} />
      </Field>
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
      <FieldError message={errors.project?.message} className="sm:col-start-2" />
      <DropdownField
        label="Team"
        value={teamValue}
        onChange={handleTeamChange}
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
      {normalizedStageOptions.length ? (
        <DropdownField
          label="Stage"
          value={stageValue}
          onChange={(nextValue) => setValue('stage', nextValue, { shouldValidate: true, shouldDirty: true })}
          placeholder="No stage"
          selectedLabel={selectedStage?.label || 'No stage'}
          options={normalizedStageOptions}
          searchable
          searchPlaceholder="Search stages..."
          emptyValue=""
        />
      ) : (
        <Field label="Stage"><input className="input" placeholder="Stage name or number" {...register('stage')} /></Field>
      )}
      <DropdownField
        label="Priority"
        value={watch('priority')}
        onChange={(nextValue) => setValue('priority', nextValue || 'Medium', { shouldValidate: true, shouldDirty: true })}
        placeholder="Medium"
        selectedLabel={watch('priority') || 'Medium'}
        options={PRIORITY_OPTIONS}
        emptyValue="Medium"
      />
      <DropdownField
        label="Status"
        value={watch('status')}
        onChange={(nextValue) => setValue('status', nextValue || 'todo', { shouldValidate: true, shouldDirty: true })}
        placeholder="Todo"
        selectedLabel={STATUS_OPTIONS.find((item) => item.value === watch('status'))?.label || 'Todo'}
        options={STATUS_OPTIONS}
        emptyValue="todo"
      />
      <DatePickerField
        label="Start Date"
        value={watch('startDate')}
        onChange={(nextValue) => setValue('startDate', nextValue, { shouldDirty: true, shouldValidate: true })}
        error={errors.startDate?.message}
        clearable={isEditing}
      />
      <DatePickerField
        label="End Date"
        value={watch('dueDate')}
        onChange={(nextValue) => setValue('dueDate', nextValue, { shouldDirty: true, shouldValidate: true })}
        error={errors.dueDate?.message}
        clearable={false}
      />
      <div className="sm:col-span-2 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4">
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Task Timer</div>
          <div className="mt-1 text-xs text-slate-600">
            Set the completion timer for the assignee. Example: enter 1 hour and 0 minutes for a one-hour task.
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Timer Hours" error={errors.estimatedDurationHours?.message}>
          <input className="input" type="number" min="0" step="1" {...register('estimatedDurationHours')} />
        </Field>
        <Field label="Timer Minutes" error={errors.estimatedDurationMinutesRemainder?.message}>
          <input className="input" type="number" min="0" max="59" step="1" {...register('estimatedDurationMinutesRemainder')} />
        </Field>
        </div>
      </div>
      {Number(estimatedHours || 0) || Number(estimatedMinutes || 0) ? (
        <div className="sm:col-span-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-700">
          This task will use a locked completion timer after the employee starts it.
        </div>
      ) : null}
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
        error={errors.assignee?.message}
      />
      <DropdownField
        label="Backup Reviewer"
        value={backupReviewerValue}
        onChange={(nextValue) => setValue('backupReviewer', nextValue, { shouldValidate: true, shouldDirty: true })}
        placeholder="No reviewer"
        selectedLabel={selectedBackupReviewer ? (selectedBackupReviewer.name || selectedBackupReviewer.label || selectedBackupReviewer.email || 'Reviewer') : 'No reviewer'}
        options={assigneeOptions}
        searchable
        searchPlaceholder="Search reviewers..."
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
      {selectedTeam && selectedAssignedTeam.length ? (
        <div className="sm:col-span-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-xs text-sky-700">
          Team members were selected from {selectedTeam.name || selectedTeam.label || 'the selected team'}. You can still adjust them manually.
        </div>
      ) : null}
      <Field label="Next Action" className="sm:col-span-2"><input className="input" {...register('nextAction')} /></Field>
      <Field label="Tags" className="sm:col-span-2"><input className="input" {...register('tags')} /></Field>
      <SubmitErrorAlert className="sm:col-span-2" message={submitError} title="Could not save task" />
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Task'}</Button>
      </div>
    </form>
  );
}

function Field({ label, children, className = '', error = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message, className = '' }) {
  if (!message) return null;
  return <div className={`mt-1 text-xs font-medium text-rose-600 ${className}`}>{message}</div>;
}
