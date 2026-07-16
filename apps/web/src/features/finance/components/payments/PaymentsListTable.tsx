'use client';

import { Building2, FileText, FolderKanban } from 'lucide-react';
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
  EntityListAmount,
  EntityListDate,
  EntityListIconLabel,
  EntityListMutedDash,
} from '@/components/shared/entity-list-table';
import type { Payment } from '@/lib/api/finance';

const INVOICE_ICON_CLASS = 'bg-slate-100 text-slate-600 dark:bg-slate-950/50 dark:text-slate-400';
const PROJECT_ICON_CLASS =
  'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400';
const COMPANY_ICON_CLASS = 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400';

interface PaymentsListTableProps {
  payments: Payment[];
}

export function PaymentsListTable({ payments }: PaymentsListTableProps) {
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Payment Date</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Invoice</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Project</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Company</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-right`}>Amount</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Method</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Confirmed By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className={ENTITY_LIST_ROW_HOVER_CLASS}>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                <EntityListDate value={payment.paymentDate} />
              </TableCell>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                {payment.invoice ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <EntityListIconLabel
                      icon={FileText}
                      iconClassName={INVOICE_ICON_CLASS}
                      label={payment.invoice.code}
                      labelClassName="font-bold"
                    />
                    {payment.invoice.type ? (
                      <StatusBadge
                        label={payment.invoice.type}
                        variant="blue"
                        className={ENTITY_LIST_BADGE_CLASS}
                      />
                    ) : null}
                  </div>
                ) : (
                  <EntityListMutedDash />
                )}
              </TableCell>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                {payment.project ? (
                  <EntityListIconLabel
                    icon={FolderKanban}
                    iconClassName={PROJECT_ICON_CLASS}
                    label={payment.project.name}
                  />
                ) : (
                  <EntityListMutedDash />
                )}
              </TableCell>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                {payment.company?.name ? (
                  <EntityListIconLabel
                    icon={Building2}
                    iconClassName={COMPANY_ICON_CLASS}
                    label={payment.company.name}
                  />
                ) : (
                  <EntityListMutedDash />
                )}
              </TableCell>
              <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-right`}>
                <EntityListAmount amount={payment.amount} className="justify-end text-green-600" />
              </TableCell>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                {payment.paymentMethod ? (
                  <span className="text-muted-foreground text-xs">{payment.paymentMethod}</span>
                ) : (
                  <EntityListMutedDash />
                )}
              </TableCell>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                {payment.confirmer ? (
                  <span className="text-xs">
                    {payment.confirmer.firstName} {payment.confirmer.lastName}
                  </span>
                ) : (
                  <EntityListMutedDash />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
