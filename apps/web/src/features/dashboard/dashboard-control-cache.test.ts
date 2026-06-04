import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DASHBOARD_CONTROL_CACHE_STORAGE_KEY,
  mergeDashboardControlCacheMetrics,
  prependDashboardControlCacheNote,
  readDashboardControlCache,
  writeDashboardControlCache,
  type DashboardControlCacheSnapshot,
} from './dashboard-control-cache';

const USER_ID = 'user-1';

const snapshot: DashboardControlCacheSnapshot = {
  metrics: {
    leads: 4,
    dueTodayTasks: 1,
    openTasks: 2,
    openDeals: 3,
    pendingInvoices: 4,
    openTickets: 5,
    criticalTickets: 0,
  },
  priorities: [],
  preference: {
    pinnedActionOrder: ['open-tasks'],
    hiddenPinnedActions: [],
    visibleWidgets: ['open-tasks'],
    hiddenWidgets: [],
    compactWidgets: [],
    sidebarModuleOrder: [],
    hiddenSidebarModules: [],
    defaultDashboardMode: 'control_center',
  },
  personalLinks: [],
  notes: [
    {
      id: 'note-1',
      content: 'Hello',
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

describe('dashboard-control-cache', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when cache is empty', () => {
    expect(readDashboardControlCache(USER_ID)).toBeNull();
  });

  it('round-trips a snapshot for the same user', () => {
    writeDashboardControlCache(USER_ID, snapshot);
    expect(readDashboardControlCache(USER_ID)).toEqual(snapshot);
  });

  it('ignores cache written for another user', () => {
    writeDashboardControlCache('other-user', snapshot);
    expect(readDashboardControlCache(USER_ID)).toBeNull();
  });

  it('merges metrics without dropping personal data', () => {
    writeDashboardControlCache(USER_ID, snapshot);
    mergeDashboardControlCacheMetrics(USER_ID, { ...snapshot.metrics, openTasks: 99 }, []);
    const cached = readDashboardControlCache(USER_ID);
    expect(cached?.metrics.openTasks).toBe(99);
    expect(cached?.notes).toEqual(snapshot.notes);
  });

  it('prepends a note without duplicates', () => {
    writeDashboardControlCache(USER_ID, snapshot);
    const newNote = {
      id: 'note-2',
      content: 'Second',
      sortOrder: 0,
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    prependDashboardControlCacheNote(USER_ID, newNote);
    prependDashboardControlCacheNote(USER_ID, newNote);
    const cached = readDashboardControlCache(USER_ID);
    expect(cached?.notes.map((note) => note.id)).toEqual(['note-2', 'note-1']);
  });

  it('stores under the dashboard control-center key', () => {
    writeDashboardControlCache(USER_ID, snapshot);
    const raw = window.localStorage.getItem(DASHBOARD_CONTROL_CACHE_STORAGE_KEY);
    expect(raw).toContain(USER_ID);
  });
});
