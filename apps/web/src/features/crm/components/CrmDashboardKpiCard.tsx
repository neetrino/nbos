import type { ComponentType } from 'react';

export type CrmDashboardKpiCardProps = {
  label: string;
  value: string;
  change: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  iconClass: string;
};

/** Border-based KPI tile — avoids ring clipping inside module scroll shells. */
export function CrmDashboardKpiCard({
  label,
  value,
  change,
  icon: Icon,
  iconClass,
}: CrmDashboardKpiCardProps) {
  return (
    <div className="border-border bg-card flex min-w-0 items-center gap-3 rounded-xl border p-4 shadow-sm">
      <div className={`shrink-0 rounded-xl p-3 ${iconClass}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground truncate text-xs font-medium">{label}</p>
        <p className="text-foreground mt-0.5 truncate text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{change}</p>
      </div>
    </div>
  );
}
