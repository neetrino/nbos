'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { LeadSheet } from '@/features/crm/components/LeadSheet';
import { leadsApi, type Lead } from '@/lib/api/leads';
import { getApiErrorMessage, isStageGateApiError } from '@/lib/api-errors';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';

interface EntityLeadSheetDeepLinkProps {
  leadId: string | null;
  /** Seed sheet content immediately (avoids loading flash / double open). */
  initialLead?: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after a successful save or stage change (e.g. refresh attribution list). */
  onEntityChanged?: () => void;
}

export function EntityLeadSheetDeepLink({
  leadId,
  initialLead = null,
  open,
  onOpenChange,
  onEntityChanged,
}: EntityLeadSheetDeepLinkProps) {
  const t = useTranslations('crm');
  const { persistedValue: renderLeadId, onOpenChangeComplete: clearRenderLeadId } =
    useSheetPersistedValue(leadId);
  const hostMounted = useSheetHostMounted(open, renderLeadId);

  const [lead, setLead] = useState<Lead | null>(() =>
    initialLead && leadId && initialLead.id === leadId ? initialLead : null,
  );

  if (open && leadId && initialLead?.id === leadId && lead?.id !== leadId) {
    setLead(initialLead);
  }

  useEffect(() => {
    if (!open || !renderLeadId) return;

    let cancelled = false;
    void leadsApi
      .getById(renderLeadId)
      .then((loaded) => {
        if (!cancelled) setLead(loaded);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t('leads.notFound'));
          onOpenChange(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [renderLeadId, onOpenChange, open, t]);

  const handleUpdate = useCallback(
    async (id: string, data: Partial<Lead>) => {
      try {
        const updated = await leadsApi.update(id, data);
        setLead(updated);
        onEntityChanged?.();
      } catch (err) {
        toast.error(getApiErrorMessage(err, t('leadSheet.deepLinkSaveError')));
        throw err;
      }
    },
    [onEntityChanged, t],
  );

  const handleStatusChange = useCallback(
    async (id: string, status: string) => {
      if (!lead || lead.id !== id) return;
      try {
        const updated = await leadsApi.updateStatus(id, status);
        setLead(updated);
        onEntityChanged?.();
      } catch (err) {
        if (isStageGateApiError(err)) {
          toast.error(t('leadSheet.deepLinkStageGate'));
          return;
        }
        toast.error(getApiErrorMessage(err, t('leads.stageBlocked')));
      }
    },
    [lead, onEntityChanged, t],
  );

  const handleRefresh = useCallback(async () => {
    if (!renderLeadId) return;
    try {
      const loaded = await leadsApi.getById(renderLeadId);
      setLead(loaded);
    } catch {
      toast.error(t('leadSheet.deepLinkRefreshError'));
    }
  }, [renderLeadId, t]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        clearRenderLeadId(false);
        setLead(null);
      }
    },
    [clearRenderLeadId, onOpenChange],
  );

  if (!hostMounted) return null;

  return (
    <LeadSheet
      lead={lead}
      open={open}
      onOpenChange={handleOpenChange}
      onUpdate={handleUpdate}
      onStatusChange={handleStatusChange}
      onRefresh={handleRefresh}
    />
  );
}
