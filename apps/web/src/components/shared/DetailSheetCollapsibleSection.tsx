'use client';

import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
} from './detail-sheet-classes';

export interface DetailSheetCollapsibleSectionProps {
  id?: string;
  title: string;
  icon?: ReactNode;
  titleTrailing?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function DetailSheetCollapsibleSection({
  id,
  title,
  icon,
  titleTrailing,
  open,
  onOpenChange,
  children,
  className,
}: DetailSheetCollapsibleSectionProps) {
  return (
    <section id={id} className={cn(DETAIL_SHEET_SECTION_SURFACE_CLASS, className)}>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-lg outline-none select-none">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h4 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-0')}>
              {icon ? <span className="text-muted-foreground/80">{icon}</span> : null}
              {title}
            </h4>
            {titleTrailing}
          </div>
          <ChevronDown
            size={14}
            className={cn(
              'text-muted-foreground shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
      </Collapsible>
    </section>
  );
}
