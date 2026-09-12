import { BarChart3, Handshake, Megaphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CrmSectionId = 'dashboard' | 'leads' | 'deals';

export const CRM_HEADER_SECTION_DEFAULTS: Record<CrmSectionId, string> = {
  dashboard: '/crm/dashboard',
  leads: '/crm/leads',
  deals: '/crm/deals',
};

export type CrmHeaderZoneDefinition = {
  zone: CrmSectionId;
  label: string;
  labelKey: 'nav.dashboard' | 'nav.leads' | 'nav.deals';
  icon: LucideIcon;
};

export const CRM_HEADER_ZONES: CrmHeaderZoneDefinition[] = [
  { zone: 'dashboard', label: 'Dashboard', labelKey: 'nav.dashboard', icon: BarChart3 },
  { zone: 'leads', label: 'Leads', labelKey: 'nav.leads', icon: Megaphone },
  { zone: 'deals', label: 'Deals', labelKey: 'nav.deals', icon: Handshake },
];
