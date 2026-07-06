'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
} from './detail-sheet-classes';

export interface DetailSheetSectionProps {
  id?: string;
  title: string;
  icon?: ReactNode;
  titleTrailing?: ReactNode;
  titleRowClassName?: string;
  children?: ReactNode;
  className?: string;
}

/** Rounded gradient block used across Lead/Deal-style detail sheets. */
export function DetailSheetSection({
  id,
  title,
  icon,
  titleTrailing,
  titleRowClassName,
  children,
  className,
}: DetailSheetSectionProps) {
  const hasBody = children != null;

  return (
    <section id={id} className={cn(DETAIL_SHEET_SECTION_SURFACE_CLASS, className)}>
      <div
        className={cn(
          'flex min-w-0 items-center gap-2',
          hasBody ? 'mb-4' : undefined,
          titleTrailing ? 'flex-wrap' : undefined,
          titleRowClassName,
        )}
      >
        <h4 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-0')}>
          {icon ? <span className="text-muted-foreground/80">{icon}</span> : null}
          {title}
        </h4>
        {titleTrailing}
      </div>
      {hasBody ? children : null}
    </section>
  );
}
