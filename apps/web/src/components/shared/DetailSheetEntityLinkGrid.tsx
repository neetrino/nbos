import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const DETAIL_SHEET_ENTITY_LINK_GRID_CLASS = 'grid grid-cols-1 gap-2 sm:grid-cols-3';

interface DetailSheetEntityLinkGridProps {
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
}

/** Responsive 1→3 column grid for {@link DetailSheetEntityLinkCard} rows. */
export function DetailSheetEntityLinkGrid({
  children,
  empty,
  className,
}: DetailSheetEntityLinkGridProps) {
  if (empty != null) {
    return (
      <div className={cn(DETAIL_SHEET_ENTITY_LINK_GRID_CLASS, className)}>
        <div className="sm:col-span-3">{empty}</div>
      </div>
    );
  }

  return <div className={cn(DETAIL_SHEET_ENTITY_LINK_GRID_CLASS, className)}>{children}</div>;
}
