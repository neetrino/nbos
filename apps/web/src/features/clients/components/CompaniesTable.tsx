'use client';

import { Building2, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { getCompanyType, getTaxStatus } from '@/features/clients/constants/clients';
import type { Company } from '@/lib/api/clients';

interface CompaniesTableProps {
  companies: Company[];
  onOpen: (company: Company) => void;
}

export function CompaniesTable({ companies, onOpen }: CompaniesTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Tax Status</TableHead>
            <TableHead>Tax ID</TableHead>
            <TableHead>Primary Contact</TableHead>
            <TableHead className="text-center">Projects</TableHead>
            <TableHead className="text-center">Invoices</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => {
            const compType = getCompanyType(company.type);
            const taxSt = getTaxStatus(company.taxStatus);
            return (
              <TableRow key={company.id} className="cursor-pointer" onClick={() => onOpen(company)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/5 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                      <Building2 size={16} aria-hidden />
                    </div>
                    <span className="font-medium">{company.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {compType && <StatusBadge label={compType.label} variant={compType.variant} />}
                </TableCell>
                <TableCell>
                  {taxSt && <StatusBadge label={taxSt.label} variant={taxSt.variant} />}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {company.taxId ?? '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <User size={12} className="text-muted-foreground" aria-hidden />
                    <span>
                      {company.contact.firstName} {company.contact.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">{company._count.projects}</TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {company._count.invoices}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(company.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
