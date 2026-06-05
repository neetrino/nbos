'use client';

import type { SupportTicket } from '@/lib/api/support';
import { SupportEscalateDialog } from '@/features/support/components/SupportEscalateDialog';
import { SupportStatusDialogs } from '@/features/support/components/SupportStatusDialogs';
import { SupportTechnicalContextDialog } from '@/features/support/components/SupportTechnicalContextDialog';
import { SupportTicketDetailSheet } from '@/features/support/components/SupportTicketDetailSheet';
import type { useSupportTicketActions } from '@/features/support/hooks/use-support-ticket-actions';

export interface SupportTicketActionOverlaysProps {
  ticketId: string | null;
  initialTicket?: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailRefreshKey: number;
  meId: string | null;
  onListInvalidate: () => void;
  actions: ReturnType<typeof useSupportTicketActions>;
}

export function SupportTicketActionOverlays({
  ticketId,
  initialTicket = null,
  open,
  onOpenChange,
  detailRefreshKey,
  meId,
  onListInvalidate,
  actions,
}: SupportTicketActionOverlaysProps) {
  return (
    <>
      <SupportEscalateDialog
        ticket={actions.escalateTicket}
        reason={actions.escalateReason}
        onReasonChange={actions.setEscalateReason}
        onClose={() => {
          actions.setEscalateTicket(null);
          actions.setEscalateReason('');
        }}
        onConfirm={() => void actions.handleSubmitEscalation()}
        submitting={Boolean(actions.actionId?.startsWith('escalate:'))}
      />

      <SupportTechnicalContextDialog
        ticket={actions.technicalTicket}
        profile={actions.technicalProfile}
        profileLoading={actions.technicalProfileLoading}
        assetId={actions.draftTechnicalAssetId}
        environmentId={actions.draftTechnicalEnvId}
        onAssetIdChange={actions.setDraftTechnicalAssetId}
        onEnvironmentIdChange={actions.setDraftTechnicalEnvId}
        onClose={() => actions.setTechnicalTicket(null)}
        onSave={() => void actions.saveTechnicalContext()}
        saving={Boolean(actions.actionId?.startsWith('tech:'))}
      />

      <SupportStatusDialogs
        statusDialog={actions.statusDialog}
        resolutionDraft={actions.statusResolutionDraft}
        closeReason={actions.statusCloseReason}
        onResolutionDraftChange={actions.setStatusResolutionDraft}
        onCloseReasonChange={actions.setStatusCloseReason}
        onDismiss={() => actions.setStatusDialog(null)}
        onSubmitResolve={() => void actions.submitResolveDialog()}
        onSubmitClose={() => void actions.submitCloseDialog()}
        statusSubmitting={Boolean(actions.actionId?.startsWith('status:'))}
      />

      <SupportTicketDetailSheet
        ticketId={ticketId}
        initialTicket={initialTicket}
        open={open}
        onOpenChange={onOpenChange}
        refreshKey={detailRefreshKey}
        meId={meId}
        onListInvalidate={onListInvalidate}
        onRequestResolve={actions.openResolveDialog}
        onRequestClose={actions.openCloseDialog}
        onRequestEscalate={actions.openEscalateDialog}
        onRequestTechnical={actions.openTechnicalDialog}
      />
    </>
  );
}
