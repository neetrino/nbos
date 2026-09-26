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
  /** One-line explanation under the title. Used with `appearance="insight"`. */
  hint?: string;
  icon?: ReactNode;
  titleTrailing?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  /** `insight` matches the KPI gate sheet cards. Default keeps the CRM micro-label. */
  appearance?: 'default' | 'insight';
}

export function DetailSheetCollapsibleSection({
  id,
  title,
  hint,
  icon,
  titleTrailing,
  open,
  onOpenChange,
  children,
  className,
  appearance = 'default',
}: DetailSheetCollapsibleSectionProps) {
  if (appearance === 'insight') {
    return (
      <InsightCollapsibleSection
        id={id}
        title={title}
        hint={hint}
        icon={icon}
        titleTrailing={titleTrailing}
        open={open}
        onOpenChange={onOpenChange}
        className={className}
      >
        {children}
      </InsightCollapsibleSection>
    );
  }

  return (
    <section id={id} className={cn(DETAIL_SHEET_SECTION_SURFACE_CLASS, className)}>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-lg outline-none select-none">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h4 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-0')}>
              {icon ? <span className="text-primary">{icon}</span> : null}
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

function InsightCollapsibleSection({
  id,
  title,
  hint,
  icon,
  titleTrailing,
  open,
  onOpenChange,
  children,
  className,
}: Omit<DetailSheetCollapsibleSectionProps, 'appearance'>) {
  return (
    <section
      id={id}
      className={cn(
        'border-border bg-card relative overflow-hidden rounded-2xl border p-4',
        className,
      )}
    >
      <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className="group relative flex w-full items-start justify-between gap-2 rounded-lg text-left outline-none select-none">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon ? (
              <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                {icon}
              </span>
            ) : null}
            <span className="min-w-0">
              <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
                {title}
                {titleTrailing}
              </span>
              {hint ? (
                <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
                  {hint}
                </span>
              ) : null}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={cn(
              'text-muted-foreground mt-2 shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="relative pt-3">{children}</CollapsibleContent>
      </Collapsible>
    </section>
  );
}
