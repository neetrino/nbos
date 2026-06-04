import type { SectionModuleVisitConfig } from './types';
import {
  buildReportsViewPath,
  parseReportsPathname,
  type ReportsSectionId,
} from '@/features/reports/reports-routing';

export type { ReportsSectionId };

export const REPORTS_SECTION_DEFAULTS: Record<ReportsSectionId, string> = {
  finance: buildReportsViewPath('FINANCE'),
  growth: buildReportsViewPath('SALES'),
  delivery: buildReportsViewPath('PROJECTS'),
  center: buildReportsViewPath('SCHEDULED'),
};

function isFinanceSectionPath(pathname: string): boolean {
  const parsed = parseReportsPathname(pathname);
  return parsed?.sectionId === 'finance';
}

function isGrowthSectionPath(pathname: string): boolean {
  const parsed = parseReportsPathname(pathname);
  return parsed?.sectionId === 'growth';
}

function isDeliverySectionPath(pathname: string): boolean {
  const parsed = parseReportsPathname(pathname);
  return parsed?.sectionId === 'delivery';
}

function isCenterSectionPath(pathname: string): boolean {
  const parsed = parseReportsPathname(pathname);
  return parsed?.sectionId === 'center';
}

export function resolveReportsSectionId(pathname: string): ReportsSectionId | null {
  return parseReportsPathname(pathname)?.sectionId ?? null;
}

export function isReportsSectionPath(pathname: string, sectionId: ReportsSectionId): boolean {
  switch (sectionId) {
    case 'finance':
      return isFinanceSectionPath(pathname);
    case 'growth':
      return isGrowthSectionPath(pathname);
    case 'delivery':
      return isDeliverySectionPath(pathname);
    case 'center':
      return isCenterSectionPath(pathname);
    default: {
      const _exhaustive: never = sectionId;
      return _exhaustive;
    }
  }
}

export const REPORTS_MODULE_VISIT_CONFIG: SectionModuleVisitConfig = {
  kind: 'sections',
  defaultSection: 'finance',
  sectionDefaults: REPORTS_SECTION_DEFAULTS,
  resolveSection: resolveReportsSectionId,
  isPathInSection: (pathname, sectionId) =>
    isReportsSectionPath(pathname, sectionId as ReportsSectionId),
};

export function isReportsModulePath(pathname: string): boolean {
  return resolveReportsSectionId(pathname) !== null;
}

export function isReportsHeaderContextPath(pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname;
  return normalized === '/reports' || isReportsModulePath(pathname);
}
