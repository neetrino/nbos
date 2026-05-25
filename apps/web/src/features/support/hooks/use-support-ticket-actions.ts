'use client';

import { useCallback, useEffect, useState } from 'react';
import { MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH } from '@/features/support/constants/support';
import type { SupportStatusDialogState } from '@/features/support/types/support-status-dialog';
import { technicalApi, type TechnicalProductProfileResponse } from '@/lib/api/technical';
import { supportApi, type SupportTicket } from '@/lib/api/support';
import { getApiErrorMessage } from '@/lib/api-errors';

type UseSupportTicketActionsParams = {
  tickets: SupportTicket[];
  refreshSupportViews: () => Promise<void>;
  setError: (message: string | null) => void;
};

export function useSupportTicketActions({
  tickets,
  refreshSupportViews,
  setError,
}: UseSupportTicketActionsParams) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [escalateTicket, setEscalateTicket] = useState<SupportTicket | null>(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [technicalTicket, setTechnicalTicket] = useState<SupportTicket | null>(null);
  const [technicalProfile, setTechnicalProfile] = useState<TechnicalProductProfileResponse | null>(
    null,
  );
  const [technicalProfileLoading, setTechnicalProfileLoading] = useState(false);
  const [draftTechnicalAssetId, setDraftTechnicalAssetId] = useState('');
  const [draftTechnicalEnvId, setDraftTechnicalEnvId] = useState('');
  const [statusDialog, setStatusDialog] = useState<SupportStatusDialogState | null>(null);
  const [statusResolutionDraft, setStatusResolutionDraft] = useState('');
  const [statusCloseReason, setStatusCloseReason] = useState('CLIENT_CONFIRMED');

  useEffect(() => {
    if (!technicalTicket?.productId) {
      setTechnicalProfile(null);
      return;
    }
    let cancelled = false;
    setTechnicalProfileLoading(true);
    void technicalApi
      .getProductProfile(technicalTicket.productId)
      .then((profile) => {
        if (!cancelled) {
          setTechnicalProfile(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTechnicalProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTechnicalProfileLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [technicalTicket]);

  const patchTicketStatus = useCallback(
    async (
      id: string,
      status: string,
      extra?: { resolutionSummary?: string; closeReason?: string },
    ): Promise<boolean> => {
      setActionId(`status:${id}`);
      try {
        await supportApi.updateStatus(id, status, extra);
        setError(null);
        await refreshSupportViews();
        return true;
      } catch (caught) {
        setError(getApiErrorMessage(caught, 'Status could not be updated.'));
        return false;
      } finally {
        setActionId(null);
      }
    },
    [refreshSupportViews, setError],
  );

  const handleStatusSelect = useCallback(
    (ticket: SupportTicket, next: string) => {
      if (next === ticket.status) {
        return;
      }
      if (next === 'RESOLVED') {
        setStatusResolutionDraft(ticket.resolutionSummary ?? '');
        setStatusDialog({ ticket, mode: 'RESOLVED' });
        return;
      }
      if (next === 'CLOSED') {
        if (ticket.status !== 'RESOLVED') {
          setError(
            'Move the ticket to Resolved before Closed (extension delivery may close it automatically).',
          );
          return;
        }
        setStatusCloseReason('CLIENT_CONFIRMED');
        setStatusDialog({ ticket, mode: 'CLOSED' });
        return;
      }
      void patchTicketStatus(ticket.id, next);
    },
    [patchTicketStatus, setError],
  );

  const submitResolveDialog = useCallback(async () => {
    if (!statusDialog || statusDialog.mode !== 'RESOLVED') {
      return;
    }
    const text = statusResolutionDraft.trim();
    if (text.length < MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH) {
      setError(
        `Resolution summary must be at least ${MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH} characters.`,
      );
      return;
    }
    const ok = await patchTicketStatus(statusDialog.ticket.id, 'RESOLVED', {
      resolutionSummary: text,
    });
    if (ok) {
      setStatusDialog(null);
    }
  }, [statusDialog, statusResolutionDraft, patchTicketStatus, setError]);

  const submitCloseDialog = useCallback(async () => {
    if (!statusDialog || statusDialog.mode !== 'CLOSED') {
      return;
    }
    const ok = await patchTicketStatus(statusDialog.ticket.id, 'CLOSED', {
      closeReason: statusCloseReason,
    });
    if (ok) {
      setStatusDialog(null);
    }
  }, [statusDialog, statusCloseReason, patchTicketStatus]);

  const handleKanbanMove = useCallback(
    (itemId: string, _from: string, toColumn: string) => {
      const ticket = tickets.find((t) => t.id === itemId);
      if (!ticket) {
        return;
      }
      handleStatusSelect(ticket, toColumn);
    },
    [tickets, handleStatusSelect],
  );

  const handleSubmitEscalation = useCallback(async () => {
    if (!escalateTicket) {
      return;
    }
    setActionId(`escalate:${escalateTicket.id}`);
    try {
      await supportApi.escalate(escalateTicket.id, escalateReason.trim() || undefined);
      setEscalateTicket(null);
      setEscalateReason('');
      await refreshSupportViews();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Escalation could not be recorded.'));
    } finally {
      setActionId(null);
    }
  }, [escalateTicket, escalateReason, refreshSupportViews, setError]);

  const handleReopenTicket = useCallback(
    async (ticket: SupportTicket) => {
      setActionId(`reopen:${ticket.id}`);
      try {
        await supportApi.reopen(ticket.id);
        await refreshSupportViews();
        setError(null);
      } catch (caught) {
        setError(getApiErrorMessage(caught, 'Ticket could not be reopened.'));
      } finally {
        setActionId(null);
      }
    },
    [refreshSupportViews, setError],
  );

  const saveTechnicalContext = useCallback(async () => {
    if (!technicalTicket?.productId) {
      return;
    }
    setActionId(`tech:${technicalTicket.id}`);
    try {
      await supportApi.update(technicalTicket.id, {
        technicalAssetId: draftTechnicalAssetId || null,
        technicalEnvironmentId: draftTechnicalEnvId || null,
      });
      setTechnicalTicket(null);
      await refreshSupportViews();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Technical context could not be saved.'));
    } finally {
      setActionId(null);
    }
  }, [technicalTicket, draftTechnicalAssetId, draftTechnicalEnvId, refreshSupportViews, setError]);

  const openEscalateDialog = useCallback((ticket: SupportTicket) => {
    setEscalateTicket(ticket);
    setEscalateReason(ticket.waitingReason ?? '');
  }, []);

  const openTechnicalDialog = useCallback((ticket: SupportTicket) => {
    setTechnicalTicket(ticket);
    setDraftTechnicalAssetId(ticket.technicalAsset?.id ?? '');
    setDraftTechnicalEnvId(ticket.technicalEnvironment?.id ?? '');
  }, []);

  const openResolveDialog = useCallback((ticket: SupportTicket) => {
    setStatusResolutionDraft(ticket.resolutionSummary ?? '');
    setStatusDialog({ ticket, mode: 'RESOLVED' });
  }, []);

  const openCloseDialog = useCallback(
    (ticket: SupportTicket) => {
      if (ticket.status !== 'RESOLVED') {
        setError(
          'Move the ticket to Resolved before Closed (extension delivery may close it automatically).',
        );
        return;
      }
      setStatusCloseReason('CLIENT_CONFIRMED');
      setStatusDialog({ ticket, mode: 'CLOSED' });
    },
    [setError],
  );

  return {
    actionId,
    escalateTicket,
    setEscalateTicket,
    escalateReason,
    setEscalateReason,
    technicalTicket,
    setTechnicalTicket,
    technicalProfile,
    technicalProfileLoading,
    draftTechnicalAssetId,
    setDraftTechnicalAssetId,
    draftTechnicalEnvId,
    setDraftTechnicalEnvId,
    statusDialog,
    setStatusDialog,
    statusResolutionDraft,
    setStatusResolutionDraft,
    statusCloseReason,
    setStatusCloseReason,
    handleStatusSelect,
    submitResolveDialog,
    submitCloseDialog,
    handleKanbanMove,
    handleSubmitEscalation,
    handleReopenTicket,
    saveTechnicalContext,
    openEscalateDialog,
    openTechnicalDialog,
    openResolveDialog,
    openCloseDialog,
  };
}
