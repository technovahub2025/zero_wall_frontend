import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';
import { DatePickerField } from '../shared/DatePickerField';
import { SubmitErrorAlert } from '../shared/SubmitErrorAlert';

const schema = z.object({
  stageNo: z.string().min(1),
  stageName: z.string().min(1),
  stageDescription: z.string().optional(),
  stageStart: z.string().optional(),
  stageEndPlanned: z.string().optional(),
  stageEndActual: z.string().optional(),
  stageStatus: z.string().optional(),
  deliverable: z.string().optional(),
  clientApprovalStatus: z.string().optional(),
  clientApprovalDate: z.string().optional(),
  submittedToClientOn: z.string().optional(),
  clientComments: z.string().optional(),
  nextAction: z.string().optional(),
  responsibleEngineer: z.string().optional(),
  approvalRequired: z.string().optional(),
  disciplines: z.string().optional(),
  duration: z.string().optional(),
});

export function StageForm({
  initialValues,
  employees = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save Stage',
  submitDisabled = false,
}) {
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      stageNo: 'Stage 1',
      stageName: 'Concept Design',
      stageDescription: '',
      stageStart: '',
      stageEndPlanned: '',
      stageEndActual: '',
      stageStatus: 'Not Started',
      deliverable: '',
      clientApprovalStatus: 'Not Submitted',
      clientApprovalDate: '',
      submittedToClientOn: '',
      clientComments: '',
      nextAction: '',
      responsibleEngineer: '',
      approvalRequired: '',
      disciplines: '',
      duration: '',
    },
  });
  const responsibleEngineer = watch('responsibleEngineer');

  useEffect(() => {
    if (initialValues) {
      reset({
        stageNo: initialValues.stageNo || 'Stage 1',
        stageName: initialValues.stageName || 'Concept Design',
        stageDescription: initialValues.stageDescription || '',
        stageStart: (initialValues.stageStart || '').slice?.(0, 10) || '',
        stageEndPlanned: (initialValues.stageEndPlanned || '').slice?.(0, 10) || '',
        stageEndActual: (initialValues.stageEndActual || '').slice?.(0, 10) || '',
        stageStatus: initialValues.stageStatus || 'Not Started',
        deliverable: initialValues.deliverable || '',
        clientApprovalStatus: initialValues.clientApprovalStatus || 'Not Submitted',
        clientApprovalDate: (initialValues.clientApprovalDate || '').slice?.(0, 10) || '',
        submittedToClientOn: (initialValues.submittedToClientOn || '').slice?.(0, 10) || '',
        clientComments: initialValues.clientComments || '',
        nextAction: initialValues.nextAction || '',
        responsibleEngineer: initialValues.responsibleEngineer?._id || initialValues.responsibleEngineer?.id || initialValues.responsibleEngineer || '',
        approvalRequired: initialValues.approvalRequired || '',
        disciplines: initialValues.disciplines || '',
        duration: initialValues.duration || '',
      });
    }
  }, [initialValues, reset]);

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={handleSubmit(async (values) => {
        try {
          setSubmitError('');
          await onSubmit(values);
        } catch (error) {
          setSubmitError(error?.response?.data?.message || error?.message || 'Could not save stage');
        }
      })}
    >
      <Field label="Stage No" error={errors.stageNo?.message}><input className="input" {...register('stageNo')} /></Field>
      <Field label="Stage Name" error={errors.stageName?.message}><input className="input" {...register('stageName')} /></Field>
      <Field label="Description" className="sm:col-span-2"><textarea className="input min-h-[96px]" {...register('stageDescription')} /></Field>
      <DatePickerField label="Stage Start" value={watch('stageStart')} onChange={(nextValue) => setValue('stageStart', nextValue, { shouldDirty: true, shouldValidate: true })} />
      <DatePickerField label="Planned End" value={watch('stageEndPlanned')} onChange={(nextValue) => setValue('stageEndPlanned', nextValue, { shouldDirty: true, shouldValidate: true })} />
      <DatePickerField label="Actual End" value={watch('stageEndActual')} onChange={(nextValue) => setValue('stageEndActual', nextValue, { shouldDirty: true, shouldValidate: true })} />
      <Field label="Stage Status" error={errors.stageStatus?.message}><input className="input" {...register('stageStatus')} /></Field>
      <Field label="Deliverable" error={errors.deliverable?.message}><input className="input" {...register('deliverable')} /></Field>
      <Field label="Approval Status" error={errors.clientApprovalStatus?.message}><input className="input" {...register('clientApprovalStatus')} /></Field>
      <DatePickerField label="Approval Date" value={watch('clientApprovalDate')} onChange={(nextValue) => setValue('clientApprovalDate', nextValue, { shouldDirty: true, shouldValidate: true })} error={errors.clientApprovalDate?.message} />
      <DatePickerField label="Submitted To Client On" value={watch('submittedToClientOn')} onChange={(nextValue) => setValue('submittedToClientOn', nextValue, { shouldDirty: true, shouldValidate: true })} error={errors.submittedToClientOn?.message} />
      <DropdownField
        label="Responsible Engineer"
        value={responsibleEngineer}
        onChange={(nextValue) => setValue('responsibleEngineer', nextValue, { shouldDirty: true, shouldValidate: true })}
        placeholder="Unassigned"
        selectedLabel={
          employees.find((employee) => String(employee.id || employee._id) === String(responsibleEngineer))?.name ||
          employees.find((employee) => String(employee.id || employee._id) === String(responsibleEngineer))?.label ||
          employees.find((employee) => String(employee.id || employee._id) === String(responsibleEngineer))?.email ||
          'Unassigned'
        }
        options={employees.map((employee) => {
          const employeeId = employee.id || employee._id;
          return {
            value: employeeId,
            label: employee.name || employee.label || employee.email,
          };
        })}
        emptyValue=""
      />
      <Field label="Approval Required" error={errors.approvalRequired?.message}><input className="input" {...register('approvalRequired')} /></Field>
      <Field label="Disciplines" error={errors.disciplines?.message} className="sm:col-span-2"><input className="input" {...register('disciplines')} /></Field>
      <Field label="Duration" error={errors.duration?.message}><input className="input" {...register('duration')} /></Field>
      <Field label="Comments" error={errors.clientComments?.message}><input className="input" {...register('clientComments')} /></Field>
      <Field label="Next Action" error={errors.nextAction?.message} className="sm:col-span-2"><input className="input" {...register('nextAction')} /></Field>
      <SubmitErrorAlert className="sm:col-span-2" message={submitError} title="Could not save stage" />
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || submitDisabled}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}
