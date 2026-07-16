'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  ENTITY_LIST_TYPE_CLASS,
  EntityListAmount,
  EntityListDate,
  EntityListMutedDash,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
import type { FinancePostingPeriod, OperationalJournalEntry } from '@/lib/api/finance-journal';

interface FinanceJournalPeriodsTableProps {
  periods: FinancePostingPeriod[];
  onClosePeriod: (monthKey: string) => void;
}

export function FinanceJournalPeriodsTable({
  periods,
  onClosePeriod,
}: FinanceJournalPeriodsTableProps) {
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Period</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Status</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-right`}>Entries</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} w-[100px] text-right`}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((period) => (
            <TableRow key={period.id} className={ENTITY_LIST_ROW_HOVER_CLASS}>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                <EntityListPrimaryCell title={period.monthKey} />
              </TableCell>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                <StatusBadge
                  label={period.status}
                  variant={period.status === 'OPEN' ? 'green' : 'gray'}
                  className={ENTITY_LIST_BADGE_CLASS}
                />
              </TableCell>
              <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-right`}>
                {period._count.journalEntries}
              </TableCell>
              <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-right`}>
                {period.status === 'OPEN' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onClosePeriod(period.monthKey)}
                  >
                    <Lock size={14} className="mr-1" aria-hidden />
                    Close
                  </Button>
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

interface FinanceJournalEntriesTableProps {
  entries: OperationalJournalEntry[];
}

export function FinanceJournalEntriesTable({ entries }: FinanceJournalEntriesTableProps) {
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Booked</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Source</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Basis</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Description</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-right`}>Functional</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className={ENTITY_LIST_ROW_HOVER_CLASS}>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                <EntityListDate value={entry.bookedAt} />
              </TableCell>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                <EntityListPrimaryCell
                  title={entry.sourceType}
                  subtitle={entry.sourceId.slice(0, 8)}
                />
              </TableCell>
              <TableCell className={`${ENTITY_LIST_CELL_CLASS} ${ENTITY_LIST_TYPE_CLASS}`}>
                {entry.recognitionBasis}
              </TableCell>
              <TableCell className={ENTITY_LIST_CELL_CLASS}>
                {entry.description ? (
                  <span className="text-sm">{entry.description}</span>
                ) : (
                  <EntityListMutedDash />
                )}
              </TableCell>
              <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-right`}>
                <EntityListAmount amount={entry.functionalAmount} className="justify-end" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
