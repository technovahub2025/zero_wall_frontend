import { Badge } from '../ui/badge';

export function StageTimeline({ stages = [] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {stages.map((stage, index) => (
        <div
          key={`${stage.stageNo}-${stage.stageName}-${index}`}
          className="theme-panel-muted min-w-[220px] rounded-2xl border p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-[rgb(var(--text))]">{stage.stageNo}</div>
            <Badge tone={stage.stageStatus === 'Completed' ? 'green' : stage.stageStatus === 'In Progress' ? 'blue' : 'amber'}>{stage.stageStatus}</Badge>
          </div>
          <div className="mt-2 text-sm font-medium text-[rgb(var(--text))]">{stage.stageName}</div>
          <div className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{stage.stageDescription || stage.deliverable || 'No description'}</div>
        </div>
      ))}
    </div>
  );
}
