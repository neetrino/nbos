'use client';

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>
        {description != null ? (
          <div className="mt-1.5">
            {typeof description === 'string' ? (
              <p className="text-muted-foreground text-sm">{description}</p>
            ) : (
              description
            )}
          </div>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{children}</div>
      ) : null}
    </div>
  );
}
