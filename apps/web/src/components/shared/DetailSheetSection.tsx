'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
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
  /** Title sits on the border. Body keeps the same white field fill. */
  outlined?: boolean;
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
  outlined = false,
}: DetailSheetSectionProps) {
  const hasBody = children != null;

  if (outlined) {
    return (
      <section id={id} className={cn(DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS, className)}>
        <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{title}</span>
        {hasBody ? (
          <div className={cn(DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS, 'rounded-xl bg-card p-3')}>
            {children}
          </div>
        ) : null}
      </section>
    );
  }

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
          {icon ? <span className="text-primary">{icon}</span> : null}
          {title}
        </h4>
        {titleTrailing}
      </div>
      {hasBody ? children : null}
    </section>
  );
}
