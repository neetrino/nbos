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
import {
  ENTITY_LIST_BADGE_CLASS,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
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
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Partner</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Level</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Direction</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Default %</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Orders</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Subscriptions</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner) => {
            const tier = getPartnerLevel(partner.level);
            const dir = getPartnerDirection(partner.direction);
            const st = getPartnerStatus(partner.status);
            const orders = partner._count?.orders ?? 0;
            const subs = partner._count?.subscriptions ?? 0;
            const contactSubtitle = partner.contact
              ? `${partner.contact.firstName} ${partner.contact.lastName}`
              : null;

            return (
              <TableRow
                key={partner.id}
                className={`${ENTITY_LIST_ROW_HOVER_CLASS} cursor-pointer`}
                onClick={() => onOpen(partner)}
              >
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <EntityListPrimaryCell title={partner.name} subtitle={contactSubtitle} />
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {tier ? (
                    <StatusBadge
                      label={tier.label}
                      variant={tier.variant}
                      className={ENTITY_LIST_BADGE_CLASS}
                    />
                  ) : null}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {dir ? (
                    <div className="flex items-center gap-1">
                      <PartnerDirectionIcon direction={partner.direction} />
                      <StatusBadge
                        label={dir.label}
                        variant={dir.variant}
                        className={ENTITY_LIST_BADGE_CLASS}
                      />
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-sm font-medium tabular-nums`}>
                  {formatPartnerPercent(partner.defaultPercent)}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-sm tabular-nums`}>
                  {orders}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-sm tabular-nums`}>
                  {subs}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {st ? (
                    <StatusBadge
                      label={st.label}
                      variant={st.variant}
                      className={ENTITY_LIST_BADGE_CLASS}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
