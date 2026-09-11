import { CircleAlert, Copy, Link2, Plus, RotateCcw, Settings, type LucideIcon } from 'lucide-react';
import { isWhatsAppWonGateDealType } from './deal-won-whatsapp-gate';
import { isWhatsAppCreateInFlight } from './whatsapp-create-status';

export type DealWhatsAppQuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  title?: string;
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
  /** False while Deal WhatsApp state is still loading — avoid a Create-group flash. */
  stateReady?: boolean;
  onEnsure: () => void;
  onBind: () => void;
  onOpenSettings: (productId: string) => void;
  onCopyGroupId: (groupChatId: string) => void;
}): DealWhatsAppQuickAction[] {
  const creating =
    isWhatsAppCreateInFlight(input.bindingStatus) ||
    isWhatsAppCreateInFlight(input.latestOperationStatus);
  const actions: DealWhatsAppQuickAction[] = [
    buildDealWhatsAppPrimaryAction(input),
    {
      id: 'whatsapp-bind',
      label: 'Bind group',
      title: 'Bind existing group',
      icon: Link2,
      enabled: canCreateDealLevelWhatsAppGroup(input) && !input.whatsappBusy && !creating,
      disabledTitle: creating ? 'WhatsApp group creation is in progress' : bindDisabledTitle(input),
      onClick: input.onBind,
    },
  ];
  if (input.groupChatId && input.bindingStatus === 'ACTIVE') {
    actions.push({
      id: 'whatsapp-copy-id',
      label: 'Copy ID',
      title: 'Copy group ID',
      icon: Copy,
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
  stateReady?: boolean;
  onEnsure: () => void;
  onOpenSettings: (productId: string) => void;
}): DealWhatsAppQuickAction {
  const holdCreateUntilReady = input.stateReady === false && input.bindingStatus !== 'FAILED';
  if (input.productId && (input.bindingStatus === 'ACTIVE' || holdCreateUntilReady)) {
    return {
      id: 'whatsapp-settings',
      label: 'Settings',
      title: 'Open WhatsApp settings',
      icon: Settings,
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
      icon: Plus,
      enabled: false,
      disabledTitle: 'WhatsApp group creation is in progress',
    };
  }
  if (!canCreateDealLevelWhatsAppGroup(input) && input.bindingStatus !== 'FAILED') {
    return {
      id: 'whatsapp-group',
      label: 'Create group',
      icon: Plus,
      enabled: false,
      disabledTitle: bindDisabledTitle(input) ?? 'Product has not been created yet.',
    };
  }
  if (input.bindingStatus === 'OUTCOME_UNKNOWN' || input.bindingStatus === 'NEEDS_RECONCILIATION') {
    return {
      id: 'whatsapp-resolve',
      label: 'Resolve',
      icon: CircleAlert,
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
    label: failed ? 'Retry create' : 'Create group',
    icon: failed ? RotateCcw : Plus,
    enabled: !input.whatsappBusy && canCreateDealLevelWhatsAppGroup(input),
    disabledTitle: bindDisabledTitle(input),
    onClick: () => input.onEnsure(),
  };
}
