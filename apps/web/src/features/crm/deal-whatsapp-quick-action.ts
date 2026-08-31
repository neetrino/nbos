import { MessageCircle, type LucideIcon } from 'lucide-react';
import { isWhatsAppWonGateDealType } from './deal-won-whatsapp-gate';
import { isWhatsAppCreateInFlight } from './whatsapp-create-status';

export type DealWhatsAppQuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  disabledTitle?: string;
  onClick?: () => void;
};

export function canCreateDealLevelWhatsAppGroup(input: {
  dealType: string | null | undefined;
  contactId: string | null | undefined;
  productId: string | null;
}): boolean {
  if (input.productId) return true;
  return isWhatsAppWonGateDealType(input.dealType) && Boolean(input.contactId);
}

export function buildDealWhatsAppQuickActions(input: {
  dealType: string | null | undefined;
  contactId: string | null | undefined;
  productId: string | null;
  projectId: string | undefined;
  bindingStatus: string | null;
  groupChatId: string | null;
  latestOperationStatus: string | null | undefined;
  whatsappBusy: boolean;
  onEnsure: () => void;
  onBind: () => void;
  onOpenSettings: (productId: string) => void;
  onCopyGroupId: (groupChatId: string) => void;
}): DealWhatsAppQuickAction[] {
  const actions: DealWhatsAppQuickAction[] = [
    buildDealWhatsAppPrimaryAction(input),
    {
      id: 'whatsapp-bind',
      label: 'Bind existing group',
      icon: MessageCircle,
      enabled: canCreateDealLevelWhatsAppGroup(input) && !input.whatsappBusy,
      disabledTitle: bindDisabledTitle(input),
      onClick: input.onBind,
    },
  ];
  if (input.groupChatId && input.bindingStatus === 'ACTIVE') {
    actions.push({
      id: 'whatsapp-copy-id',
      label: 'Copy group ID',
      icon: MessageCircle,
      enabled: true,
      onClick: () => input.onCopyGroupId(input.groupChatId as string),
    });
  }
  return actions;
}

function bindDisabledTitle(input: {
  dealType: string | null | undefined;
  contactId: string | null | undefined;
  productId: string | null;
}): string | undefined {
  if (input.productId || canCreateDealLevelWhatsAppGroup(input)) return undefined;
  if (!isWhatsAppWonGateDealType(input.dealType)) {
    return 'EXTENSION and MAINTENANCE use the existing Product WhatsApp group.';
  }
  return 'Add a primary Contact first.';
}

function buildDealWhatsAppPrimaryAction(input: {
  dealType: string | null | undefined;
  contactId: string | null | undefined;
  productId: string | null;
  bindingStatus: string | null;
  latestOperationStatus: string | null | undefined;
  whatsappBusy: boolean;
  onEnsure: () => void;
  onOpenSettings: (productId: string) => void;
}): DealWhatsAppQuickAction {
  if (input.bindingStatus === 'ACTIVE' && input.productId) {
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
  if (!canCreateDealLevelWhatsAppGroup(input) && input.bindingStatus !== 'FAILED') {
    return {
      id: 'whatsapp-group',
      label: 'Create WhatsApp group',
      icon: MessageCircle,
      enabled: false,
      disabledTitle: bindDisabledTitle(input) ?? 'Product has not been created yet.',
    };
  }
  if (input.bindingStatus === 'OUTCOME_UNKNOWN' || input.bindingStatus === 'NEEDS_RECONCILIATION') {
    return {
      id: 'whatsapp-resolve',
      label: 'Resolve WhatsApp group',
      icon: MessageCircle,
      enabled: Boolean(input.productId),
      disabledTitle: input.productId ? undefined : 'Open Product settings after Deal Won.',
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
    enabled: !input.whatsappBusy && canCreateDealLevelWhatsAppGroup(input),
    disabledTitle: bindDisabledTitle(input),
    onClick: () => input.onEnsure(),
  };
}
