import { Badge } from '../ui/badge';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/card';
import { DataTable } from '../shared/DataTable';
import { BookOpen } from 'lucide-react';
import { stageGuideRows } from '../../data/stageGuide';

export function StageGuideCard({ id }) {
  return (
    <Card id={id} className="self-start">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[rgb(var(--muted))]" />
          Stage Guide
        </CardTitle>
        <Badge tone="amber">Reference</Badge>
      </CardHeader>
      <CardBody className="max-h-[calc(100vh-240px)] overflow-auto p-0">
        <DataTable
          columns={[
            { key: 'no', label: 'Stage' },
            { key: 'name', label: 'Name' },
            { key: 'approvalRequired', label: 'Approval' },
            { key: 'disciplines', label: 'Disciplines' },
            { key: 'duration', label: 'Duration' },
          ]}
          rows={stageGuideRows}
          rowKey={(row) => row.no}
        />
      </CardBody>
    </Card>
  );
}
