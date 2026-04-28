'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExpenseProjectDrilldownBannerProps {
  projectId: string;
  projectBannerLabel: string | null;
  onClearProjectFilter: () => void;
}

export function ExpenseProjectDrilldownBanner({
  projectId,
  projectBannerLabel,
  onClearProjectFilter,
}: ExpenseProjectDrilldownBannerProps) {
  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground max-w-prose">
        Showing expenses for this project (server filter)
        {projectBannerLabel ? (
          <span className="text-muted-foreground"> — {projectBannerLabel}</span>
        ) : null}
        .
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/projects/${projectId}`}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'inline-flex items-center gap-1',
          )}
        >
          Project
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
        <Button variant="outline" size="sm" type="button" onClick={onClearProjectFilter}>
          Clear filter
        </Button>
      </div>
    </div>
  );
}
