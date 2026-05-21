'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  EntityDetailSheetContent,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/shared';
import {
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
  clientServiceOptionLabel,
} from '@/features/finance/constants/client-services';
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
import { ClientServiceGeneralTab } from './ClientServiceGeneralTab';
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
}: ClientServiceDetailSheetProps) {
  const [service, setService] = useState<ClientServiceRecord | null>(null);
  const [draft, setDraft] = useState<ClientServiceFormState | null>(null);
  const [snap, setSnap] = useState<ClientServiceFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ClientServiceDetailSheetTab>('general');
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
  }, [serviceId, open]);

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

  if (!serviceId) return null;

  const typeLabel = service
    ? clientServiceOptionLabel(CLIENT_SERVICE_TYPES, service.type)
    : undefined;
  const statusLabel = service
    ? clientServiceOptionLabel(CLIENT_SERVICE_STATUSES, service.status)
    : undefined;
  const sourcePageHref = clientServicesListWithOpenServiceHref(serviceId);

  return (
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
              <div className="flex flex-wrap gap-1.5">
                {typeLabel ? <StatusBadge label={typeLabel} variant="indigo" /> : null}
                {statusLabel ? <StatusBadge label={statusLabel} variant="gray" /> : null}
              </div>
            </div>
          ) : null}
        </div>

        {CLIENT_SERVICE_DETAIL_SHEET_TABS.length > 1 ? (
          <DetailSheetTabBar
            tabs={CLIENT_SERVICE_DETAIL_SHEET_TABS}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as ClientServiceDetailSheetTab)}
          />
        ) : null}

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 py-5">
            {loading ? (
              <LoadingState count={3} />
            ) : error ? (
              <ErrorState description={error} onRetry={() => void fetchService()} />
            ) : service && draft ? (
              <ClientServiceGeneralTab
                serviceId={serviceId}
                service={service}
                draft={draft}
                patchDraft={patchDraft}
                projects={projects}
                formDisabled={saving}
              />
            ) : null}
          </div>
        </ScrollArea>

        <DetailSheetFormFooter
          visible={Boolean(service && draft)}
          dirty={dirty && (draft ? canSaveClientServiceForm(draft) : false)}
          saving={saving}
          errorMessage={formError}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}
