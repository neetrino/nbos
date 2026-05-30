'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function UnitEconomicsTableShell({
  minWidth,
  toolbar,
  hint,
  children,
}: {
  minWidth: string;
  toolbar?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {toolbar || hint ? (
        <div
          className={cn(
            'flex flex-wrap items-center gap-3',
            toolbar && hint ? 'justify-between' : toolbar ? 'justify-end' : undefined,
          )}
        >
          {hint ? <div className="min-w-0 flex-1">{hint}</div> : null}
          {toolbar ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div>
          ) : null}
        </div>
      ) : null}
      <div className="border-border bg-card overflow-auto rounded-xl border shadow-sm">
        <table className={cn('w-full border-collapse text-xs', minWidth)}>{children}</table>
      </div>
    </div>
  );
}

export function UnitEconomicsTableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-card sticky top-0 z-10">{children}</thead>;
}
