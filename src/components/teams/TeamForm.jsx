import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { DropdownField } from '../shared/DropdownField';

const schema = z.object({
  name: z.string().min(2, 'Team name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  members: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
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

export function TeamForm({ initialValues, members = [], onSubmit, onCancel }) {
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
      name: '',
      description: '',
      color: '#3b82f6',
      members: [],
      isActive: true,
    },
  });

  const membersValue = watch('members');
  const memberOptions = useMemo(
    () =>
      (Array.isArray(members) ? members : []).map((member) => ({
        value: member.id || member._id,
        label: [member.name, member.role ? `(${member.role})` : '', member.department ? `• ${member.department}` : '']
          .filter(Boolean)
          .join(' '),
      })),
    [members],
  );

  const selectedMembers = useMemo(
    () =>
      (Array.isArray(members) ? members : []).filter((member) =>
        Array.isArray(membersValue) && membersValue.some((id) => String(id) === String(member.id || member._id)),
      ),
    [members, membersValue],
  );

  const membersLabel = selectedMembers.length
    ? `${selectedMembers
        .slice(0, 2)
        .map((member) => member.name || 'Member')
        .join(', ')}${selectedMembers.length > 2 ? ` +${selectedMembers.length - 2}` : ''}`
    : 'No members selected';

  useEffect(() => {
    if (!initialValues) {
      reset({
        name: '',
        description: '',
        color: '#3b82f6',
        members: [],
        isActive: true,
      });
      return;
    }

    reset({
      name: initialValues.name || '',
      description: initialValues.description || '',
      color: initialValues.color || '#3b82f6',
      members: extractIds(initialValues.members),
      isActive: typeof initialValues.isActive === 'boolean' ? initialValues.isActive : true,
    });
  }, [initialValues, reset]);

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Field label="Team Name" className="sm:col-span-1">
        <input className="input" {...register('name')} />
      </Field>
      <Field label="Color" className="sm:col-span-1">
        <input className="input h-11" type="color" {...register('color')} />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea className="input min-h-[96px]" {...register('description')} />
      </Field>
      <DropdownField
        label="Members"
        value={membersValue}
        onChange={(nextValue) => setValue('members', nextValue, { shouldValidate: true, shouldDirty: true })}
        placeholder="Select members"
        selectedLabel={membersLabel}
        options={memberOptions}
        multiple
        searchable
        searchPlaceholder="Search members..."
        className="sm:col-span-2"
      />
      <label className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.16)] bg-white/70 px-4 py-3 sm:col-span-2">
        <input type="checkbox" className="h-4 w-4" {...register('isActive')} />
        <span className="text-sm font-semibold text-[rgb(var(--text))]">Active team</span>
      </label>
      <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[rgb(var(--line)/0.16)] pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Save Team
        </Button>
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
