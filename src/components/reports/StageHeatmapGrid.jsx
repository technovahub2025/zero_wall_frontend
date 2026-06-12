import { Layers3 } from 'lucide-react';
import { VirtualList } from '../shared/VirtualList';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';

export function StageHeatmapGrid({ data = [] }) {
  const renderStageRow = (row) => (
    <div className="grid gap-2">
      <div className="text-xs font-semibold text-[rgb(var(--text))]">{row.projectName}</div>
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {Object.entries(row.stages || {}).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
            <div className="text-slate-400">{label}</div>
            <div className="mt-1 font-semibold text-[rgb(var(--text))]">{value}%</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="self-start overflow-hidden border border-[rgb(var(--line)/0.12)] bg-white/92 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.45)] backdrop-blur">
      <CardHeader className="items-center justify-between bg-gradient-to-r from-white/96 via-white/92 to-sky-50/50">
        <CardTitle className="inline-flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/10">
            <Layers3 className="h-4 w-4" />
          </span>
          Stage Heatmap
        </CardTitle>
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{data.length} projects</div>
      </CardHeader>
      <CardBody className="min-h-0">
        {data.length ? (
          data.length > 6 ? (
            <VirtualList
              items={data}
              estimateSize={148}
              className="scrollbar-none h-[min(46vh,420px)] pr-1"
              renderItem={(row) => <div className="pb-3">{renderStageRow(row)}</div>}
            />
          ) : (
            <div className="scrollbar-none max-h-[320px] space-y-3 overflow-auto pr-1">
              {data.map((row) => (
                <div key={row.projectId} className="grid gap-2">
                  <div className="text-xs font-semibold text-[rgb(var(--text))]">{row.projectName}</div>
                  <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-4">
                    {Object.entries(row.stages || {}).map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                        <div className="text-slate-400">{label}</div>
                        <div className="mt-1 font-semibold text-[rgb(var(--text))]">{value}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-sm text-slate-400">No stage data.</div>
        )}
      </CardBody>
    </Card>
  );
}
