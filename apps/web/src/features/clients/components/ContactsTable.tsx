'use client';

import { Building2, Mail, Phone } from 'lucide-react';
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
  EntityListDate,
  EntityListIconLabel,
  EntityListMutedDash,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
import { getContactRole } from '@/features/clients/constants/clients';
import type { Contact } from '@/lib/api/clients';

interface ContactsTableProps {
  contacts: Contact[];
  onOpen: (contact: Contact) => void;
}

export function ContactsTable({ contacts, onOpen }: ContactsTableProps) {
  return (
    <div className={`${ENTITY_LIST_SHELL_CLASS} min-h-0 flex-1 overflow-auto`}>
      <Table>
        <TableHeader className="bg-card sticky top-0 z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Name</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Contact</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Contact Type</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Companies</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-center`}>Projects</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-center`}>Leads</TableHead>
            <TableHead className={`${ENTITY_LIST_HEAD_CLASS} text-center`}>Deals</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const role = getContactRole(contact.role);
            return (
              <TableRow
                key={contact.id}
                className={`${ENTITY_LIST_ROW_HOVER_CLASS} cursor-pointer`}
                onClick={() => onOpen(contact)}
              >
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <div className="flex items-center gap-3">
                    <div className="bg-accent/20 text-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                      {contact.firstName[0]}
                      {contact.lastName[0]}
                    </div>
                    <EntityListPrimaryCell title={`${contact.firstName} ${contact.lastName}`} />
                  </div>
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <div className="space-y-0.5">
                    {contact.phone ? (
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Phone size={10} aria-hidden />
                        {contact.phone}
                      </div>
                    ) : null}
                    {contact.email ? (
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Mail size={10} aria-hidden />
                        {contact.email}
                      </div>
                    ) : null}
                    {!contact.phone && !contact.email ? <EntityListMutedDash /> : null}
                  </div>
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {role ? (
                    <StatusBadge
                      label={role.label}
                      variant={role.variant}
                      className={ENTITY_LIST_BADGE_CLASS}
                    />
                  ) : null}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  {contact.companies.length > 0 ? (
                    <EntityListIconLabel
                      icon={Building2}
                      iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
                      label={contact.companies.map((c) => c.name).join(', ')}
                      labelClassName="text-muted-foreground text-xs"
                    />
                  ) : (
                    <EntityListMutedDash />
                  )}
                </TableCell>
                <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-center font-medium`}>
                  {contact._count.projects}
                </TableCell>
                <TableCell
                  className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground text-center`}
                >
                  {contact._count.leads}
                </TableCell>
                <TableCell
                  className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground text-center`}
                >
                  {contact._count.deals}
                </TableCell>
                <TableCell className={ENTITY_LIST_CELL_CLASS}>
                  <EntityListDate value={contact.createdAt} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
