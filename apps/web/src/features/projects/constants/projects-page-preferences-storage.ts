'use client';

import { useCallback } from 'react';
import { createPersistedJsonStore } from '@/lib/persisted-client-state';
import type { ProjectDetailViewMode } from '../components/project-detail-layout.constants';
import { PRODUCT_STATUSES, PROJECT_HUB_TABS } from './projects';

export type ProjectsHubTab = (typeof PROJECT_HUB_TABS)[number]['value'];
export type ProjectsHubViewMode = 'grid' | 'list';

export type ProjectsHubPagePreferences = {
  activeTab: ProjectsHubTab;
  viewMode: ProjectsHubViewMode;
};

export const PROJECTS_HUB_PAGE_STORAGE_KEY = 'nbos.projectsHub.pagePreferences';

export const DEFAULT_PROJECTS_HUB_PAGE_PREFERENCES: ProjectsHubPagePreferences = {
  activeTab: 'all',
  viewMode: 'grid',
};

export const PROJECT_DETAIL_PRODUCT_STATUS_TAB_ALL = 'all' as const;

export type ProjectDetailProductStatusTab =
  | typeof PROJECT_DETAIL_PRODUCT_STATUS_TAB_ALL
  | (typeof PRODUCT_STATUSES)[number]['value'];

export type ProjectDetailPagePreferences = {
  viewMode: ProjectDetailViewMode;
  productStatusTab: ProjectDetailProductStatusTab;
};

export const PROJECT_DETAIL_PAGE_STORAGE_KEY = 'nbos.projectDetail.pagePreferences';

export const DEFAULT_PROJECT_DETAIL_PAGE_PREFERENCES: ProjectDetailPagePreferences = {
  viewMode: 'card',
  productStatusTab: PROJECT_DETAIL_PRODUCT_STATUS_TAB_ALL,
};

const VALID_HUB_TABS = new Set<ProjectsHubTab>(PROJECT_HUB_TABS.map((tab) => tab.value));
const VALID_PRODUCT_STATUS_TABS = new Set<string>([
  PROJECT_DETAIL_PRODUCT_STATUS_TAB_ALL,
  ...PRODUCT_STATUSES.map((status) => status.value),
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object';
}

function readLegacyScalar(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(key);
}

function parseHubPreferences(raw: string | null): ProjectsHubPagePreferences {
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isRecord(parsed)) {
        const activeTab = parsed.activeTab;
        const viewMode = parsed.viewMode;
        return {
          activeTab:
            typeof activeTab === 'string' && VALID_HUB_TABS.has(activeTab as ProjectsHubTab)
              ? (activeTab as ProjectsHubTab)
              : DEFAULT_PROJECTS_HUB_PAGE_PREFERENCES.activeTab,
          viewMode:
            viewMode === 'grid' || viewMode === 'list'
              ? viewMode
              : DEFAULT_PROJECTS_HUB_PAGE_PREFERENCES.viewMode,
        };
      }
    } catch {
      // fall through to legacy / defaults
    }
  }

  const prefs = { ...DEFAULT_PROJECTS_HUB_PAGE_PREFERENCES };
  const legacyTab = readLegacyScalar('nbos.projectsHub.activeTab');
  if (legacyTab && VALID_HUB_TABS.has(legacyTab as ProjectsHubTab)) {
    prefs.activeTab = legacyTab as ProjectsHubTab;
  }
  const legacyView = readLegacyScalar('nbos.projectsHub.viewMode');
  if (legacyView === 'grid' || legacyView === 'list') {
    prefs.viewMode = legacyView;
  }
  return prefs;
}

function parseDetailPreferences(raw: string | null): ProjectDetailPagePreferences {
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isRecord(parsed)) {
        const viewMode = parsed.viewMode;
        const productStatusTab = parsed.productStatusTab;
        return {
          viewMode:
            viewMode === 'card' || viewMode === 'list'
              ? viewMode
              : DEFAULT_PROJECT_DETAIL_PAGE_PREFERENCES.viewMode,
          productStatusTab:
            typeof productStatusTab === 'string' && VALID_PRODUCT_STATUS_TABS.has(productStatusTab)
              ? (productStatusTab as ProjectDetailProductStatusTab)
              : DEFAULT_PROJECT_DETAIL_PAGE_PREFERENCES.productStatusTab,
        };
      }
    } catch {
      // fall through to legacy / defaults
    }
  }

  const prefs = { ...DEFAULT_PROJECT_DETAIL_PAGE_PREFERENCES };
  const legacyView = readLegacyScalar('nbos.projectDetail.viewMode');
  if (legacyView === 'card' || legacyView === 'list') {
    prefs.viewMode = legacyView;
  }
  const legacyStatus = readLegacyScalar('nbos.projectDetail.productStatusTab');
  if (legacyStatus && VALID_PRODUCT_STATUS_TABS.has(legacyStatus)) {
    prefs.productStatusTab = legacyStatus as ProjectDetailProductStatusTab;
  }
  return prefs;
}

const projectsHubPageStore = createPersistedJsonStore<ProjectsHubPagePreferences>({
  storageKey: PROJECTS_HUB_PAGE_STORAGE_KEY,
  defaultValue: DEFAULT_PROJECTS_HUB_PAGE_PREFERENCES,
  changeEvent: 'nbos:projects-hub:page-preferences-change',
  parse: parseHubPreferences,
});

const projectDetailPageStore = createPersistedJsonStore<ProjectDetailPagePreferences>({
  storageKey: PROJECT_DETAIL_PAGE_STORAGE_KEY,
  defaultValue: DEFAULT_PROJECT_DETAIL_PAGE_PREFERENCES,
  changeEvent: 'nbos:project-detail:page-preferences-change',
  parse: parseDetailPreferences,
});

export const readProjectsHubPagePreferences = projectsHubPageStore.read;
export const writeProjectsHubPagePreferences = projectsHubPageStore.write;
export const useProjectsHubPagePreferences = projectsHubPageStore.useValue;

export const readProjectDetailPagePreferences = projectDetailPageStore.read;
export const writeProjectDetailPagePreferences = projectDetailPageStore.write;
export const useProjectDetailPagePreferences = projectDetailPageStore.useValue;

/** Map persisted tab value to API/filter null for "all products". */
export function projectDetailProductStatusTabToFilter(
  tab: ProjectDetailProductStatusTab,
): string | null {
  return tab === PROJECT_DETAIL_PRODUCT_STATUS_TAB_ALL ? null : tab;
}

/** Map filter null to persisted tab value. */
export function projectDetailProductStatusFilterToTab(
  filter: string | null,
): ProjectDetailProductStatusTab {
  if (filter == null) return PROJECT_DETAIL_PRODUCT_STATUS_TAB_ALL;
  const isKnownStatus = PRODUCT_STATUSES.some((status) => status.value === filter);
  return isKnownStatus
    ? (filter as ProjectDetailProductStatusTab)
    : PROJECT_DETAIL_PRODUCT_STATUS_TAB_ALL;
}

/** @deprecated Use {@link useProjectDetailPagePreferences}. */
export function useProjectDetailViewMode(): readonly [
  ProjectDetailViewMode,
  (viewMode: ProjectDetailViewMode) => void,
] {
  const [prefs, setPrefs] = useProjectDetailPagePreferences();
  const setViewMode = useCallback(
    (viewMode: ProjectDetailViewMode) => setPrefs({ viewMode }),
    [setPrefs],
  );
  return [prefs.viewMode, setViewMode];
}
