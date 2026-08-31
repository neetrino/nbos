'use client';

import { FileText, Trash2, XCircle } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu } from '@/components/shared';
import {
  getInvoiceDisplaySubtitle,
  getInvoiceDisplayTitle,
} from '@/features/finance/utils/order-display';
import { InvoiceSheetBadge, type InvoiceSheetInvoice } from './InvoiceSheetSections';

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
  const subtitle = getInvoiceDisplaySubtitle(invoice);

  return (
    <div className="bg-background shrink-0 px-7 pt-5 pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
            <FileText className="text-muted-foreground size-5 shrink-0" aria-hidden />
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
        </div>
        {lifecycleMode ? (
          <DetailSheetSettingsMenu>
            <DropdownMenuItem variant="destructive" disabled={saving} onClick={onLifecycleOpen}>
              {lifecycleMode === 'delete' ? <Trash2 /> : <XCircle />}
              {lifecycleMode === 'delete' ? 'Delete invoice' : 'Cancel invoice'}
            </DropdownMenuItem>
          </DetailSheetSettingsMenu>
        ) : null}
      </div>
    </div>
  );
}
