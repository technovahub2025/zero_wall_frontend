import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';
import { EmptyChartState } from './chartUtils';

export function ReportChartCard({
  title,
  description,
  emptyLabel,
  hasData = false,
  children,
  footer = null,
  metric = null,
  heightClassName = 'h-[340px]',
}) {
  return (
    <Card className="group h-full overflow-hidden border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.88)] shadow-[0_24px_70px_-48px_rgba(15,23,42,0.7)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_30px_85px_-48px_rgba(15,23,42,0.85)]">
      <CardHeader className="border-b border-[rgb(var(--line)/0.1)] bg-[rgb(var(--panel-2)/0.5)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            {description ? <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{description}</p> : null}
          </div>
          {metric ? <div className="shrink-0">{metric}</div> : null}
        </div>
      </CardHeader>
      <CardBody className={heightClassName}>
        {hasData ? children : <EmptyChartState label={emptyLabel} />}
      </CardBody>
      {footer ? <div className="border-t border-[rgb(var(--line)/0.1)] bg-[rgb(var(--panel-2)/0.5)] px-5 pb-4">{footer}</div> : null}
    </Card>
  );
}
