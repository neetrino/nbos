'use client';

import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Plus, RefreshCw, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { whatsappCreateButtonLabel } from '@/features/crm/whatsapp-create-status';
import { WA_ACCENT_ICON_WRAP, WA_ACTION_CARD, WA_ACTION_STACK } from './product-whatsapp-settings-ui';

export interface ProductWhatsAppActionGridProps {
  busy: boolean;
  gatewayConfigured: boolean;
  status: string;
  createInFlight: boolean;
  createFailed: boolean;
  onCreateGroup: () => void;
  onSyncParticipants: () => void;
  onInviteClient: () => void;
}

export function ProductWhatsAppActionGrid({
  busy,
  gatewayConfigured,
  status,
  createInFlight,
  createFailed,
  onCreateGroup,
  onSyncParticipants,
  onInviteClient,
}: ProductWhatsAppActionGridProps) {
  const createDisabled = busy || !gatewayConfigured || status === 'ACTIVE' || createInFlight;
  const activeOnlyDisabled = busy || !gatewayConfigured || status !== 'ACTIVE';

  return (
    <div className={WA_ACTION_STACK}>
      <ActionCard
        icon={Plus}
        title={whatsappCreateButtonLabel({
          inFlight: createInFlight,
          failed: createFailed,
          idleLabel: 'Create group',
        })}
        disabled={createDisabled}
        onClick={onCreateGroup}
      />
      <ActionCard
        icon={RefreshCw}
        title="Sync participants"
        disabled={activeOnlyDisabled}
        onClick={onSyncParticipants}
      />
      <ActionCard
        icon={UserPlus}
        title="Invite client"
        disabled={activeOnlyDisabled}
        onClick={onInviteClient}
      />
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={cn(WA_ACTION_CARD)} disabled={disabled} onClick={onClick}>
      <span className={WA_ACCENT_ICON_WRAP} aria-hidden>
        <Icon className="size-3.5" />
      </span>
      <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
      <ChevronRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
    </button>
  );
}
