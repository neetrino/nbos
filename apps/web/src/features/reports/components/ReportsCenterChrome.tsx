'use client';

import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { ReportCategory } from '@/lib/api/reports';

export type ReportsView =
  | Extract<ReportCategory, 'FINANCE' | 'SALES' | 'MARKETING' | 'PROJECTS' | 'SPECIALISTS'>
  | 'SCHEDULED'
  | 'EXPORTS'
  | 'QUALITY';

const REPORT_VIEWS: Array<{ id: ReportsView; label: string; description: string }> = [
  { id: 'FINANCE', label: 'Finance', description: 'P&L, cash, MRR' },
  { id: 'SALES', label: 'Sales', description: 'Pipeline and sources' },
  { id: 'MARKETING', label: 'Marketing', description: 'Spend and ROAS' },
  { id: 'PROJECTS', label: 'Projects', description: 'Delivery health' },
  { id: 'SPECIALISTS', label: 'Specialists', description: 'Workload and KPI' },
  { id: 'SCHEDULED', label: 'Scheduled', description: 'Recurring packets' },
  { id: 'EXPORTS', label: 'Exports', description: 'Files and queue' },
  { id: 'QUALITY', label: 'Data quality', description: 'Warnings' },
];

export function ReportsHeader({ view, onRefresh }: { view: ReportsView; onRefresh: () => void }) {
  return (
    <PageHeader
      title="Reports / Analytics"
      description={`Professional ${viewLabel(view)} reports with lazy-loaded data and charts.`}
    >
      <Button type="button" variant="outline" onClick={onRefresh}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </PageHeader>
  );
}

export function ReportViewTabs({
  view,
  onViewChange,
}: {
  view: ReportsView;
  onViewChange: (view: ReportsView) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-8">
      {REPORT_VIEWS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onViewChange(item.id)}
          className={`rounded-2xl border p-3 text-left transition-colors ${
            view === item.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground hover:bg-secondary'
          }`}
        >
          <span className="block text-sm font-semibold">{item.label}</span>
          <span className="mt-1 block text-xs opacity-80">{item.description}</span>
        </button>
      ))}
    </div>
  );
}

function viewLabel(view: ReportsView): string {
  return REPORT_VIEWS.find((item) => item.id === view)?.label ?? 'Reports';
}
