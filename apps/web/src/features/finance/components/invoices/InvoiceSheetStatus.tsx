'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

interface InvoiceSheetStatusProps {
  loading: boolean;
  isMobileViewport: boolean;
}

/**
 * Loading / unavailable body inside {@link InvoiceSheet}.
 * Must not mount its own `Sheet` — a second dialog host remounts and restarts the open animation.
 */
export function InvoiceSheetStatus({ loading, isMobileViewport }: InvoiceSheetStatusProps) {
  const t = useTranslations('invoices');
  return (
    <div
      className={cn(
        isMobileViewport
          ? DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS
          : 'flex flex-1 items-center gap-2 px-5 py-8 text-sm',
      )}
    >
      {isMobileViewport ? <div className={DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS} /> : null}
      <div
        className={cn(
          'flex items-center gap-2 text-sm',
          isMobileViewport && DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
        )}
      >
        {loading ? (
          <>
            <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden />
            <span className="text-muted-foreground">{t('sheet.loading')}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{t('sheet.unavailable')}</span>
        )}
      </div>
    </div>
  );
}
