'use client';

import type { ReactNode } from 'react';

/** Card block used inside detail sheets: icon well, title, and a one-line hint. */
export function InsightSheetSection({
  icon,
  title,
  hint,
  trailing,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-foreground text-sm font-semibold">{title}</h3>
            {hint ? <p className="text-muted-foreground text-xs leading-snug">{hint}</p> : null}
          </div>
        </div>
        {trailing}
      </div>
      <div className="relative mt-3">{children}</div>
    </section>
  );
}
