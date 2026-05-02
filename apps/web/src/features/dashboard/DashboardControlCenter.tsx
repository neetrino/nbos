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
import { toast } from 'sonner';
import { dashboardApi } from '@/lib/api/dashboard';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import {
  DashboardControlCenterView,
  DashboardLoadingSkeleton,
} from './components/DashboardControlCenterView';
import { loadDashboardControlData } from './dashboard-control-data';
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

export function DashboardControlCenter() {
  const dashboard = useDashboardControlCenter();

  if (dashboard.loading) return <DashboardLoadingSkeleton />;

  return (
    <DashboardControlCenterView
      actions={dashboard.actions}
      applyPinnedLayout={dashboard.applyPinnedLayout}
      applyWidgetLayout={dashboard.applyWidgetLayout}
      data={dashboard.data}
      deleteDashboardNote={dashboard.deleteDashboardNote}
      error={dashboard.error}
      hiddenActions={dashboard.hiddenActions}
      hiddenMiniMetrics={dashboard.hiddenMiniMetrics}
      notes={dashboard.notes}
      personalLinks={dashboard.personalLinks}
      priorities={dashboard.priorities}
      savingPreference={dashboard.savingPreference}
      visibleMiniMetrics={dashboard.visibleMiniMetrics}
      createDashboardNote={dashboard.createDashboardNote}
      createPersonalLink={dashboard.createPersonalLink}
      deletePersonalLink={dashboard.deletePersonalLink}
      reorderDashboardNotes={dashboard.reorderDashboardNotes}
      updateDashboardNote={dashboard.updateDashboardNote}
    />
  );
}

function useDashboardControlCenter() {
  const { can } = usePermission();
  const [data, setData] = useState<DashboardData | null>(null);
  const [preference, setPreference] = useState<DashboardPreference | null>(null);
  const [personalLinks, setPersonalLinks] = useState<DashboardPersonalLink[]>([]);
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [priorities, setPriorities] = useState<PriorityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const preferenceControls = usePreferenceControls(preference, setPreference);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projection = await loadDashboardControlData();
      setData(projection.metrics);
      setPreference(projection.preference);
      setPersonalLinks(projection.personalLinks);
      setNotes(projection.notes ?? []);
      setPriorities(projection.priorities);
    } catch (caught) {
      setData(null);
      setPersonalLinks([]);
      setNotes([]);
      setPriorities([]);
      setError(caught instanceof Error ? caught.message : 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return {
    actions,
    applyPinnedLayout: preferenceControls.applyPinnedLayout,
    applyWidgetLayout: preferenceControls.applyWidgetLayout,
    data,
    error,
    fetchDashboard,
    hiddenActions,
    hiddenMiniMetrics,
    loading,
    notes,
    personalLinks,
    preference,
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
