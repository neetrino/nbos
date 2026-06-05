import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  DEFAULT_PROJECT_DETAIL_PAGE_PREFERENCES,
  DEFAULT_PROJECTS_HUB_PAGE_PREFERENCES,
  PROJECT_DETAIL_PAGE_STORAGE_KEY,
  PROJECTS_HUB_PAGE_STORAGE_KEY,
  projectDetailProductStatusFilterToTab,
  projectDetailProductStatusTabToFilter,
  readProjectDetailPagePreferences,
  readProjectsHubPagePreferences,
  writeProjectDetailPagePreferences,
  writeProjectsHubPagePreferences,
} from './projects-page-preferences-storage';

describe('projects-page-preferences-storage', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: () => null,
      length: 0,
    };
    vi.stubGlobal('window', {
      localStorage: mockStorage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults hub preferences when unset', () => {
    expect(readProjectsHubPagePreferences()).toEqual(DEFAULT_PROJECTS_HUB_PAGE_PREFERENCES);
  });

  it('persists hub tab and view mode together', () => {
    writeProjectsHubPagePreferences({ activeTab: 'active', viewMode: 'list' });
    expect(readProjectsHubPagePreferences()).toEqual({
      activeTab: 'active',
      viewMode: 'list',
    });
    expect(window.localStorage.getItem(PROJECTS_HUB_PAGE_STORAGE_KEY)).toContain('"active"');
  });

  it('reads legacy hub scalar keys when json is unset', () => {
    window.localStorage.setItem('nbos.projectsHub.activeTab', 'archived');
    window.localStorage.setItem('nbos.projectsHub.viewMode', 'list');
    expect(readProjectsHubPagePreferences()).toEqual({
      activeTab: 'archived',
      viewMode: 'list',
    });
  });

  it('defaults detail preferences when unset', () => {
    expect(readProjectDetailPagePreferences()).toEqual(DEFAULT_PROJECT_DETAIL_PAGE_PREFERENCES);
  });

  it('persists detail view mode and product status tab together', () => {
    writeProjectDetailPagePreferences({ viewMode: 'list', productStatusTab: 'DEVELOPMENT' });
    expect(readProjectDetailPagePreferences()).toEqual({
      viewMode: 'list',
      productStatusTab: 'DEVELOPMENT',
    });
    expect(window.localStorage.getItem(PROJECT_DETAIL_PAGE_STORAGE_KEY)).toContain('DEVELOPMENT');
  });

  it('maps product status tab and filter both ways', () => {
    expect(projectDetailProductStatusTabToFilter('all')).toBeNull();
    expect(projectDetailProductStatusTabToFilter('DEVELOPMENT')).toBe('DEVELOPMENT');
    expect(projectDetailProductStatusFilterToTab(null)).toBe('all');
    expect(projectDetailProductStatusFilterToTab('CREATING')).toBe('CREATING');
  });
});
