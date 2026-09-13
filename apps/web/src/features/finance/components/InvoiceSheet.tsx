'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
} from '@/components/shared';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { InvoiceMoneyStagesBar } from '@/features/finance/components/invoices/InvoiceMoneyStagesBar';
import { InvoiceSheetStageGateBlockers } from '@/features/finance/components/invoices/InvoiceSheetStageGateBlockers';
import { InvoiceGeneralTab } from '@/features/finance/components/invoices/InvoiceGeneralTab';
import { InvoicePaymentsTab } from '@/features/finance/components/invoices/InvoicePaymentsTab';
import { InvoiceHistoryTab } from '@/features/finance/components/invoices/InvoiceHistoryTab';
import { InvoiceLifecycleConfirmDialog } from '@/features/finance/components/invoices/InvoiceLifecycleConfirmDialog';
import {
  getInvoiceDetailSheetTabs,
  type InvoiceDetailSheetTab,
} from '@/features/finance/components/invoices/invoice-detail-sheet-tabs';
import { InvoiceSheetStatus } from '@/features/finance/components/invoices/InvoiceSheetStatus';
import { type InvoiceSheetInvoice } from './invoices/InvoiceSheetSections';
import { InvoiceSheetHeader } from './invoices/InvoiceSheetHeader';
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
import { invoiceLifecycleAction } from '@/features/finance/utils/invoice-lifecycle';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import { usePermission } from '@/lib/permissions';

interface InvoiceSheetProps {
  invoice: InvoiceSheetInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True while nested host fetches invoice by id. */
  loading?: boolean;
  onInvoiceUpdated?: (invoice: InvoiceSheetInvoice) => void;
  onInvoiceDeleted?: (invoiceId: string) => void;
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
  loading = false,
  onInvoiceUpdated,
  onInvoiceDeleted,
  onMoneyStatusChange,
  onPaymentRecorded,
  stageGateHighlight = null,
  forceNestedBackdrop,
}: InvoiceSheetProps) {
  const t = useTranslations('invoices');
  const { me } = usePermission();
  const { persistedValue: renderInvoice, onOpenChangeComplete } = useSheetPersistedValue(invoice);
  const hostMounted = useSheetHostMounted(open, renderInvoice);
  const isPlatformOwner = me?.isPlatformOwner === true;
  const isMobileViewport = useIsMobileViewport();

  const [activeTab, setActiveTab] = useState<InvoiceDetailSheetTab>('general');
  const [generalDraft, setGeneralDraft] = useState<InvoiceGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<InvoiceGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const generalDirtyRef = useRef(false);

  useEffect(() => {
    if (!open) setLifecycleOpen(false);
  }, [open]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft sync keyed on invoice.id
  }, [invoice?.id, invoice?.amount, invoice?.taxStatus, invoice?.companyId, invoice?.productId]);

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
        toast.success(t('sheet.updated'));
      } catch (caught) {
        setGeneralSnap(snapAtSave);
        setGeneralDraft(draftAtSave);
        setGeneralError(getApiErrorMessage(caught, t('sheet.saveFailed')));
      } finally {
        setSaving(false);
      }
    })();
  }, [invoice, generalDraft, generalSnap, onInvoiceUpdated, handleInvoiceChange, t]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  const gateRequiredFields = useMemo(
    () => buildInvoiceGateRequiredFields(stageGateHighlight),
    [stageGateHighlight],
  );

  if (!hostMounted) return null;

  if (!renderInvoice) {
    return (
      <InvoiceSheetStatus
        open={open}
        loading={loading}
        isMobileViewport={isMobileViewport}
        forceNestedBackdrop={forceNestedBackdrop}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
      />
    );
  }

  const detailTabs = getInvoiceDetailSheetTabs((key) => t(key as never));

  const sourcePageHref = `/finance/invoices?${OPEN_INVOICE_QUERY}=${encodeURIComponent(renderInvoice.id)}`;
  const lifecycleMode = onInvoiceUpdated
    ? invoiceLifecycleAction(renderInvoice, isPlatformOwner)
    : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="compact"
          sourcePageHref={sourcePageHref}
          forceNestedBackdrop={forceNestedBackdrop}
        >
          <InvoiceSheetHeader
            invoice={renderInvoice}
            lifecycleMode={lifecycleMode}
            saving={saving}
            onLifecycleOpen={() => setLifecycleOpen(true)}
          />

          {onMoneyStatusChange ? (
            <div className="shrink-0 pb-3 max-md:px-4">
              <InvoiceMoneyStagesBar
                currentStatus={renderInvoice.moneyStatus}
                onStageClick={(status) => void onMoneyStatusChange(renderInvoice.id, status)}
              />
            </div>
          ) : null}

          <DetailSheetTabBar
            tabs={detailTabs}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as InvoiceDetailSheetTab)}
            className="max-md:mt-3 max-md:px-4"
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-7 py-5 max-md:px-4">
              <InvoiceSheetStageGateBlockers highlight={stageGateHighlight} />

              <DetailSheetTabPanel tabKey={activeTab}>
                {activeTab === 'general' ? (
                  <InvoiceGeneralTab
                    invoice={renderInvoice}
                    gateRequiredFields={gateRequiredFields}
                    draft={onInvoiceUpdated ? generalDraft : null}
                    patchDraft={patchGeneralDraft}
                    formDisabled={saving}
                    onInvoiceUpdated={onInvoiceUpdated ? handleInvoiceChange : undefined}
                  />
                ) : null}
                {activeTab === 'payments' ? (
                  <InvoicePaymentsTab
                    invoice={renderInvoice}
                    gateRequiredFields={gateRequiredFields}
                    onPaymentRecorded={onPaymentRecorded}
                    onInvoiceUpdated={onInvoiceUpdated ? handleInvoiceChange : undefined}
                  />
                ) : null}
                {activeTab === 'history' ? <InvoiceHistoryTab /> : null}
              </DetailSheetTabPanel>
            </div>
          </ScrollArea>

          <DetailSheetFormFooter
            visible={activeTab === 'general' && Boolean(onInvoiceUpdated && renderInvoice)}
            dirty={generalDirty}
            saving={saving}
            errorMessage={generalError}
            onSave={handleGeneralSave}
            onCancel={handleGeneralCancel}
          />
        </EntityDetailSheetContent>
      </Sheet>

      {lifecycleMode && onInvoiceUpdated ? (
        <InvoiceLifecycleConfirmDialog
          invoice={renderInvoice}
          isPlatformOwner={isPlatformOwner}
          open={lifecycleOpen}
          onOpenChange={setLifecycleOpen}
          onInvoiceUpdated={handleInvoiceChange}
          onInvoiceDeleted={onInvoiceDeleted}
          forceNestedBackdrop={forceNestedBackdrop}
        />
      ) : null}
    </>
  );
}
