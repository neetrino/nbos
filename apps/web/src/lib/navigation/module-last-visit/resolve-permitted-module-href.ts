import { hasNavPermission, type NavPermissionCan } from '../nav-visibility';
import { resolveNavPermission } from '../resolve-nav-permission';
import { FINANCE_SECTION_ENTRY_CANDIDATES, type FinanceSectionId } from './finance-visit-config';
import { readModuleEntryHref, readModuleSectionHref } from './module-last-visit-storage';
import { MODULE_VISIT_REGISTRY } from './module-visit-registry';
import type { RegisteredModuleKey } from './types';

function isPathPermitted(pathname: string, can: NavPermissionCan): boolean {
  return hasNavPermission(resolveNavPermission(pathname), can);
}

function uniqueHrefs(hrefs: readonly string[]): string[] {
  return [...new Set(hrefs)];
}

function extraSectionHrefs(moduleKey: RegisteredModuleKey, sectionId: string): readonly string[] {
  if (moduleKey !== 'finance') return [];
  if (!(sectionId in FINANCE_SECTION_ENTRY_CANDIDATES)) return [];
  return FINANCE_SECTION_ENTRY_CANDIDATES[sectionId as FinanceSectionId];
}

export function resolvePermittedModuleSectionHref(
  moduleKey: RegisteredModuleKey,
  sectionId: string,
  can: NavPermissionCan,
): string {
  const preferred = readModuleSectionHref(moduleKey, sectionId);
  const candidates = uniqueHrefs([preferred, ...extraSectionHrefs(moduleKey, sectionId)]);
  return candidates.find((href) => isPathPermitted(href, can)) ?? preferred;
}

export function resolvePermittedFinanceSectionHref(
  sectionId: FinanceSectionId,
  can: NavPermissionCan,
): string {
  return resolvePermittedModuleSectionHref('finance', sectionId, can);
}

function collectModuleFallbackHrefs(moduleKey: RegisteredModuleKey): string[] {
  const config = MODULE_VISIT_REGISTRY[moduleKey];
  if (config.kind === 'flat') {
    return [config.defaultPath];
  }
  return Object.keys(config.sectionDefaults).flatMap((sectionId) => [
    readModuleSectionHref(moduleKey, sectionId),
    ...extraSectionHrefs(moduleKey, sectionId),
  ]);
}

/** Last visit when permitted; otherwise the first reachable page in the module. */
export function resolvePermittedModuleEntryHref(
  moduleKey: RegisteredModuleKey,
  can: NavPermissionCan,
): string {
  const preferred = readModuleEntryHref(moduleKey);
  const candidates = uniqueHrefs([preferred, ...collectModuleFallbackHrefs(moduleKey)]);
  return candidates.find((href) => isPathPermitted(href, can)) ?? preferred;
}
