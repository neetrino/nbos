'use client';

import { Badge } from '@/components/ui/badge';
import { isMissingActiveWhatsAppGroup, whatsappGroupMissingLabel } from '../deal-won-whatsapp-gate';

interface WhatsAppGroupMissingBadgeProps {
  bindingStatus?: string | null;
  groupChatId?: string | null;
}

export function WhatsAppGroupMissingBadge({
  bindingStatus,
  groupChatId,
}: WhatsAppGroupMissingBadgeProps) {
  if (!isMissingActiveWhatsAppGroup({ bindingStatus, groupChatId })) {
    return null;
  }

  const failed = bindingStatus === 'FAILED';
  return (
    <Badge
      variant={failed ? 'destructive' : 'outline'}
      title={whatsappGroupMissingLabel(bindingStatus)}
    >
      {whatsappGroupMissingLabel(bindingStatus)}
    </Badge>
  );
}
