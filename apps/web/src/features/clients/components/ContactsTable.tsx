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
import { getContactRole } from '@/features/clients/constants/clients';
import type { Contact } from '@/lib/api/clients';

interface ContactsTableProps {
  contacts: Contact[];
  onOpen: (contact: Contact) => void;
}

export function ContactsTable({ contacts, onOpen }: ContactsTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Contact Type</TableHead>
            <TableHead>Companies</TableHead>
            <TableHead className="text-center">Projects</TableHead>
            <TableHead className="text-center">Leads</TableHead>
            <TableHead className="text-center">Deals</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const role = getContactRole(contact.role);
            return (
              <TableRow key={contact.id} className="cursor-pointer" onClick={() => onOpen(contact)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-accent/20 text-accent flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                      {contact.firstName[0]}
                      {contact.lastName[0]}
                    </div>
                    <span className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {contact.phone && (
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Phone size={10} aria-hidden />
                        {contact.phone}
                      </div>
                    )}
                    {contact.email && (
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Mail size={10} aria-hidden />
                        {contact.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {role && <StatusBadge label={role.label} variant={role.variant} />}
                </TableCell>
                <TableCell>
                  {contact.companies.length > 0 ? (
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Building2 size={11} aria-hidden />
                      <span className="max-w-[150px] truncate">
                        {contact.companies.map((c) => c.name).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center font-medium">{contact._count.projects}</TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {contact._count.leads}
                </TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {contact._count.deals}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
