'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Layers, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { ClientServiceDetailSheetBody } from './ClientServiceDetailSheetBody';
import {
  ClientServiceSheetActions,
  type ClientServiceActionKind,
} from './ClientServiceSheetActions';
import {
  CLIENT_SERVICE_DETAIL_SHEET_TABS,
  type ClientServiceDetailSheetTab,
} from './client-service-detail-sheet-tabs';
import { useClientServiceProjects } from './use-client-service-projects';

interface ClientServiceDetailSheetProps {
  serviceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onRequestDelete: (target: { id: string; name: string }) => void;
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

export function ClientServiceDetailSheet({
  serviceId,
  open,
  onOpenChange,
  onSaved,
  onRequestDelete,
}: ClientServiceDetailSheetProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const [service, setService] = useState<ClientServiceRecord | null>(null);
  const [draft, setDraft] = useState<ClientServiceFormState | null>(null);
  const [snap, setSnap] = useState<ClientServiceFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ClientServiceDetailSheetTab>('general');
  const [quickCreateTaskOpen, setQuickCreateTaskOpen] = useState(false);
  const dirtyRef = useRef(false);
  const projects = useClientServiceProjects(open);

  const fetchService = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const row = await clientServicesApi.getById(serviceId);
      setService(row);
      setError(null);
      setFormError(null);
    } catch (caught) {
      setService(null);
      setError(getApiErrorMessage(caught, 'Client service could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (!open || !serviceId) return;
    void fetchService();
  }, [open, serviceId, fetchService]);

  useEffect(() => {
    setActiveTab('general');
    if (!open) setQuickCreateTaskOpen(false);
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

  const handleOpenCreateTask = useCallback(() => {
    setQuickCreateTaskOpen(true);
  }, []);

  const handleTaskCreated = useCallback(() => {
    setActiveTab('tasks');
    void fetchService();
    onSaved();
  }, [fetchService, onSaved]);

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
    [onSaved],
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

  const runServiceAction = useCallback(
    async (kind: ClientServiceActionKind) => {
      if (!service) return;
      setActionId(`${kind}:${service.id}`);
      try {
        if (kind === 'invoice') {
          await clientServicesApi.createInvoice(service.id);
          toast.success('Linked invoice card created.');
          setActiveTab('invoices');
        } else if (kind === 'plan') {
          await clientServicesApi.createExpensePlan(service.id);
          toast.success('Linked expense plan created.');
          setActiveTab('expenses');
        } else if (kind === 'expense') {
          await clientServicesApi.createExpense(service.id);
          toast.success('Linked expense card created.');
          setActiveTab('expenses');
        }
        await fetchService();
        onSaved();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Client service action failed.'));
      } finally {
        setActionId(null);
      }
    },
    [fetchService, onSaved, service],
  );

  if (!serviceId) return null;

  const typeLabel = service
    ? clientServiceOptionLabel(CLIENT_SERVICE_TYPES, service.type)
    : undefined;
  const statusLabel = service
    ? clientServiceOptionLabel(CLIENT_SERVICE_STATUSES, service.status)
    : undefined;
  const sourcePageHref = clientServicesListWithOpenServiceHref(serviceId);
  const actionBusy = saving || Boolean(actionId);

  return (
    <EntityItemHost nested onEntityChanged={() => void fetchService()}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="medium"
          sourcePageHref={sourcePageHref}
        >
          <div className="bg-background border-border shrink-0 border-b px-5 pt-5 pb-3">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : service ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full min-w-0 items-center gap-2">
                    <Layers className="text-muted-foreground size-5 shrink-0" aria-hidden />
                    <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                      {service.name}
                    </h2>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {typeLabel ? <StatusBadge label={typeLabel} variant="indigo" /> : null}
                  {statusLabel ? <StatusBadge label={statusLabel} variant="gray" /> : null}
                  <DetailSheetSettingsMenu>
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={actionBusy}
                      onClick={() => onRequestDelete({ id: service.id, name: service.name })}
                    >
                      <Trash2 />
                      Delete service
                    </DropdownMenuItem>
                  </DetailSheetSettingsMenu>
                </div>
              </div>
            ) : null}
          </div>

          {service ? (
            <div className="border-border shrink-0 border-b px-5 py-2.5">
              <ClientServiceSheetActions
                service={service}
                actionId={actionId}
                canCreateTask={canCreateTask}
                disabled={actionBusy}
                onAction={(kind) => void runServiceAction(kind)}
                onCreateTask={handleOpenCreateTask}
              />
            </div>
          ) : null}

          <DetailSheetTabBar
            tabs={CLIENT_SERVICE_DETAIL_SHEET_TABS}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as ClientServiceDetailSheetTab)}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 py-5">
              {loading ? (
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
                  actionId={actionId}
                  canCreateTask={canCreateTask}
                  onAction={(kind) => void runServiceAction(kind)}
                  onCreateTask={handleOpenCreateTask}
                />
              ) : null}
            </div>
          </ScrollArea>

          <DetailSheetFormFooter
            visible={activeTab === 'general' && Boolean(service && draft)}
            dirty={dirty && (draft ? canSaveClientServiceForm(draft) : false)}
            saving={saving}
            errorMessage={formError}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </EntityDetailSheetContent>
      </Sheet>

      {service ? (
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
      ) : null}
    </EntityItemHost>
  );
}
