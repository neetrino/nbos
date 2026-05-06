'use client';

import { Boxes, FolderKanban, GitBranch, ShieldAlert } from 'lucide-react';
import type { ReportDefinition, ReportExportFormat } from '@/lib/api/reports';
import type { LazyReportTabState } from '../../hooks/useLazyReportTabData';
import type { ProjectsReportsTabData } from '../../hooks/useReportTabData';
import { count } from '../../report-number-format';
import { ChartCard } from '../charts/ChartCard';
import { KpiCard } from '../charts/KpiCard';
import { ReportBarChart, ReportPieChart, type ChartDatum } from '../charts/ReportCharts';
import { ReportActions } from './ReportActions';
import { ReportTabState } from './ReportTabState';

interface ProjectsReportsTabProps {
  definitions: ReportDefinition[];
  state: LazyReportTabState<ProjectsReportsTabData>;
  creatingExportToken: string | null;
  onExport: (definition: ReportDefinition, format: ReportExportFormat) => void;
}

export function ProjectsReportsTab({
  definitions,
  state,
  creatingExportToken,
  onExport,
}: ProjectsReportsTabProps) {
  const data = state.data;

  return (
    <div className="space-y-5">
      <ReportTabState {...state} />
      {data ? (
        <>
          <ProjectKpis data={data} />
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="Product lifecycle" description="Products grouped by current status.">
              <ReportBarChart data={productStatusChart(data)} />
            </ChartCard>
            <ChartCard title="Extension delivery" description="Extensions grouped by status.">
              <ReportPieChart data={extensionStatusChart(data)} />
            </ChartCard>
            <ChartCard title="Product type mix" description="Project portfolio composition.">
              <ReportBarChart data={productTypeChart(data)} />
            </ChartCard>
            <ChartCard
              title="Extension size mix"
              description="Work volume shape by extension size."
            >
              <ReportBarChart data={extensionSizeChart(data)} />
            </ChartCard>
          </div>
        </>
      ) : null}
      <ReportActions
        definitions={definitions}
        creatingExportToken={creatingExportToken}
        onExport={onExport}
      />
    </div>
  );
}

function ProjectKpis({ data }: { data: ProjectsReportsTabData }) {
  const riskCount =
    countStatus(data.products.byStatus, 'ON_HOLD') +
    countStatus(data.extensions.byStatus, 'ON_HOLD');

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Products"
        value={count(data.products.total)}
        icon={<FolderKanban size={18} />}
      />
      <KpiCard
        label="Extensions"
        value={count(data.extensions.total)}
        icon={<GitBranch size={18} />}
      />
      <KpiCard
        label="Product statuses"
        value={count(data.products.byStatus.length)}
        icon={<Boxes size={18} />}
      />
      <KpiCard label="On hold signals" value={count(riskCount)} icon={<ShieldAlert size={18} />} />
    </section>
  );
}

function productStatusChart(data: ProjectsReportsTabData): ChartDatum[] {
  return data.products.byStatus.map((row) => ({ name: row.status, value: row._count }));
}

function extensionStatusChart(data: ProjectsReportsTabData): ChartDatum[] {
  return data.extensions.byStatus.map((row) => ({ name: row.status, value: row._count }));
}

function productTypeChart(data: ProjectsReportsTabData): ChartDatum[] {
  return data.products.byType.map((row) => ({ name: row.productType, value: row._count }));
}

function extensionSizeChart(data: ProjectsReportsTabData): ChartDatum[] {
  return data.extensions.bySize.map((row) => ({ name: row.size, value: row._count }));
}

function countStatus(rows: Array<{ status: string; _count: number }>, status: string): number {
  return rows.find((row) => row.status === status)?._count ?? 0;
}
