'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Ban, Layers } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  EntityDetailSheetContent,
  EntityItemHost,
  ErrorState,
  LoadingState,
  QuickCreateTaskDialog,
  StatusBadge,
} from '@/components/shared';
import {
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
import {
  clientServiceTaskDefaultDueDate,
  clientServiceTaskDefaultLinks,
} from '@/features/finance/constants/client-service-task-links';
import { clientServicesListWithOpenServiceHref } from '@/features/finance/constants/client-service-deep-link';
import {
  clientServiceFormToPayload,
  clientServiceToFormState,
  isClientServiceFormDirty,
  parseOptionalAmount,
  type ClientServiceFormState,
} from '@/features/finance/utils/client-service-form-state';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { ClientServiceCreateDialogs } from './ClientServiceCreateDialogs';
import { ClientServiceDetailSheetBody } from './ClientServiceDetailSheetBody';
import {
  CLIENT_SERVICE_DETAIL_SHEET_TABS,
  type ClientServiceDetailSheetTab,
} from './client-service-detail-sheet-tabs';
import { useClientServiceProjects } from './use-client-service-projects';

interface ClientServiceDetailSheetProps {
  serviceId: string | null;
  initialService?: ClientServiceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onRequestCancel?: (target: { id: string; name: string }) => void;
}

function canSaveClientServiceForm(form: ClientServiceFormState): boolean {
  const ourCost = parseOptionalAmount(form.ourCost);
  const clientCharge = parseOptionalAmount(form.clientCharge);
  return (
    Boolean(form.projectId && form.name.trim()) &&
    !Number.isNaN(ourCost) &&
    !Number.isNaN(clientCharge)
  );
}

function closeCreateDialogs(setters: {
  setInvoiceOpen: (open: boolean) => void;
  setExpenseOpen: (open: boolean) => void;
  setQuickCreateTaskOpen: (open: boolean) => void;
}) {
  setters.setInvoiceOpen(false);
  setters.setExpenseOpen(false);
  setters.setQuickCreateTaskOpen(false);
}

export function ClientServiceDetailSheet({
  serviceId,
  initialService = null,
  open,
  onOpenChange,
  onSaved,
  onRequestCancel,
}: ClientServiceDetailSheetProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const {
    entity: service,
    setEntity: setService,
    loading,
    error,
    refresh: fetchService,
  } = useEntityDetailHydration({
    entityId: serviceId ?? '',
    open: open && Boolean(serviceId),
    initialEntity: initialService,
    fetchById: clientServicesApi.getById,
    isDirty: () => dirtyRef.current,
    loadErrorMessage: 'Client service could not be loaded.',
  });
  const [draft, setDraft] = useState<ClientServiceFormState | null>(null);
  const [snap, setSnap] = useState<ClientServiceFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ClientServiceDetailSheetTab>('general');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [quickCreateTaskOpen, setQuickCreateTaskOpen] = useState(false);
  const dirtyRef = useRef(false);
  const projects = useClientServiceProjects(open);

  useEffect(() => {
    setActiveTab('general');
    if (!open) {
      closeCreateDialogs({
        setInvoiceOpen,
        setExpenseOpen,
        setQuickCreateTaskOpen,
      });
    }
  }, [serviceId, open]);

  const taskDefaultLinks = useMemo(
    () => (service ? clientServiceTaskDefaultLinks(service) : undefined),
    [service],
  );

  const taskDefaultDueDate = useMemo(
    () => (service ? clientServiceTaskDefaultDueDate(service.renewalDate) : undefined),
    [service],
  );

  const canCreateTask = creatorReady && Boolean(creatorId);

  const refreshAfterLinkCreated = useCallback(() => {
    void fetchService();
    onSaved();
  }, [fetchService, onSaved]);

  const handleInvoiceCreated = useCallback(() => {
    setActiveTab('invoices');
    refreshAfterLinkCreated();
  }, [refreshAfterLinkCreated]);

  const handleExpenseCreated = useCallback(() => {
    setActiveTab('expenses');
    refreshAfterLinkCreated();
  }, [refreshAfterLinkCreated]);

  const handleTaskCreated = useCallback(() => {
    setActiveTab('tasks');
    refreshAfterLinkCreated();
  }, [refreshAfterLinkCreated]);

  useLayoutEffect(() => {
    if (!service) {
      setDraft(null);
      setSnap(null);
      return;
    }
    if (dirtyRef.current) return;
    const next = clientServiceToFormState(service);
    setDraft(next);
    setSnap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft sync keyed on service.id
  }, [service?.id, service?.updatedAt]);

  const patchDraft = useCallback((partial: Partial<ClientServiceFormState>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const dirty = draft != null && snap != null && isClientServiceFormDirty(draft, snap);
  dirtyRef.current = dirty;

  const handleServiceChange = useCallback(
    (updated: ClientServiceRecord) => {
      dirtyRef.current = false;
      setService(updated);
      const next = clientServiceToFormState(updated);
      setDraft(next);
      setSnap(next);
      onSaved();
    },
    [onSaved, setService],
  );

  const handleSave = useCallback(() => {
    if (!serviceId || !draft || !snap || !canSaveClientServiceForm(draft)) return;
    if (!isClientServiceFormDirty(draft, snap)) return;

    setFormError(null);
    const draftAtSave = draft;
    const snapAtSave = snap;
    setSnap({ ...draftAtSave });
    setSaving(true);

    void (async () => {
      try {
        const saved = await clientServicesApi.update(
          serviceId,
          clientServiceFormToPayload(draftAtSave),
        );
        dirtyRef.current = false;
        handleServiceChange(saved);
      } catch (caught) {
        setSnap(snapAtSave);
        setDraft(draftAtSave);
        setFormError(getApiErrorMessage(caught, 'Client service could not be saved.'));
      } finally {
        setSaving(false);
      }
    })();
  }, [serviceId, draft, snap, handleServiceChange]);

  const handleCancel = useCallback(() => {
    setFormError(null);
    if (snap) setDraft({ ...snap });
  }, [snap]);

  if (!serviceId) return null;

  const typeLabel = service
    ? clientServiceOptionLabel(CLIENT_SERVICE_TYPES, service.type)
    : undefined;
  const statusLabel = service
    ? clientServiceOptionLabel(CLIENT_SERVICE_STATUSES, service.status)
    : undefined;
  const isCancelled = service?.status === 'CANCELLED';
  const sourcePageHref = clientServicesListWithOpenServiceHref(serviceId);

  return (
    <EntityItemHost nested onEntityChanged={() => void fetchService()}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="compact"
          sourcePageHref={sourcePageHref}
        >
          <div className="bg-background border-border shrink-0 border-b px-5 pt-5 pb-3">
            {loading && !service ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : service ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                    <Layers className="text-muted-foreground size-5 shrink-0" aria-hidden />
                    <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                      {service.name}
                    </h2>
                    {typeLabel ? (
                      <StatusBadge
                        label={typeLabel}
                        variant="indigo"
                        className="shrink-0 self-center"
                      />
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {statusLabel ? (
                    <StatusBadge
                      label={statusLabel}
                      variant="gray"
                      className="shrink-0 self-center"
                    />
                  ) : null}
                  {!isCancelled && onRequestCancel ? (
                    <DetailSheetSettingsMenu>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={saving}
                        onClick={() => onRequestCancel({ id: service.id, name: service.name })}
                      >
                        <Ban />
                        Cancel service
                      </DropdownMenuItem>
                    </DetailSheetSettingsMenu>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <DetailSheetTabBar
            tabs={CLIENT_SERVICE_DETAIL_SHEET_TABS}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as ClientServiceDetailSheetTab)}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 py-5">
              {loading && !service ? (
                <LoadingState count={3} />
              ) : error ? (
                <ErrorState description={error} onRetry={() => void fetchService()} />
              ) : service && draft ? (
                <ClientServiceDetailSheetBody
                  activeTab={activeTab}
                  serviceId={serviceId}
                  service={service}
                  draft={draft}
                  patchDraft={patchDraft}
                  projects={projects}
                  saving={saving}
                  readOnly={isCancelled}
                  canCreateTask={canCreateTask && !isCancelled}
                  onCreateInvoice={() => setInvoiceOpen(true)}
                  onCreateExpense={() => setExpenseOpen(true)}
                  onCreateTask={() => setQuickCreateTaskOpen(true)}
                />
              ) : null}
            </div>
          </ScrollArea>

          <DetailSheetFormFooter
            visible={activeTab === 'general' && Boolean(service && draft) && !isCancelled}
            dirty={dirty && (draft ? canSaveClientServiceForm(draft) : false)}
            saving={saving}
            errorMessage={formError}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </EntityDetailSheetContent>
      </Sheet>

      {service ? (
        <>
          <ClientServiceCreateDialogs
            service={service}
            invoiceOpen={invoiceOpen}
            onInvoiceOpenChange={setInvoiceOpen}
            expenseOpen={expenseOpen}
            onExpenseOpenChange={setExpenseOpen}
            onInvoiceCreated={handleInvoiceCreated}
            onExpenseCreated={handleExpenseCreated}
          />
          <QuickCreateTaskDialog
            open={quickCreateTaskOpen}
            onOpenChange={setQuickCreateTaskOpen}
            creatorId={creatorId ?? ''}
            creatorReady={creatorReady}
            defaultLinks={taskDefaultLinks}
            defaultDueDate={taskDefaultDueDate}
            forceNestedBackdrop
            onCreated={handleTaskCreated}
          />
        </>
      ) : null}
    </EntityItemHost>
  );
}
