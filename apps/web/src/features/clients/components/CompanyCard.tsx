'use client';

import type { LucideIcon } from 'lucide-react';
import { Briefcase, Building2, FileText } from 'lucide-react';
import { PersonAvatarName, StatusBadge } from '@/components/shared';
import { getCompanyType, getTaxStatus } from '@/features/clients/constants/clients';
import {
  CLIENTS_DIRECTORY_METRIC_CELL_CLASS,
  CLIENTS_DIRECTORY_METRIC_ICON_TILE_CLASS,
  COMPANY_CARD_ICON_TILE_CLASS,
  COMPANY_CARD_STATUS_BADGE_CLASS,
  COMPANY_DIRECTORY_CARD_CLASS,
} from '@/features/clients/constants/clients-directory-card-classes';
import type { Company } from '@/lib/api/clients';

interface CompanyCardProps {
  company: Company;
  onOpen: (company: Company) => void;
}

interface CompanyCardMetricProps {
  icon: LucideIcon;
  value: number;
  label: string;
}

function CompanyCardMetric({ icon: Icon, value, label }: CompanyCardMetricProps) {
  return (
    <div className={CLIENTS_DIRECTORY_METRIC_CELL_CLASS}>
      <div className={CLIENTS_DIRECTORY_METRIC_ICON_TILE_CLASS} aria-hidden>
        <Icon size={14} />
      </div>
      <p className="text-foreground text-base leading-none font-bold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-[11px] leading-none">{label}</p>
    </div>
  );
}

export function CompanyCard({ company, onOpen }: CompanyCardProps) {
  const compType = getCompanyType(company.type);
  const taxSt = getTaxStatus(company.taxStatus);
  const contactName = `${company.contact.firstName} ${company.contact.lastName}`.trim();

  return (
    <button type="button" onClick={() => onOpen(company)} className={COMPANY_DIRECTORY_CARD_CLASS}>
      <div className="flex items-start gap-3">
        <div className={COMPANY_CARD_ICON_TILE_CLASS} aria-hidden>
          <Building2 size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground truncate text-base font-bold tracking-tight">
            {company.name}
          </h3>
          {compType || taxSt ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {compType ? (
                <StatusBadge
                  label={compType.label}
                  variant={compType.variant}
                  className={COMPANY_CARD_STATUS_BADGE_CLASS}
                />
              ) : null}
              {taxSt ? (
                <StatusBadge
                  label={taxSt.label}
                  variant={taxSt.variant}
                  className={COMPANY_CARD_STATUS_BADGE_CLASS}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {contactName ? (
        <PersonAvatarName name={contactName} className="mt-4" />
      ) : (
        <p className="text-muted-foreground mt-4 truncate text-sm">No linked contact</p>
      )}

      <div className="border-border mt-5 flex gap-2 border-t pt-4">
        <CompanyCardMetric icon={Briefcase} value={company._count.projects} label="projects" />
        <CompanyCardMetric icon={FileText} value={company._count.invoices} label="invoices" />
      </div>
    </button>
  );
}
