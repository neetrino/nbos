import { MessageCircle, type LucideIcon } from 'lucide-react';
import { isWhatsAppCreateInFlight } from './whatsapp-create-status';

export type DealWhatsAppQuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  disabledTitle?: string;
  onClick?: () => void;
};

export function buildDealWhatsAppQuickAction(input: {
  productId: string | null;
  projectId: string | undefined;
  bindingStatus: string | null;
  latestOperationStatus: string | null | undefined;
  whatsappBusy: boolean;
  onEnsure: () => void;
  onOpenSettings: (productId: string) => void;
}): DealWhatsAppQuickAction {
  if (!input.productId) {
    return {
      id: 'whatsapp-group',
      label: 'Create WhatsApp group',
      icon: MessageCircle,
      enabled: false,
      disabledTitle: 'Product has not been created yet.',
    };
  }
  if (input.bindingStatus === 'ACTIVE') {
    return {
      id: 'whatsapp-settings',
      label: 'Open WhatsApp settings',
      icon: MessageCircle,
      enabled: true,
      onClick: () => input.onOpenSettings(input.productId as string),
    };
  }
  if (
    isWhatsAppCreateInFlight(input.bindingStatus) ||
    isWhatsAppCreateInFlight(input.latestOperationStatus)
  ) {
    return {
      id: 'whatsapp-group',
      label: 'Creating group…',
      icon: MessageCircle,
      enabled: false,
      disabledTitle: 'WhatsApp group creation is in progress',
    };
  }
  return buildDealWhatsAppFollowUpAction(input);
}

function buildDealWhatsAppFollowUpAction(input: {
  productId: string | null;
  projectId: string | undefined;
  bindingStatus: string | null;
  latestOperationStatus: string | null | undefined;
  whatsappBusy: boolean;
  onEnsure: () => void;
  onOpenSettings: (productId: string) => void;
}): DealWhatsAppQuickAction {
  if (input.bindingStatus === 'OUTCOME_UNKNOWN' || input.bindingStatus === 'NEEDS_RECONCILIATION') {
    return {
      id: 'whatsapp-resolve',
      label: 'Resolve WhatsApp group',
      icon: MessageCircle,
      enabled: true,
      onClick: () => {
        if (!input.productId) return;
        input.onOpenSettings(input.productId);
      },
    };
  }
  const failed = input.bindingStatus === 'FAILED' || input.latestOperationStatus === 'FAILED';
  return {
    id: failed ? 'whatsapp-retry' : 'whatsapp-group',
    label: failed ? 'Retry WhatsApp group creation' : 'Create WhatsApp group',
    icon: MessageCircle,
    enabled: !input.whatsappBusy,
    onClick: () => input.onEnsure(),
  };
}
