'use client';

import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
} from '@/components/shared/detail-sheet-classes';
import type { Deal } from '@/lib/api/deals';
import { isWhatsAppCreateInFlight } from '../whatsapp-create-status';

interface DealClientCommunicationPanelProps {
  deal: Deal;
}

export function DealClientCommunicationPanel({ deal }: DealClientCommunicationPanelProps) {
  const t = useTranslations('crm');
  if (deal.type !== 'PRODUCT' && deal.type !== 'OUTSOURCE') return null;
  const binding = deal.whatsappGroupBinding;
  const status = binding?.status ?? null;
  const inFlight = isWhatsAppCreateInFlight(status);
  const ready = status === 'ACTIVE' && Boolean(binding?.groupChatId);
  const hint = ready
    ? t('dealSheet.whatsappHintReady')
    : inFlight
      ? t('dealSheet.whatsappHintInFlight')
      : status === 'FAILED'
        ? t('dealSheet.whatsappHintFailed')
        : t('dealSheet.whatsappHintIdle');

  return (
    <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
      <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        <MessageCircle size={12} />
        {t('dealSheet.clientCommunication')}
      </h4>
      <p className="text-foreground text-xs font-semibold">
        {ready
          ? (binding?.groupName ?? t('dealSheet.whatsappGroupReady'))
          : t('dealSheet.whatsappGroup')}
      </p>
      <p className="text-muted-foreground text-[11px] leading-snug">{hint}</p>
    </section>
  );
}
