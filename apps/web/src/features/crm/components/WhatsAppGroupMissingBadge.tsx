'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { IntegrationBrandIcon } from '@/features/integrations/components/IntegrationBrandIcon';
import { isMissingActiveWhatsAppGroup } from '../deal-won-whatsapp-gate';
import {
  translateWhatsAppMissingLabel,
  translateWhatsAppMissingShortLabel,
} from '../i18n/crm-whatsapp-copy';

interface WhatsAppGroupMissingBadgeProps {
  bindingStatus?: string | null;
  groupChatId?: string | null;
}

export function WhatsAppGroupMissingBadge({
  bindingStatus,
  groupChatId,
}: WhatsAppGroupMissingBadgeProps) {
  const t = useTranslations('crm');
  if (!isMissingActiveWhatsAppGroup({ bindingStatus, groupChatId })) {
    return null;
  }

  const failed = bindingStatus === 'FAILED';
  return (
    <Badge
      variant={failed ? 'destructive' : 'outline'}
      title={translateWhatsAppMissingLabel(t, bindingStatus)}
    >
      <IntegrationBrandIcon name="WhatsApp" className="size-3" />
      {translateWhatsAppMissingShortLabel(t, bindingStatus)}
    </Badge>
  );
}
