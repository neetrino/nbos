import type { HeaderContextContent, HeaderNavItem } from '@/components/layout/header-context';
import { CRM_HEADER_ZONE_ACCENTS } from '@/features/crm/constants/crm-header-zone-accents';
import { CRM_HEADER_ZONES, type CrmSectionId } from '@/features/crm/constants/crm-header-zones';
import { isPathInModuleSection, MODULE_VISIT_REGISTRY } from '@/lib/navigation/module-last-visit';

export function isCrmHeaderContextPath(pathname: string): boolean {
  const config = MODULE_VISIT_REGISTRY.crm;
  return config.kind === 'sections' && config.resolveSection(pathname) !== null;
}

export type CrmHeaderCopy = {
  ariaLabel: string;
  labels: Record<CrmSectionId, string>;
};

export function crmHeaderContent(
  pathname: string,
  hrefByZone: Record<CrmSectionId, string>,
  copy?: CrmHeaderCopy,
): HeaderContextContent | null {
  if (!isCrmHeaderContextPath(pathname)) return null;

  const items: HeaderNavItem[] = CRM_HEADER_ZONES.map((zone) => ({
    label: copy?.labels[zone.zone] ?? zone.label,
    href: hrefByZone[zone.zone],
    icon: zone.icon,
    isActive: (path) => isPathInModuleSection('crm', path, zone.zone),
    accent: CRM_HEADER_ZONE_ACCENTS[zone.zone],
  }));

  return {
    kind: 'nav',
    ariaLabel: copy?.ariaLabel ?? 'CRM areas',
    items,
    fullWidthOnMobile: true,
  };
}
