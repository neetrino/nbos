import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}

export function KpiCard({ label, value, hint, icon }: KpiCardProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className="text-foreground mt-2 text-2xl font-semibold">{value}</p>
        </div>
        {icon ? (
          <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
            {icon}
          </div>
        ) : null}
      </div>
      {hint ? <p className="text-muted-foreground mt-2 text-sm">{hint}</p> : null}
    </div>
  );
}
