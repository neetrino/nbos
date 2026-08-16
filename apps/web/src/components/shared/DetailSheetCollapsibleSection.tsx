'use client';

import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_NOTCH_CLASS,
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
    <section
      id={id}
      className={cn(
        DETAIL_SHEET_SECTION_SURFACE_CLASS,
        'relative overflow-visible pt-6',
        className,
      )}
    >
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className="group flex min-h-6 w-full items-start justify-end gap-2 rounded-lg outline-none select-none">
          <h4 className={DETAIL_SHEET_SECTION_TITLE_NOTCH_CLASS}>
            {icon ? <span className="text-primary">{icon}</span> : null}
            {title}
          </h4>
          {titleTrailing}
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
