'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { PartnerDirectionIcon } from '@/features/partners/components/PartnerDirectionIcon';
import {
  getPartnerDirection,
  getPartnerLevel,
  getPartnerStatus,
} from '@/features/partners/constants/partners';
import { formatPartnerPercent } from '@/features/partners/utils/partner-detail-format';
import type { Partner } from '@/lib/api/partners';

interface PartnersTableProps {
  partners: Partner[];
  onOpen: (partner: Partner) => void;
}

export function PartnersTable({ partners, onOpen }: PartnersTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partner</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Default %</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Subscriptions</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner) => {
            const tier = getPartnerLevel(partner.level);
            const dir = getPartnerDirection(partner.direction);
            const st = getPartnerStatus(partner.status);
            const orders = partner._count?.orders ?? 0;
            const subs = partner._count?.subscriptions ?? 0;

            return (
              <TableRow key={partner.id} className="cursor-pointer" onClick={() => onOpen(partner)}>
                <TableCell>
                  <div>
                    <p className="font-medium">{partner.name}</p>
                    {partner.contact ? (
                      <p className="text-muted-foreground text-xs">
                        {partner.contact.firstName} {partner.contact.lastName}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {tier && <StatusBadge label={tier.label} variant={tier.variant} />}
                </TableCell>
                <TableCell>
                  {dir && (
                    <div className="flex items-center gap-1">
                      <PartnerDirectionIcon direction={partner.direction} />
                      <StatusBadge label={dir.label} variant={dir.variant} />
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium tabular-nums">
                  {formatPartnerPercent(partner.defaultPercent)}
                </TableCell>
                <TableCell className="text-sm tabular-nums">{orders}</TableCell>
                <TableCell className="text-sm tabular-nums">{subs}</TableCell>
                <TableCell>{st && <StatusBadge label={st.label} variant={st.variant} />}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
