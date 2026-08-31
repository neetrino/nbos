'use client';

import { MessageCircle } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
} from '@/components/shared/detail-sheet-classes';
import type { Deal } from '@/lib/api/deals';
import { isWhatsAppCreateInFlight } from '../whatsapp-create-status';
import { whatsappGroupMissingLabel } from '../deal-won-whatsapp-gate';

interface DealClientCommunicationPanelProps {
  deal: Deal;
}

export function DealClientCommunicationPanel({ deal }: DealClientCommunicationPanelProps) {
  if (deal.type !== 'PRODUCT' && deal.type !== 'OUTSOURCE') return null;
  const binding = deal.whatsappGroupBinding;
  const status = binding?.status ?? null;
  const inFlight = isWhatsAppCreateInFlight(status);
  const ready = status === 'ACTIVE' && Boolean(binding?.groupChatId);
  const hint = ready
    ? 'This group attaches as Product WORK on Deal Won.'
    : inFlight
      ? 'Creation is in progress.'
      : whatsappGroupMissingLabel(status);

  return (
    <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
      <h4 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        <MessageCircle size={12} />
        Client communication
      </h4>
      <p className="text-foreground text-xs font-semibold">
        {ready ? (binding?.groupName ?? 'WhatsApp group ready') : 'WhatsApp group'}
      </p>
      <p className="text-muted-foreground text-[11px] leading-snug">{hint}</p>
    </section>
  );
}