import { cn } from '../../lib/utils';

export function EmployeeProfileTabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            'shrink-0 rounded-full px-3 py-2 text-sm font-semibold transition',
            activeTab === tab
              ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/20'
              : 'bg-white/5 text-slate-300 hover:bg-white/10',
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
