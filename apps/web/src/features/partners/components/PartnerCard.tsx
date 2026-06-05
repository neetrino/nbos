'use client';

import { Handshake, Percent, ShoppingCart, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { PartnerDirectionIcon } from '@/features/partners/components/PartnerDirectionIcon';
import {
  getPartnerDirection,
  getPartnerLevel,
  getPartnerStatus,
} from '@/features/partners/constants/partners';
import { PARTNERS_DIRECTORY_CARD_CLASS } from '@/features/partners/constants/partners-directory-card-classes';
import { formatPartnerPercent } from '@/features/partners/utils/partner-detail-format';
import type { Partner } from '@/lib/api/partners';

interface PartnerCardProps {
  partner: Partner;
  onOpen: (partner: Partner) => void;
}

export function PartnerCard({ partner, onOpen }: PartnerCardProps) {
  const tier = getPartnerLevel(partner.level);
  const dir = getPartnerDirection(partner.direction);
  const st = getPartnerStatus(partner.status);
  const orders = partner._count?.orders ?? 0;
  const subs = partner._count?.subscriptions ?? 0;

  return (
    <button type="button" onClick={() => onOpen(partner)} className={PARTNERS_DIRECTORY_CARD_CLASS}>
      <div className="flex items-start gap-3">
        <div className="bg-accent/15 text-accent group-hover:bg-accent/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors">
          <Handshake size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{partner.name}</p>
          {partner.contact ? (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-xs">
              <User size={11} aria-hidden />
              {partner.contact.firstName} {partner.contact.lastName}
            </p>
          ) : (
            <p className="text-muted-foreground mt-0.5 text-xs">No linked contact</p>
          )}
        </div>
        {st && <StatusBadge label={st.label} variant={st.variant} />}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tier && <StatusBadge label={tier.label} variant={tier.variant} />}
        {dir && (
          <div className="flex items-center gap-1">
            <PartnerDirectionIcon direction={partner.direction} />
            <StatusBadge label={dir.label} variant={dir.variant} />
          </div>
        )}
      </div>

      <div className="text-muted-foreground mt-4 flex flex-wrap gap-3 border-t pt-3 text-xs">
        <span className="flex items-center gap-1 tabular-nums">
          <Percent size={11} aria-hidden />
          {formatPartnerPercent(partner.defaultPercent)} default
        </span>
        <span className="flex items-center gap-1 tabular-nums">
          <ShoppingCart size={11} aria-hidden />
          {orders} orders
        </span>
        <span className="tabular-nums">{subs} subscriptions</span>
      </div>
    </button>
  );
}
