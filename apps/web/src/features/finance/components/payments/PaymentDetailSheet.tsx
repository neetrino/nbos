'use client';

import { useCallback, useState } from 'react';
import { CreditCard, Trash2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  EntityItemHost,
  ErrorState,
  LoadingState,
} from '@/components/shared';
import { SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';
import { DeleteInvoicePaymentDialog } from '@/features/finance/components/invoices/DeleteInvoicePaymentDialog';
import { formatInvoiceSheetDate } from '@/features/finance/components/invoices/format-invoice-sheet-date';
import { formatAmount } from '@/features/finance/constants/finance';
import { paymentsListWithOpenPaymentHref } from '@/features/finance/constants/payment-deep-link';
import { getPaymentDisplayTitle } from '@/features/finance/utils/payment-display-title';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import { getApiErrorMessage } from '@/lib/api-errors';
import { paymentsApi, type Payment } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { PAYMENT_DETAIL_SHEET_TABS, type PaymentDetailSheetTab } from './payment-detail-sheet-tabs';
import { PaymentGeneralTab } from './PaymentGeneralTab';

/** Payment detail: single-column general — same density as order sheet. */
const PAYMENT_DETAIL_SHEET_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[30rem]';

const PAYMENT_DETAIL_SHEET_RAIL_ANCHOR_CLASS = `${SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS} sm:right-[30rem]`;

interface PaymentDetailSheetProps {
  paymentId: string | null;
  initialPayment?: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentDeleted?: (paymentId: string) => void;
  forceNestedBackdrop?: boolean;
}

export function PaymentDetailSheet({
  paymentId,
  initialPayment = null,
  open,
  onOpenChange,
  onPaymentDeleted,
  forceNestedBackdrop = false,
}: PaymentDetailSheetProps) {
  const locale = useLocale();
  const isMobileViewport = useIsMobileViewport();
  const { persistedValue: sheetId, onOpenChangeComplete } = useSheetPersistedValue(paymentId);
  const hostMounted = useSheetHostMounted(open, sheetId);
  const [activeTab, setActiveTab] = useState<PaymentDetailSheetTab>('general');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const tabScope = `${sheetId ?? ''}:${open}`;
  const [trackedTabScope, setTrackedTabScope] = useState(tabScope);

  if (trackedTabScope !== tabScope) {
    setTrackedTabScope(tabScope);
    setActiveTab('general');
    setDeleteOpen(false);
    setDeleteError(null);
  }

  const {
    entity: payment,
    loading,
    error,
    refresh,
  } = useEntityDetailHydration({
    entityId: sheetId ?? '',
    open: open && Boolean(sheetId),
    initialEntity: initialPayment,
    fetchById: paymentsApi.getById,
    loadErrorMessage: 'Payment could not be loaded.',
  });

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setDeleteOpen(false);
        setDeleteError(null);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!payment) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await paymentsApi.delete(payment.id);
      setDeleteOpen(false);
      onPaymentDeleted?.(payment.id);
      handleOpenChange(false);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, 'Payment could not be removed.'));
    } finally {
      setDeleteSubmitting(false);
    }
  }, [handleOpenChange, onPaymentDeleted, payment]);

  if (!hostMounted) return null;

  const sourcePageHref = paymentsListWithOpenPaymentHref(sheetId ?? '');
  const deleteSummary = payment
    ? `${formatAmount(Number(payment.amount))} · ${formatInvoiceSheetDate(payment.paymentDate, locale)}`
    : '';

  return (
    <EntityItemHost nested onEntityChanged={() => void refresh()}>
      <Sheet
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
      >
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="compact"
          contentClassName={PAYMENT_DETAIL_SHEET_WIDTH_CLASS}
          railAnchorClassName={PAYMENT_DETAIL_SHEET_RAIL_ANCHOR_CLASS}
          sourcePageHref={sourcePageHref}
          forceNestedBackdrop={forceNestedBackdrop}
        >
          <div
            className={cn(
              isMobileViewport
                ? DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS
                : 'bg-background shrink-0 px-5 pt-5 pb-3',
            )}
          >
            {loading && !payment ? (
              <p
                className={cn(
                  'text-muted-foreground text-sm',
                  isMobileViewport && DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
                )}
              >
                Loading…
              </p>
            ) : payment ? (
              <>
                {isMobileViewport ? (
                  <div className={DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS}>
                    <DetailSheetSettingsMenu>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 />
                        Remove payment
                      </DropdownMenuItem>
                    </DetailSheetSettingsMenu>
                  </div>
                ) : null}
                <div
                  className={cn(
                    isMobileViewport
                      ? cn(
                          DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
                          'flex min-w-0 items-center gap-2',
                        )
                      : 'flex flex-wrap items-center justify-between gap-3',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <CreditCard className="text-muted-foreground size-5 shrink-0" aria-hidden />
                    <h2 className="text-foreground min-w-0 truncate text-xl font-bold tracking-tight">
                      {getPaymentDisplayTitle(payment)}
                    </h2>
                  </div>
                  {!isMobileViewport ? (
                    <DetailSheetSettingsMenu>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 />
                        Remove payment
                      </DropdownMenuItem>
                    </DetailSheetSettingsMenu>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <DetailSheetTabBar
            tabs={[...PAYMENT_DETAIL_SHEET_TABS]}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as PaymentDetailSheetTab)}
            className="max-md:mt-3 max-md:px-5"
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 py-5">
              {loading && !payment ? (
                <LoadingState count={3} />
              ) : error && !payment ? (
                <ErrorState description={error} onRetry={() => void refresh()} />
              ) : payment ? (
                <DetailSheetTabPanel tabKey={activeTab}>
                  <PaymentGeneralTab payment={payment} />
                </DetailSheetTabPanel>
              ) : null}
            </div>
          </ScrollArea>
        </EntityDetailSheetContent>
      </Sheet>

      <DeleteInvoicePaymentDialog
        paymentSummary={deleteSummary}
        open={deleteOpen}
        isSubmitting={deleteSubmitting}
        errorMessage={deleteError}
        onOpenChange={(next) => {
          if (!next) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </EntityItemHost>
  );
}
