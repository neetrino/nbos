'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  EntityDetailSheetContent,
} from '@/components/shared';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { InvoiceMoneyStagesBar } from '@/features/finance/components/invoices/InvoiceMoneyStagesBar';
import { InvoiceSheetStageGateBlockers } from '@/features/finance/components/invoices/InvoiceSheetStageGateBlockers';
import { InvoiceGeneralTab } from '@/features/finance/components/invoices/InvoiceGeneralTab';
import { InvoicePaymentsTab } from '@/features/finance/components/invoices/InvoicePaymentsTab';
import { InvoiceHistoryTab } from '@/features/finance/components/invoices/InvoiceHistoryTab';
import {
  INVOICE_DETAIL_SHEET_TABS,
  type InvoiceDetailSheetTab,
} from '@/features/finance/components/invoices/invoice-detail-sheet-tabs';
import { InvoiceSheetBadge, type InvoiceSheetInvoice } from './invoices/InvoiceSheetSections';
import { buildInvoiceGateRequiredFields } from '@/features/finance/constants/invoice-stage-gate-highlight';
import type { InvoiceSheetStageGateHighlight } from '@/features/finance/constants/invoice-stage-gate-highlight';
import {
  buildInvoiceGeneralPatch,
  createInvoiceGeneralDraft,
  isInvoiceGeneralDirty,
  type InvoiceGeneralDraft,
} from '@/features/finance/utils/invoice-general-form-state';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi } from '@/lib/api/finance';

interface InvoiceSheetProps {
  invoice: InvoiceSheetInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
  onMoneyStatusChange?: (invoiceId: string, moneyStatus: string) => void | Promise<void>;
  onPaymentRecorded: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
  stageGateHighlight?: InvoiceSheetStageGateHighlight | null;
  /** Stack above a parent entity sheet (related-item open from tab). */
  forceNestedBackdrop?: boolean;
}

export function InvoiceSheet({
  invoice,
  open,
  onOpenChange,
  onInvoiceUpdated,
  onMoneyStatusChange,
  onPaymentRecorded,
  stageGateHighlight = null,
  forceNestedBackdrop,
}: InvoiceSheetProps) {
  const [activeTab, setActiveTab] = useState<InvoiceDetailSheetTab>('general');
  const [generalDraft, setGeneralDraft] = useState<InvoiceGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<InvoiceGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const generalDirtyRef = useRef(false);

  useEffect(() => {
    setActiveTab('general');
  }, [invoice?.id]);

  useLayoutEffect(() => {
    if (!invoice) {
      setGeneralDraft(null);
      setGeneralSnap(null);
      return;
    }
    if (generalDirtyRef.current) return;
    const next = createInvoiceGeneralDraft(invoice);
    setGeneralDraft(next);
    setGeneralSnap(next);
  }, [invoice?.id, invoice?.amount, invoice?.taxStatus, invoice?.companyId, invoice?.projectId]);

  const patchGeneralDraft = useCallback((partial: Partial<InvoiceGeneralDraft>) => {
    setGeneralDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty =
    generalDraft != null && generalSnap != null && isInvoiceGeneralDirty(generalDraft, generalSnap);
  generalDirtyRef.current = generalDirty;

  const handleInvoiceChange = useCallback(
    (updated: InvoiceSheetInvoice) => {
      generalDirtyRef.current = false;
      const next = createInvoiceGeneralDraft(updated);
      setGeneralDraft(next);
      setGeneralSnap(next);
      onInvoiceUpdated?.(updated);
    },
    [onInvoiceUpdated],
  );

  const handleGeneralSave = useCallback(() => {
    if (!invoice || !generalDraft || !generalSnap || !onInvoiceUpdated) return;
    setGeneralError(null);
    const patch = buildInvoiceGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;

    const draftAtSave = generalDraft;
    const snapAtSave = generalSnap;
    setGeneralSnap({ ...draftAtSave });
    setSaving(true);

    void (async () => {
      try {
        const updated = await invoicesApi.updateGeneral(invoice.id, patch);
        generalDirtyRef.current = false;
        handleInvoiceChange(updated);
        toast.success('Invoice updated');
      } catch (caught) {
        setGeneralSnap(snapAtSave);
        setGeneralDraft(draftAtSave);
        setGeneralError(getApiErrorMessage(caught, 'Could not save invoice changes.'));
      } finally {
        setSaving(false);
      }
    })();
  }, [invoice, generalDraft, generalSnap, onInvoiceUpdated, handleInvoiceChange]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  const gateRequiredFields = useMemo(
    () => buildInvoiceGateRequiredFields(stageGateHighlight),
    [stageGateHighlight],
  );

  if (!invoice) return null;

  const sourcePageHref = `/finance/invoices?${OPEN_INVOICE_QUERY}=${encodeURIComponent(invoice.id)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="compact"
        sourcePageHref={sourcePageHref}
        forceNestedBackdrop={forceNestedBackdrop}
      >
        <div className="bg-background border-border shrink-0 border-b px-5 pt-5 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                <FileText className="text-muted-foreground size-5 shrink-0" aria-hidden />
                <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                  {invoice.code}
                </h2>
              </div>
            </div>
            <InvoiceSheetBadge invoice={invoice} />
          </div>
        </div>

        {onMoneyStatusChange ? (
          <div className="shrink-0 border-b border-stone-100 px-5 py-2.5 dark:border-stone-800">
            <InvoiceMoneyStagesBar
              currentStatus={invoice.moneyStatus}
              onStageClick={(status) => void onMoneyStatusChange(invoice.id, status)}
            />
          </div>
        ) : null}

        <DetailSheetTabBar
          tabs={INVOICE_DETAIL_SHEET_TABS}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as InvoiceDetailSheetTab)}
        />

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 py-5">
            <InvoiceSheetStageGateBlockers highlight={stageGateHighlight} />

            {activeTab === 'general' ? (
              <InvoiceGeneralTab
                invoice={invoice}
                gateRequiredFields={gateRequiredFields}
                draft={onInvoiceUpdated ? generalDraft : null}
                patchDraft={patchGeneralDraft}
                formDisabled={saving}
                onInvoiceUpdated={onInvoiceUpdated ? handleInvoiceChange : undefined}
              />
            ) : null}
            {activeTab === 'payments' ? (
              <InvoicePaymentsTab
                invoice={invoice}
                gateRequiredFields={gateRequiredFields}
                onPaymentRecorded={onPaymentRecorded}
              />
            ) : null}
            {activeTab === 'history' ? <InvoiceHistoryTab /> : null}
          </div>
        </ScrollArea>

        <DetailSheetFormFooter
          visible={activeTab === 'general' && Boolean(onInvoiceUpdated && invoice)}
          dirty={generalDirty}
          saving={saving}
          errorMessage={generalError}
          onSave={handleGeneralSave}
          onCancel={handleGeneralCancel}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}
