'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared';
import {
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

interface InvoiceSheetStatusProps {
  open: boolean;
  loading: boolean;
  isMobileViewport: boolean;
  forceNestedBackdrop?: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
}

export function InvoiceSheetStatus({
  open,
  loading,
  isMobileViewport,
  forceNestedBackdrop,
  onOpenChange,
  onOpenChangeComplete,
}: InvoiceSheetStatusProps) {
  const t = useTranslations('invoices');
  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="compact"
        forceNestedBackdrop={forceNestedBackdrop}
      >
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
      </EntityDetailSheetContent>
    </Sheet>
  );
}
