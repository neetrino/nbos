import type { SidebarModuleKey } from '@nbos/shared/constants';
import {
  FINANCE_SECTION_DEFAULTS,
  type FinanceSectionId,
  resolveFinanceSectionId,
} from './finance-visit-config';
import {
  isRegisteredModuleKey,
  MODULE_VISIT_REGISTRY,
  resolveRegisteredModuleFromPathname,
} from './module-visit-registry';
import type {
  FlatModuleVisitState,
  ModuleVisitConfig,
  ModuleVisitState,
  RegisteredModuleKey,
  SectionModuleVisitState,
} from './types';

const STORAGE_KEY = 'nbos:module-last-visit';
const LEGACY_FINANCE_STORAGE_KEY = 'nbos:finance:zone-last-href';

type StoragePayload = Partial<Record<RegisteredModuleKey, ModuleVisitState>>;

function normalizePath(pathname: string): string {
  return pathname.split('?')[0] ?? pathname;
}

function readPayload(): StoragePayload {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    migrateLegacyFinanceStorage();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') return {};
    return parsed as StoragePayload;
  } catch {
    return {};
  }
}

function writePayload(payload: StoragePayload): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function migrateLegacyFinanceStorage(): void {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return;

  const legacyRaw = window.localStorage.getItem(LEGACY_FINANCE_STORAGE_KEY);
  if (!legacyRaw) return;

  try {
    const parsed: unknown = JSON.parse(legacyRaw);
    if (parsed == null || typeof parsed !== 'object') return;

    const record = parsed as Record<string, unknown>;
    const sectionPaths: Record<string, string> = {};

    if (record.zones != null && typeof record.zones === 'object') {
      Object.assign(sectionPaths, record.zones as Record<string, string>);
    } else {
      for (const key of Object.keys(record)) {
        if (key in FINANCE_SECTION_DEFAULTS && typeof record[key] === 'string') {
          sectionPaths[key] = record[key];
        }
      }
    }

    const lastSection = typeof record.lastZone === 'string' ? record.lastZone : undefined;

    const payload: StoragePayload = {
      finance: {
        kind: 'sections',
        lastSection,
        sectionPaths,
      },
    };
    writePayload(payload);
    window.localStorage.removeItem(LEGACY_FINANCE_STORAGE_KEY);
  } catch {
    // ignore corrupt legacy payload
  }
}

function getSectionState(
  moduleKey: RegisteredModuleKey,
  config: Extract<ModuleVisitConfig, { kind: 'sections' }>,
): SectionModuleVisitState {
  const stored = readPayload()[moduleKey];
  if (stored?.kind === 'sections') {
    return stored;
  }
  return { kind: 'sections', sectionPaths: {} };
}

function getFlatState(
  moduleKey: RegisteredModuleKey,
  config: Extract<ModuleVisitConfig, { kind: 'flat' }>,
): FlatModuleVisitState {
  const stored = readPayload()[moduleKey];
  if (stored?.kind === 'flat') {
    return stored;
  }
  return { kind: 'flat' };
}

function readSectionHref(
  moduleKey: RegisteredModuleKey,
  config: Extract<ModuleVisitConfig, { kind: 'sections' }>,
  sectionId: string,
): string {
  const state = getSectionState(moduleKey, config);
  const stored = state.sectionPaths[sectionId];
  if (stored && config.isPathInSection(stored, sectionId)) {
    return stored;
  }
  const fallback =
    config.sectionDefaults[sectionId] ?? config.sectionDefaults[config.defaultSection];
  return fallback ?? '/';
}

/** Last visited path for a module section (sidebar child / header zone). */
export function readModuleSectionHref(moduleKey: RegisteredModuleKey, sectionId: string): string {
  const config = MODULE_VISIT_REGISTRY[moduleKey];
  if (config.kind !== 'sections') {
    return config.defaultPath;
  }
  return readSectionHref(moduleKey, config, sectionId);
}

function readLastActiveSection(
  moduleKey: RegisteredModuleKey,
  config: Extract<ModuleVisitConfig, { kind: 'sections' }>,
): string {
  const state = getSectionState(moduleKey, config);
  if (state.lastSection && config.sectionDefaults[state.lastSection]) {
    return state.lastSection;
  }
  const fallback = Object.keys(config.sectionDefaults).find((id) => state.sectionPaths[id]);
  return fallback ?? config.defaultSection;
}

/** Parent sidebar / module index: last section + page, or last flat path. */
export function readModuleEntryHref(moduleKey: RegisteredModuleKey): string {
  const config = MODULE_VISIT_REGISTRY[moduleKey];
  if (config.kind === 'flat') {
    const state = getFlatState(moduleKey, config);
    if (state.lastPath && config.isValidPath(state.lastPath)) {
      return state.lastPath;
    }
    return config.defaultPath;
  }
  const sectionId = readLastActiveSection(moduleKey, config);
  return readSectionHref(moduleKey, config, sectionId);
}

/** Persist visit from current pathname for any registered module. */
export function writeModuleLastVisitFromPathname(pathname: string): void {
  const moduleKey = resolveRegisteredModuleFromPathname(pathname);
  if (!moduleKey) {
    return;
  }

  const config = MODULE_VISIT_REGISTRY[moduleKey];
  const path = normalizePath(pathname);
  const payload = readPayload();

  if (config.kind === 'flat') {
    payload[moduleKey] = { kind: 'flat', lastPath: path };
    writePayload(payload);
    return;
  }

  const sectionId = config.resolveSection(path);
  if (!sectionId) {
    return;
  }

  const state = getSectionState(moduleKey, config);
  state.sectionPaths[sectionId] = path;
  state.lastSection = sectionId;
  payload[moduleKey] = state;
  writePayload(payload);
}

export function isPathInModuleSection(
  moduleKey: RegisteredModuleKey,
  pathname: string,
  sectionId: string,
): boolean {
  const config = MODULE_VISIT_REGISTRY[moduleKey];
  if (config.kind !== 'sections') {
    return false;
  }
  return config.isPathInSection(pathname, sectionId);
}

/** Finance helpers (typed section ids for feature code). */
export type { FinanceSectionId };
export {
  FINANCE_SECTION_DEFAULTS,
  resolveFinanceSectionId,
  isFinanceSectionPath,
} from './finance-visit-config';

export function readFinanceSectionHref(sectionId: FinanceSectionId): string {
  return readModuleSectionHref('finance', sectionId);
}

export function isFinanceHeaderContextPath(pathname: string): boolean {
  return resolveFinanceSectionId(pathname) !== null;
}

export { isRegisteredModuleKey, MODULE_VISIT_REGISTRY };
