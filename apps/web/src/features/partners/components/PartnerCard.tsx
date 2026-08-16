'use client';

import type { LucideIcon } from 'lucide-react';
import { Crown, Handshake, Percent, RefreshCw, ShieldCheck, ShoppingCart } from 'lucide-react';
import { PersonContactRow, StatusBadge, type StatusVariant } from '@/components/shared';
import { PartnerDirectionIcon } from '@/features/partners/components/PartnerDirectionIcon';
import {
  getPartnerDirection,
  getPartnerLevel,
  getPartnerStatus,
} from '@/features/partners/constants/partners';
import {
  PARTNER_CARD_AVATAR_CLASS,
  PARTNER_CARD_STAT_ICON_TILE_GREEN_CLASS,
  PARTNER_CARD_STAT_ICON_TILE_MUTED_CLASS,
  PARTNER_CARD_STATUS_BADGE_CLASS,
  PARTNERS_DIRECTORY_CARD_CLASS,
} from '@/features/partners/constants/partners-directory-card-classes';
import { formatPartnerPercent } from '@/features/partners/utils/partner-detail-format';
import type { Partner } from '@/lib/api/partners';

interface PartnerCardProps {
  partner: Partner;
  onOpen: (partner: Partner) => void;
}

interface PartnerCardStatRowProps {
  icon: LucideIcon;
  iconTileClassName: string;
  value: string;
  label: string;
}

function PartnerCardStatRow({
  icon: Icon,
  iconTileClassName,
  value,
  label,
}: PartnerCardStatRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={iconTileClassName} aria-hidden>
        <Icon size={15} />
      </div>
      <p className="text-muted-foreground min-w-0 text-sm">
        <span className="text-foreground font-semibold tabular-nums">{value}</span> {label}
      </p>
    </div>
  );
}

function partnerLevelCardBadge(level: string) {
  if (level === 'PREMIUM') {
    return { variant: 'amber' as StatusVariant, icon: <Crown size={12} aria-hidden /> };
  }
  return { variant: 'violet' as StatusVariant, icon: <ShieldCheck size={12} aria-hidden /> };
}

export function PartnerCard({ partner, onOpen }: PartnerCardProps) {
  const tier = getPartnerLevel(partner.level);
  const dir = getPartnerDirection(partner.direction);
  const st = getPartnerStatus(partner.status);
  const tierBadge = partnerLevelCardBadge(partner.level);
  const orders = partner._count?.orders ?? 0;
  const subs = partner._count?.subscriptions ?? 0;

  return (
    <button type="button" onClick={() => onOpen(partner)} className={PARTNERS_DIRECTORY_CARD_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={PARTNER_CARD_AVATAR_CLASS}>
            <Handshake size={20} aria-hidden />
          </div>
          <h3 className="text-foreground min-w-0 flex-1 truncate text-base font-bold tracking-tight">
            {partner.name}
          </h3>
        </div>
        {st ? (
          <StatusBadge
            label={st.label}
            variant={st.variant}
            className={PARTNER_CARD_STATUS_BADGE_CLASS}
          />
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {tier ? (
          <StatusBadge
            label={tier.label}
            variant={tierBadge.variant}
            icon={tierBadge.icon}
            className="rounded-md"
          />
        ) : null}
        {dir ? (
          <StatusBadge
            label={dir.label}
            variant={dir.variant}
            icon={<PartnerDirectionIcon direction={partner.direction} />}
            className="rounded-md"
          />
        ) : null}
      </div>

      {partner.contact ? (
        <PersonContactRow
          name={`${partner.contact.firstName} ${partner.contact.lastName}`.trim()}
          className="mt-3"
        />
      ) : (
        <p className="text-muted-foreground mt-3 truncate text-sm">No linked contact</p>
      )}

      <div className="border-border mt-5 border-t pt-4">
        <div className="space-y-3">
          <PartnerCardStatRow
            icon={Percent}
            iconTileClassName={PARTNER_CARD_STAT_ICON_TILE_GREEN_CLASS}
            value={formatPartnerPercent(partner.defaultPercent)}
            label="default"
          />
          <PartnerCardStatRow
            icon={ShoppingCart}
            iconTileClassName={PARTNER_CARD_STAT_ICON_TILE_MUTED_CLASS}
            value={String(orders)}
            label="orders"
          />
          <PartnerCardStatRow
            icon={RefreshCw}
            iconTileClassName={PARTNER_CARD_STAT_ICON_TILE_GREEN_CLASS}
            value={String(subs)}
            label="subscriptions"
          />
        </div>
      </div>
    </button>
  );
}
