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
  children: ReactNode;
  className?: string;
}

/** Rounded gradient block used across Lead/Deal-style detail sheets. */
export function DetailSheetSection({
  id,
  title,
  icon,
  children,
  className,
}: DetailSheetSectionProps) {
  return (
    <section id={id} className={cn(DETAIL_SHEET_SECTION_SURFACE_CLASS, className)}>
      <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        {icon ? <span className="text-muted-foreground/80">{icon}</span> : null}
        {title}
      </h4>
      {children}
    </section>
  );
}
