import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';
import { DatePickerField } from '../shared/DatePickerField';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const STATUS_OPTIONS = ['In Progress', 'Completed', 'On Hold', 'Cancelled'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const INVOICE_STATUS_OPTIONS = [
  'Not Started',
  'Advance Received',
  '50% Received',
  'Final Invoice Pending',
  'Invoice Submitted',
  'Mobilisation Advance Received',
  '1st Running Bill Submitted',
  'Retention Refund Pending',
  'LOI Received',
];

const schema = z.object({
  projectName: z.string().min(2, 'Project name is required'),
  clientName: z.string().min(2, 'Client name is required'),
  companySegment: z.string().optional(),
  projectType: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  projectValue: z.string().optional(),
  overallStatus: z.string().optional(),
  currentStage: z.string().optional(),
  stageCompletion: z.string().optional(),
  clientApprovalStatus: z.string().optional(),
  clientApprovalDate: z.string().optional(),
  actualEnd: z.string().optional(),
  nextActionRequired: z.string().optional(),
  responsibleEngineer: z.string().optional(),
  remarksOrBlockers: z.string().optional(),
  ceoMdReview: z.string().optional(),
  estimatedCompletion: z.string().optional(),
  priority: z.string().optional(),
  invoiceStatus: z.string().optional(),
  recv: z.string().optional(),
  balance: z.string().optional(),
});

export function ProjectForm({ initialValues, employees = [], onSubmit, onCancel }) {
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
      projectName: '',
      clientName: '',
      companySegment: 'Residential',
      projectType: 'Structural',
      location: '',
      startDate: '',
      targetDate: '',
      actualEnd: '',
      projectValue: '',
      overallStatus: 'In Progress',
      currentStage: 'Concept Design',
      stageCompletion: '0',
      clientApprovalStatus: 'Not Submitted',
      clientApprovalDate: '',
      nextActionRequired: '',
      responsibleEngineer: '',
      remarksOrBlockers: '',
      ceoMdReview: '',
      estimatedCompletion: '0',
      priority: 'Medium',
      invoiceStatus: '',
      recv: '',
      balance: '',
    },
  });
  const overallStatus = watch('overallStatus');
  const responsibleEngineer = watch('responsibleEngineer');
  const priority = watch('priority');
  const invoiceStatus = watch('invoiceStatus');

  useEffect(() => {
    if (initialValues) {
      reset({
        projectName: initialValues.projectName || '',
        clientName: initialValues.clientName || '',
        companySegment: initialValues.companySegment || 'Residential',
        projectType: Array.isArray(initialValues.projectType) ? initialValues.projectType.join(', ') : initialValues.projectType || '',
        location: initialValues.location || '',
        startDate: (initialValues.startDate || '').slice?.(0, 10) || '',
        targetDate: (initialValues.targetDate || '').slice?.(0, 10) || '',
        actualEnd: (initialValues.actualEnd || initialValues.actualEndDate || '').slice?.(0, 10) || '',
        projectValue: String(initialValues.projectValue ?? ''),
        overallStatus: initialValues.overallStatus || 'In Progress',
        currentStage: initialValues.currentStage || 'Concept Design',
        stageCompletion: String(initialValues.stageCompletion ?? 0),
        clientApprovalStatus: initialValues.clientApprovalStatus || 'Not Submitted',
        clientApprovalDate: (initialValues.clientApprovalDate || '').slice?.(0, 10) || '',
        nextActionRequired: initialValues.nextActionRequired || '',
        responsibleEngineer: initialValues.responsibleEngineer?._id || initialValues.responsibleEngineer?.id || initialValues.responsibleEngineer || '',
        remarksOrBlockers: initialValues.remarksOrBlockers || [initialValues.remarks, initialValues.blockers].filter(Boolean).join(' | '),
        ceoMdReview: initialValues.ceoMdReview || '',
        estimatedCompletion: String(initialValues.estimatedCompletion ?? 0),
        priority: initialValues.priority || 'Medium',
        invoiceStatus: initialValues.invoiceStatus || '',
        recv: String(initialValues.recv ?? ''),
        balance: String(initialValues.balance ?? ''),
      });
    }
  }, [initialValues, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      setSubmitError('');
      await onSubmit({
        ...values,
        projectType: values.projectType ? values.projectType.split(',').map((item) => item.trim()).filter(Boolean) : [],
        projectValue: Number(values.projectValue || 0),
        stageCompletion: Number(values.stageCompletion || 0),
        clientApprovalDate: values.clientApprovalDate || undefined,
        actualEnd: values.actualEnd || undefined,
        responsibleEngineer: values.responsibleEngineer || undefined,
        remarksOrBlockers: values.remarksOrBlockers || '',
        ceoMdReview: values.ceoMdReview || '',
        estimatedCompletion: Number(values.estimatedCompletion || 0),
        recv: Number(values.recv || 0),
        balance: Number(values.balance || 0),
      });
    } catch (error) {
      setSubmitError(error?.response?.data?.message || error?.message || 'Could not save project');
    }
  });

  return (
    <form className="grid gap-3 sm:grid-cols-2 sm:gap-4" onSubmit={submit}>
      <Field label="Project Name" error={errors.projectName?.message}>
        <input className="input" {...register('projectName')} />
      </Field>
      <Field label="Client Name" error={errors.clientName?.message}>
        <input className="input" {...register('clientName')} />
      </Field>
      <Field label="Company Segment">
        <input className="input" {...register('companySegment')} />
      </Field>
      <Field label="Project Type">
        <input className="input" {...register('projectType')} />
      </Field>
      <Field label="Location">
        <input className="input" {...register('location')} />
      </Field>
      <Field label="Project Value">
        <input className="input" type="number" step="0.01" {...register('projectValue')} />
      </Field>
      <DatePickerField label="Start Date" value={watch('startDate')} onChange={(nextValue) => setValue('startDate', nextValue, { shouldDirty: true, shouldValidate: true })} />
      <DatePickerField label="Planned End" value={watch('targetDate')} onChange={(nextValue) => setValue('targetDate', nextValue, { shouldDirty: true, shouldValidate: true })} />
      <DatePickerField label="Actual End" value={watch('actualEnd')} onChange={(nextValue) => setValue('actualEnd', nextValue, { shouldDirty: true, shouldValidate: true })} />
      <DropdownField
        label="Overall Status"
        value={overallStatus}
        onChange={(nextValue) => setValue('overallStatus', nextValue, { shouldDirty: true, shouldValidate: true })}
        placeholder="Select project status"
        selectedLabel={overallStatus || 'Select project status'}
        options={STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
      />
      <Field label="Current Stage">
        <input className="input" {...register('currentStage')} />
      </Field>
      <Field label="Stage Completion">
        <input className="input" type="number" min="0" max="100" {...register('stageCompletion')} />
      </Field>
      <Field label="Client Approval">
        <input className="input" {...register('clientApprovalStatus')} />
      </Field>
      <DatePickerField label="Client Approval Date" value={watch('clientApprovalDate')} onChange={(nextValue) => setValue('clientApprovalDate', nextValue, { shouldDirty: true, shouldValidate: true })} />
      <DropdownField
        label="Responsible Engineer"
        value={responsibleEngineer}
        onChange={(nextValue) => setValue('responsibleEngineer', nextValue, { shouldDirty: true, shouldValidate: true })}
        placeholder="Select responsible engineer"
        selectedLabel={
          employees.find((employee) => String(employee.id || employee._id) === String(responsibleEngineer))?.name ||
          employees.find((employee) => String(employee.id || employee._id) === String(responsibleEngineer))?.label ||
          employees.find((employee) => String(employee.id || employee._id) === String(responsibleEngineer))?.email ||
          'Select responsible engineer'
        }
        options={employees.map((employee) => {
          const employeeId = employee.id || employee._id;
          return {
            value: employeeId,
            label: employee.name || employee.label || employee.email,
          };
        })}
      />
      <Field label="Next Action">
        <input className="input" {...register('nextActionRequired')} />
      </Field>
      <Field label="Remarks / Blockers" className="sm:col-span-2">
        <textarea className="input min-h-[96px]" {...register('remarksOrBlockers')} />
      </Field>
      <Field label="CEO / MD Review">
        <input className="input" {...register('ceoMdReview')} />
      </Field>
      <Field label="Estimated Completion">
        <input className="input" type="number" min="0" max="100" {...register('estimatedCompletion')} />
      </Field>
      <DropdownField
        label="Priority"
        value={priority}
        onChange={(nextValue) => setValue('priority', nextValue, { shouldDirty: true, shouldValidate: true })}
        placeholder="Select priority"
        selectedLabel={priority || 'Select priority'}
        options={PRIORITY_OPTIONS.map((option) => ({ value: option, label: option }))}
      />
      <DropdownField
        label="Invoice Status"
        value={invoiceStatus}
        onChange={(nextValue) => setValue('invoiceStatus', nextValue, { shouldDirty: true, shouldValidate: true })}
        placeholder="Select billing status"
        selectedLabel={invoiceStatus || 'Select billing status'}
        options={INVOICE_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
      />
      <Field label="Received">
        <input className="input" type="number" step="0.01" {...register('recv')} />
      </Field>
      <Field label="Balance">
        <input className="input" type="number" step="0.01" {...register('balance')} />
      </Field>
      <SubmitErrorAlert className="sm:col-span-2" message={submitError} title="Could not save project" />

      <div className="sm:col-span-2 mt-2 flex flex-col gap-3 border-t border-[rgb(var(--line)/0.16)] bg-[rgb(var(--panel)/0.96)] px-5 py-4 -mx-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Save Project
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}
