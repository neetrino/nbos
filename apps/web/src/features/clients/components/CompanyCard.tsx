'use client';

import { Building2, Briefcase, FileText, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { getCompanyType, getTaxStatus } from '@/features/clients/constants/clients';
import { CLIENTS_DIRECTORY_CARD_CLASS } from '@/features/clients/constants/clients-directory-card-classes';
import type { Company } from '@/lib/api/clients';

interface CompanyCardProps {
  company: Company;
  onOpen: (company: Company) => void;
}

export function CompanyCard({ company, onOpen }: CompanyCardProps) {
  const compType = getCompanyType(company.type);
  const taxSt = getTaxStatus(company.taxStatus);

  return (
    <button type="button" onClick={() => onOpen(company)} className={CLIENTS_DIRECTORY_CARD_CLASS}>
      <div className="flex items-start gap-3">
        <div className="bg-primary/5 text-primary group-hover:bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors">
          <Building2 size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{company.name}</p>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
            <User size={11} aria-hidden />
            {company.contact.firstName} {company.contact.lastName}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {compType ? <StatusBadge label={compType.label} variant={compType.variant} /> : null}
          {taxSt ? <StatusBadge label={taxSt.label} variant={taxSt.variant} /> : null}
        </div>
      </div>

      {company.taxId && (
        <p className="text-muted-foreground mt-3 font-mono text-xs">Tax ID: {company.taxId}</p>
      )}

      <div className="text-muted-foreground mt-4 flex flex-wrap gap-3 border-t pt-3 text-xs">
        <span className="flex items-center gap-1">
          <Briefcase size={11} aria-hidden />
          {company._count.projects} projects
        </span>
        <span className="flex items-center gap-1">
          <FileText size={11} aria-hidden />
          {company._count.invoices} invoices
        </span>
      </div>
    </button>
  );
}
