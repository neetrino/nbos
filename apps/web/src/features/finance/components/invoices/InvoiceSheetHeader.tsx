'use client';

import { FileText, Trash2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu } from '@/components/shared';
import {
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import {
  getInvoiceDisplaySubtitle,
  getInvoiceDisplayTitle,
} from '@/features/finance/utils/order-display';
import { getInvoiceSourceCardChrome } from '@/features/finance/utils/invoice-source-card-chrome';
import { resolveInvoiceSourceFamily } from '@/features/finance/utils/invoice-source-label';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';
import { InvoiceSheetBadge, type InvoiceSheetInvoice } from './InvoiceSheetSections';

const INVOICE_SHEET_DESKTOP_HEADER_CLASS = 'shrink-0 px-7 pt-5 pb-3';

interface InvoiceSheetHeaderProps {
  invoice: InvoiceSheetInvoice;
  lifecycleMode: 'delete' | 'cancel' | null;
  saving: boolean;
  onLifecycleOpen: () => void;
}

export function InvoiceSheetHeader({
  invoice,
  lifecycleMode,
  saving,
  onLifecycleOpen,
}: InvoiceSheetHeaderProps) {
  const t = useTranslations('invoices');
  const isMobileViewport = useIsMobileViewport();
  const subtitle = getInvoiceDisplaySubtitle(invoice);
  const chrome = getInvoiceSourceCardChrome(resolveInvoiceSourceFamily(invoice));
  const settingsMenu = lifecycleMode ? (
    <DetailSheetSettingsMenu>
      <DropdownMenuItem variant="destructive" disabled={saving} onClick={onLifecycleOpen}>
        {lifecycleMode === 'delete' ? <Trash2 /> : <XCircle />}
        {lifecycleMode === 'delete' ? t('sheet.deleteInvoice') : t('sheet.cancelInvoice')}
      </DropdownMenuItem>
    </DetailSheetSettingsMenu>
  ) : null;

  if (isMobileViewport) {
    return (
      <div className={cn(DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS, 'bg-transparent')}>
        <div className={DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS}>{settingsMenu}</div>
        <div className={cn(DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS, 'space-y-1')}>
          <InvoiceSheetHeaderIdentity
            invoice={invoice}
            subtitle={subtitle}
            iconClassName={chrome.iconClassName}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={INVOICE_SHEET_DESKTOP_HEADER_CLASS}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <InvoiceSheetHeaderIdentity
            invoice={invoice}
            subtitle={subtitle}
            iconClassName={chrome.iconClassName}
          />
        </div>
        {settingsMenu}
      </div>
    </div>
  );
}

function InvoiceSheetHeaderIdentity({
  invoice,
  subtitle,
  iconClassName,
}: {
  invoice: InvoiceSheetInvoice;
  subtitle: string | null | undefined;
  iconClassName: string;
}) {
  return (
    <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
      <FileText className={cn('size-5 shrink-0', iconClassName)} aria-hidden />
      <div className="min-w-0">
        <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
          {getInvoiceDisplayTitle(invoice)}
        </h2>
        {subtitle ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{invoice.code}</p>
        ) : null}
      </div>
      <InvoiceSheetBadge invoice={invoice} />
    </div>
  );
}
