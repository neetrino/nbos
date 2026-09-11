'use client';

import type { ReactNode } from 'react';
import {
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';

interface MailSheetPanelHeaderProps {
  title: string;
  description?: ReactNode;
  /** Optional trailing control on the mobile Back row (e.g. settings). */
  trailing?: ReactNode;
}

/** Sheet panel title — Back clearance on mobile, title on the line below. */
export function MailSheetPanelHeader({ title, description, trailing }: MailSheetPanelHeaderProps) {
  const isMobileViewport = useIsMobileViewport();

  return (
    <div
      className={cn(
        'border-border shrink-0 border-b',
        isMobileViewport ? DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS : undefined,
      )}
    >
      {isMobileViewport ? (
        <div className={DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS}>{trailing}</div>
      ) : null}
      <SheetHeader
        className={cn(
          isMobileViewport
            ? cn(DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS, 'space-y-1 pb-3')
            : 'px-5 py-4',
        )}
      >
        <SheetTitle>{title}</SheetTitle>
        {description ? <SheetDescription>{description}</SheetDescription> : null}
      </SheetHeader>
    </div>
  );
}
