'use client';

import { Building2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PersonAvatarName, StatusBadge } from '@/components/shared';
import {
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
  EntityListDate,
  EntityListIconTile,
  EntityListMutedDash,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
import { getCompanyType, getTaxStatus } from '@/features/clients/constants/clients';
import { COMPANY_TABLE_STATUS_BADGE_CLASS } from '@/features/clients/constants/clients-directory-card-classes';
import type { Company } from '@/lib/api/clients';

interface CompaniesTableProps {
  companies: Company[];
  onOpen: (company: Company) => void;
}

export function CompaniesTable({ companies, onOpen }: CompaniesTableProps) {
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Company</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Type</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Tax Status</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Tax ID</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Primary Contact</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-center`}>Projects</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-center`}>Invoices</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => {
            const compType = getCompanyType(company.type);
            const taxSt = getTaxStatus(company.taxStatus);
            const contactName = company.contact
              ? `${company.contact.firstName} ${company.contact.lastName}`.trim()
              : '';
            return (
              <TableRow
                key={company.id}
                className={`${ENTITY_LIST_ROW_HOVER_CLASS} cursor-pointer`}
                onClick={() => onOpen(company)}
              >
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <span className="flex min-w-0 items-center gap-2">
                    <EntityListIconTile
                      icon={Building2}
                      className="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
                    />
                    <EntityListPrimaryCell title={company.name} />
                  </span>
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {compType ? (
                    <StatusBadge
                      label={compType.label}
                      variant={compType.variant}
                      className={COMPANY_TABLE_STATUS_BADGE_CLASS}
                    />
                  ) : null}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {taxSt ? (
                    <StatusBadge
                      label={taxSt.label}
                      variant={taxSt.variant}
                      className={COMPANY_TABLE_STATUS_BADGE_CLASS}
                    />
                  ) : null}
                </TableCell>
                <TableCell
                  className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground font-mono text-xs`}
                >
                  {company.taxId ? company.taxId : <EntityListMutedDash />}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {contactName ? <PersonAvatarName name={contactName} /> : <EntityListMutedDash />}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-center font-medium`}>
                  {company._count.projects}
                </TableCell>
                <TableCell
                  className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground text-center`}
                >
                  {company._count.invoices}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <EntityListDate value={company.createdAt} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
