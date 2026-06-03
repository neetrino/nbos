'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  SHEET_CENTER_RAIL_COLUMN_CLASS,
  SHEET_CENTER_SHELL_CLASS,
} from '@/components/shared/detail-sheet-classes';

/** Fixed bottom-center shell: rail column is always the flex sibling left of the panel. */
export function SheetCenterShell({
  rail,
  floatingRailVisible,
  nestedStackClass,
  panel,
}: {
  rail: ReactNode;
  floatingRailVisible: boolean;
  nestedStackClass: string;
  panel: ReactNode;
}) {
  return (
    <div
      data-slot="sheet-center-shell"
      className={cn(
        SHEET_CENTER_SHELL_CLASS,
        nestedStackClass,
        'transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0',
        floatingRailVisible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className={SHEET_CENTER_RAIL_COLUMN_CLASS}>{rail}</div>
      {panel}
    </div>
  );
}
