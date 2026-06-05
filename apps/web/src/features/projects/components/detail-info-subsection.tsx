import type { ReactNode } from 'react';
import {
  DETAIL_SHEET_PANEL_DIVIDER_CLASS,
  DETAIL_SHEET_SUBSECTION_LABEL_CLASS,
} from '@/components/shared';
import { cn } from '@/lib/utils';

export function DetailInfoSubsection({
  title,
  children,
  first = false,
  className,
}: {
  title?: string;
  children: ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <section className={cn(!first && DETAIL_SHEET_PANEL_DIVIDER_CLASS, 'space-y-3', className)}>
      {title ? <h3 className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>{title}</h3> : null}
      {children}
    </section>
  );
}
