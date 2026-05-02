'use client';

import { CheckCircle2, ClipboardList, Flame, ListTodo } from 'lucide-react';
import type { ReportDefinition } from '@/lib/api/reports';
import type { TaskStats } from '@/lib/api/tasks';
import type { LazyReportTabState } from '../../hooks/useLazyReportTabData';
import { count } from '../../report-number-format';
import { ChartCard } from '../charts/ChartCard';
import { KpiCard } from '../charts/KpiCard';
import { ReportBarChart, ReportPieChart, type ChartDatum } from '../charts/ReportCharts';
import { ReportActions } from './ReportActions';
import { ReportTabState } from './ReportTabState';

interface SpecialistsReportsTabProps {
  definitions: ReportDefinition[];
  state: LazyReportTabState<TaskStats>;
  creatingExportKey: string | null;
  onExport: (definition: ReportDefinition) => void;
}

export function SpecialistsReportsTab({
  definitions,
  state,
  creatingExportKey,
  onExport,
}: SpecialistsReportsTabProps) {
  const data = state.data;

  return (
    <div className="space-y-5">
      <ReportTabState {...state} />
      {data ? (
        <>
          <SpecialistKpis data={data} />
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="Task status" description="Current workload grouped by status.">
              <ReportBarChart data={statusChart(data)} />
            </ChartCard>
            <ChartCard title="Priority mix" description="Workload urgency by priority bucket.">
              <ReportPieChart data={priorityChart(data)} />
            </ChartCard>
          </div>
        </>
      ) : null}
      <ReportActions
        definitions={definitions}
        creatingExportKey={creatingExportKey}
        onExport={onExport}
      />
    </div>
  );
}

function SpecialistKpis({ data }: { data: TaskStats }) {
  const totalTasks = data.byStatus.reduce((sum, row) => sum + row._count, 0);
  const completed = findStatus(data, 'DONE') + findStatus(data, 'COMPLETED');
  const urgent = data.byPriority.find((row) => row.priority === 'HIGH')?._count ?? 0;

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Tasks" value={count(totalTasks)} icon={<ListTodo size={18} />} />
      <KpiCard label="Completed" value={count(completed)} icon={<CheckCircle2 size={18} />} />
      <KpiCard label="High priority" value={count(urgent)} icon={<Flame size={18} />} />
      <KpiCard
        label="Status buckets"
        value={count(data.byStatus.length)}
        icon={<ClipboardList size={18} />}
      />
    </section>
  );
}

function statusChart(data: TaskStats): ChartDatum[] {
  return data.byStatus.map((row) => ({ name: row.status, value: row._count }));
}

function priorityChart(data: TaskStats): ChartDatum[] {
  return data.byPriority.map((row) => ({ name: row.priority, value: row._count }));
}

function findStatus(data: TaskStats, status: string): number {
  return data.byStatus.find((row) => row.status === status)?._count ?? 0;
}
