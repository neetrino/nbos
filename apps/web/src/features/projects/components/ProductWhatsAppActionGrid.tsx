'use client';

import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Plus, RefreshCw, Send, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { whatsappCreateButtonLabel } from '@/features/crm/whatsapp-create-status';
import { WA_ACCENT_ICON_WRAP, WA_ACTION_CARD } from './product-whatsapp-settings-ui';

export interface ProductWhatsAppActionGridProps {
  busy: boolean;
  gatewayConfigured: boolean;
  status: string;
  createInFlight: boolean;
  createFailed: boolean;
  onCreateGroup: () => void;
  onSyncParticipants: () => void;
  onSendClientInvitation: () => void;
  onResendInvitation: () => void;
}

export function ProductWhatsAppActionGrid({
  busy,
  gatewayConfigured,
  status,
  createInFlight,
  createFailed,
  onCreateGroup,
  onSyncParticipants,
  onSendClientInvitation,
  onResendInvitation,
}: ProductWhatsAppActionGridProps) {
  const createDisabled = busy || !gatewayConfigured || status === 'ACTIVE' || createInFlight;
  const activeOnlyDisabled = busy || !gatewayConfigured || status !== 'ACTIVE';

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <ActionCard
        icon={Plus}
        title={whatsappCreateButtonLabel({
          inFlight: createInFlight,
          failed: createFailed,
          idleLabel: 'Create group',
        })}
        description="Create a new WhatsApp group"
        disabled={createDisabled}
        onClick={onCreateGroup}
      />
      <ActionCard
        icon={RefreshCw}
        title="Sync participants"
        description="Sync group participants"
        disabled={activeOnlyDisabled}
        onClick={onSyncParticipants}
      />
      <ActionCard
        icon={UserPlus}
        title="Send client invitation"
        description="Invite clients to the group"
        disabled={activeOnlyDisabled}
        onClick={onSendClientInvitation}
      />
      <ActionCard
        icon={Send}
        title="Resend invitation"
        description="Resend previous invitation"
        disabled={activeOnlyDisabled}
        onClick={onResendInvitation}
      />
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={cn(WA_ACTION_CARD)} disabled={disabled} onClick={onClick}>
      <span className={WA_ACCENT_ICON_WRAP} aria-hidden>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block text-sm font-semibold">{title}</span>
        <span className="text-muted-foreground block text-xs">{description}</span>
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </button>
  );
}
