import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';

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

export function StageForm({ initialValues, employees = [], onSubmit, onCancel }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
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
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Field label="Stage No"><input className="input" {...register('stageNo')} /></Field>
      <Field label="Stage Name"><input className="input" {...register('stageName')} /></Field>
      <Field label="Description" className="sm:col-span-2"><textarea className="input min-h-[96px]" {...register('stageDescription')} /></Field>
      <Field label="Stage Start"><input className="input" type="date" {...register('stageStart')} /></Field>
      <Field label="Planned End"><input className="input" type="date" {...register('stageEndPlanned')} /></Field>
      <Field label="Actual End"><input className="input" type="date" {...register('stageEndActual')} /></Field>
      <Field label="Stage Status"><input className="input" {...register('stageStatus')} /></Field>
      <Field label="Deliverable"><input className="input" {...register('deliverable')} /></Field>
      <Field label="Approval Status"><input className="input" {...register('clientApprovalStatus')} /></Field>
      <Field label="Approval Date"><input className="input" type="date" {...register('clientApprovalDate')} /></Field>
      <Field label="Submitted To Client On"><input className="input" type="date" {...register('submittedToClientOn')} /></Field>
      <Field label="Responsible Engineer">
        <select className="input" {...register('responsibleEngineer')}>
          <option value="">Unassigned</option>
          {employees.map((employee) => {
            const employeeId = employee.id || employee._id;
            return (
              <option key={employeeId} value={employeeId}>
                {employee.name || employee.label || employee.email}
              </option>
            );
          })}
        </select>
      </Field>
      <Field label="Approval Required"><input className="input" {...register('approvalRequired')} /></Field>
      <Field label="Disciplines" className="sm:col-span-2"><input className="input" {...register('disciplines')} /></Field>
      <Field label="Duration"><input className="input" {...register('duration')} /></Field>
      <Field label="Comments"><input className="input" {...register('clientComments')} /></Field>
      <Field label="Next Action" className="sm:col-span-2"><input className="input" {...register('nextAction')} /></Field>
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Save Stage</Button>
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
