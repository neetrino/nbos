'use client';

import { AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReportDataQualityWarning } from '@/lib/api/reports';

interface ReportsDataQualityPanelProps {
  warnings: ReportDataQualityWarning[];
  onRefresh: () => void;
}

export function ReportsDataQualityPanel({ warnings, onRefresh }: ReportsDataQualityPanelProps) {
  const warningCount = warnings.filter((item) => item.severity === 'WARNING').length;

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Data-quality warnings</p>
          <p className="text-muted-foreground text-sm">
            Honest limitations from module-owned report definitions. No missing data is converted
            into fake zeroes.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SummaryCard label="Warnings" value={warningCount} tone="warning" />
        <SummaryCard label="Info notes" value={warnings.length - warningCount} tone="info" />
      </div>

      {warnings.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
          <Info className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="mt-3 font-medium">No data-quality warnings</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Reports will show missing data here instead of hiding it.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {warnings.map((warning, index) => (
            <WarningRow key={`${warning.reportKey}-${warning.code}-${index}`} warning={warning} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'info' | 'warning';
}) {
  const className =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-sky-200 bg-sky-50 text-sky-800';
  return (
    <div className={`rounded-xl border p-4 ${className}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function WarningRow({ warning }: { warning: ReportDataQualityWarning }) {
  const Icon = warning.severity === 'WARNING' ? AlertTriangle : Info;
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <Icon
          className={warning.severity === 'WARNING' ? 'text-amber-600' : 'text-sky-600'}
          size={18}
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{warning.reportTitle}</p>
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
              {warning.code}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{warning.message}</p>
          {warning.sourceEndpoints.length > 0 ? (
            <p className="text-muted-foreground mt-2 text-xs">
              Sources: {warning.sourceEndpoints.join(', ')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
