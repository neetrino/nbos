'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { DETAIL_SHEET_SUBSECTION_LABEL_CLASS } from './detail-sheet-classes';

export interface DetailSheetCollapsibleSubsectionProps {
  title: string;
  /** Defaults to open. */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Nested block under a detail-sheet section (e.g. Project / Product) —
 * subsection label + chevron to expand/collapse.
 */
export function DetailSheetCollapsibleSubsection({
  title,
  defaultOpen = true,
  children,
  className,
}: DetailSheetCollapsibleSubsectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn('min-w-0', className)}>
      <CollapsibleTrigger
        type="button"
        className="group mb-3 flex w-full items-center justify-between gap-2 rounded-md outline-none select-none"
      >
        <p className={cn(DETAIL_SHEET_SUBSECTION_LABEL_CLASS, 'mb-0')}>{title}</p>
        <ChevronDown
          size={14}
          className={cn(
            'text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}
