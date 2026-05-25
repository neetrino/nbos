'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { dashboardApi } from '@/lib/api/dashboard';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import {
  loadDashboardControlData,
  loadDashboardControlMetrics,
  type DashboardControlProjection,
} from './dashboard-control-data';
import {
  mergeDashboardControlCacheMetrics,
  prependDashboardControlCacheNote,
  readDashboardControlCache,
  writeDashboardControlCache,
} from './dashboard-control-cache';
import { subscribeDashboardNoteCreated } from './dashboard-note-sync';
import {
  PINNED_ACTIONS,
  partitionMiniMetrics,
  type DashboardData,
  type DashboardNote,
  type DashboardPersonalLink,
  type DashboardPreference,
  type PinnedAction,
  type PriorityCard,
} from './dashboard-control-registry';

const TEMP_NOTE_ID_PREFIX = 'temp-dashboard-note';

export function useDashboardControlCenter() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const { can } = usePermission();
  const [data, setData] = useState<DashboardData | null>(null);
  const [preference, setPreference] = useState<DashboardPreference | null>(null);
  const [personalLinks, setPersonalLinks] = useState<DashboardPersonalLink[]>([]);
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [priorities, setPriorities] = useState<PriorityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);

  const permittedBaseActions = useMemo(
    () => PINNED_ACTIONS.filter((action) => can(action.action, action.module)),
    [can],
  );
  const actions = useMemo(
    () => applyActionPreferences(permittedBaseActions, preference),
    [permittedBaseActions, preference],
  );
  const hiddenActions = useMemo(() => {
    const hidden = new Set(preference?.hiddenPinnedActions ?? []);
    return permittedBaseActions.filter((action) => hidden.has(action.key));
  }, [permittedBaseActions, preference]);

  const { visible: visibleMiniMetrics, hidden: hiddenMiniMetrics } = useMemo(
    () =>
      partitionMiniMetrics(
        preference?.hiddenWidgets ?? [],
        preference?.visibleWidgets?.length ? preference.visibleWidgets : [],
      ),
    [preference],
  );

  const applyProjection = useCallback((projection: DashboardControlProjection) => {
    setData(projection.metrics);
    setPreference(projection.preference);
    setPersonalLinks(projection.personalLinks);
    setNotes(projection.notes ?? []);
    setPriorities(projection.priorities);
  }, []);

  const applyMetrics = useCallback((metrics: DashboardData, nextPriorities: PriorityCard[]) => {
    setData(metrics);
    setPriorities(nextPriorities);
  }, []);

  const fetchDashboard = useCallback(
    async (options?: { metricsOnly?: boolean; showLoading?: boolean }) => {
      const generation = ++fetchGenerationRef.current;
      const showLoading = options?.showLoading ?? true;
      if (showLoading) setLoading(true);
      setError(null);

      try {
        if (options?.metricsOnly) {
          const metricsProjection = await loadDashboardControlMetrics();
          if (generation !== fetchGenerationRef.current) return;
          applyMetrics(metricsProjection.metrics, metricsProjection.priorities);
          if (userId) {
            mergeDashboardControlCacheMetrics(
              userId,
              metricsProjection.metrics,
              metricsProjection.priorities,
            );
          }
          return;
        }

        const projection = await loadDashboardControlData();
        if (generation !== fetchGenerationRef.current) return;
        applyProjection(projection);
        if (userId) writeDashboardControlCache(userId, projection);
      } catch (caught) {
        if (generation !== fetchGenerationRef.current) return;
        if (!options?.metricsOnly) {
          setData(null);
          setPersonalLinks([]);
          setNotes([]);
          setPriorities([]);
        }
        setError(caught instanceof Error ? caught.message : 'Dashboard data could not be loaded.');
      } finally {
        if (generation === fetchGenerationRef.current && showLoading) {
          setLoading(false);
        }
      }
    },
    [applyMetrics, applyProjection, userId],
  );

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || !userId) {
      if (status === 'unauthenticated') setLoading(false);
      return;
    }

    const cached = readDashboardControlCache(userId);
    if (cached) {
      applyProjection(cached);
      setLoading(false);
      void fetchDashboard({ metricsOnly: true, showLoading: false });
      return;
    }

    void fetchDashboard({ showLoading: true });
  }, [applyProjection, fetchDashboard, status, userId]);

  useEffect(() => {
    if (!userId || !data || !preference) return;
    writeDashboardControlCache(userId, {
      metrics: data,
      priorities,
      preference,
      personalLinks,
      notes,
    });
  }, [userId, data, preference, personalLinks, notes, priorities]);

  useEffect(() => {
    return subscribeDashboardNoteCreated((note) => {
      setNotes((current) => {
        if (current.some((existing) => existing.id === note.id)) return current;
        return [note, ...current];
      });
      if (userId) prependDashboardControlCacheNote(userId, note);
    });
  }, [userId]);

  const preferenceControls = usePreferenceControls(preference, setPreference);

  return {
    actions,
    applyPinnedLayout: preferenceControls.applyPinnedLayout,
    applyWidgetLayout: preferenceControls.applyWidgetLayout,
    data,
    error,
    hiddenActions,
    hiddenMiniMetrics,
    loading,
    notes,
    personalLinks,
    priorities,
    savingPreference: preferenceControls.savingPreference,
    visibleMiniMetrics,
    createPersonalLink: async (label: string, url: string) => {
      const link = await dashboardApi.createPersonalLink({
        label,
        url,
        placement: ['SIDEBAR', 'DASHBOARD_PINNED_ACTIONS'],
      });
      setPersonalLinks((current) => [...current, link]);
    },
    deletePersonalLink: async (id: string) => {
      await dashboardApi.deletePersonalLink(id);
      setPersonalLinks((current) => current.filter((link) => link.id !== id));
    },
    createDashboardNote: async (content: string) => {
      const temporaryId = `${TEMP_NOTE_ID_PREFIX}-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const temporaryNote: DashboardNote = {
        id: temporaryId,
        content: content.trim(),
        sortOrder: 0,
        createdAt,
        updatedAt: createdAt,
      };
      setNotes((current) => [temporaryNote, ...current]);
      try {
        const saved = await dashboardApi.createNote({ content });
        setNotes((current) => current.map((note) => (note.id === temporaryId ? saved : note)));
      } catch (caught) {
        setNotes((current) => current.filter((note) => note.id !== temporaryId));
        toast.error(getApiErrorMessage(caught, 'Dashboard note could not be saved.'));
        throw caught;
      }
    },
    deleteDashboardNote: async (id: string) => {
      const previousNotes = notes;
      setNotes((current) => current.filter((note) => note.id !== id));
      try {
        await dashboardApi.deleteNote(id);
      } catch (caught) {
        setNotes(previousNotes);
        toast.error(getApiErrorMessage(caught, 'Dashboard note could not be deleted.'));
      }
    },
    updateDashboardNote: async (id: string, content: string) => {
      const previousNotes = notes;
      const updatedAt = new Date().toISOString();
      setNotes((current) =>
        current.map((note) =>
          note.id === id ? { ...note, content: content.trim(), updatedAt } : note,
        ),
      );
      try {
        const saved = await dashboardApi.updateNote(id, { content });
        setNotes((current) => current.map((note) => (note.id === id ? saved : note)));
      } catch (caught) {
        setNotes(previousNotes);
        toast.error(getApiErrorMessage(caught, 'Dashboard note could not be updated.'));
        throw caught;
      }
    },
    reorderDashboardNotes: async (noteIds: string[]) => {
      const previousNotes = notes;
      setNotes((current) => orderNotesByIds(current, noteIds));
      try {
        const saved = await dashboardApi.reorderNotes({ noteIds });
        setNotes(saved);
      } catch (caught) {
        setNotes(previousNotes);
        toast.error(getApiErrorMessage(caught, 'Dashboard notes order could not be saved.'));
      }
    },
  };
}

function orderNotesByIds(notes: DashboardNote[], noteIds: string[]): DashboardNote[] {
  const byId = new Map(notes.map((note) => [note.id, note]));
  return noteIds.flatMap((id, sortOrder) => {
    const note = byId.get(id);
    return note ? [{ ...note, sortOrder }] : [];
  });
}

function usePreferenceControls(
  preference: DashboardPreference | null,
  setPreference: Dispatch<SetStateAction<DashboardPreference | null>>,
) {
  const [savingPreference, setSavingPreference] = useState(false);
  const preferenceRef = useRef(preference);
  preferenceRef.current = preference;
  const saveGenerationRef = useRef(0);
  const saveInflightRef = useRef(0);

  const savePreference = useCallback(
    async (payload: Partial<DashboardPreference>) => {
      const previous = preferenceRef.current;
      if (!previous) return;

      const generation = ++saveGenerationRef.current;
      const optimistic: DashboardPreference = { ...previous, ...payload };
      preferenceRef.current = optimistic;
      setPreference(optimistic);

      saveInflightRef.current += 1;
      setSavingPreference(true);
      try {
        const saved = await dashboardApi.updatePreference(payload);
        if (generation === saveGenerationRef.current) {
          preferenceRef.current = { ...preferenceRef.current, ...saved };
          setPreference((current) => (current ? { ...current, ...saved } : saved));
        }
      } catch (caught) {
        if (generation === saveGenerationRef.current) {
          preferenceRef.current = previous;
          setPreference(previous);
          toast.error(
            getApiErrorMessage(caught, 'Dashboard layout could not be saved. Please try again.'),
          );
        }
      } finally {
        saveInflightRef.current -= 1;
        if (saveInflightRef.current <= 0) {
          saveInflightRef.current = 0;
          setSavingPreference(false);
        }
      }
    },
    [setPreference],
  );

  const applyPinnedLayout = useCallback(
    (visibleKeys: PinnedAction['key'][], hiddenKeys: PinnedAction['key'][]) => {
      void savePreference({
        pinnedActionOrder: visibleKeys,
        hiddenPinnedActions: hiddenKeys,
      });
    },
    [savePreference],
  );

  const applyWidgetLayout = useCallback(
    (visibleIds: string[], hiddenIds: string[]) => {
      void savePreference({
        visibleWidgets: visibleIds,
        hiddenWidgets: hiddenIds,
      });
    },
    [savePreference],
  );

  return {
    applyPinnedLayout,
    applyWidgetLayout,
    savingPreference,
  };
}

function applyActionPreferences(
  actions: PinnedAction[],
  preference: DashboardPreference | null,
): PinnedAction[] {
  const hidden = new Set(preference?.hiddenPinnedActions ?? []);
  const byKey = new Map<string, PinnedAction>(actions.map((action) => [action.key, action]));
  const ordered = (preference?.pinnedActionOrder ?? []).flatMap((key) => {
    const action = byKey.get(key);
    return action && !hidden.has(action.key) ? [action] : [];
  });
  const orderedKeys = new Set(ordered.map((action) => action.key));
  const rest = actions.filter((action) => !orderedKeys.has(action.key) && !hidden.has(action.key));
  return [...ordered, ...rest];
}
