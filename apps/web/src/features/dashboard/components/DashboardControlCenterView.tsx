'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  DashboardData,
  DashboardNote,
  DashboardPersonalLink,
  MiniMetricDefinition,
  PinnedAction,
  PriorityCard,
} from '../dashboard-control-registry';
import { MiniAnalytics, PriorityFeed } from './DashboardInsightPanels';
import { DashboardNotesPanel } from './DashboardNotesPanel';
import { PinnedActions } from './DashboardPinnedActions';

const PINNED_SKELETON_COUNT = 6;

/** Topbar (4rem) + main inset pt-4 (1rem) — keeps notes column inside `main` without page scroll. */
const DASHBOARD_NOTES_COLUMN_MAX_HEIGHT_CLASS = 'max-h-[calc(100dvh-5rem)]';

interface DashboardControlCenterViewProps {
  actions: PinnedAction[];
  applyPinnedLayout: (
    visibleKeys: PinnedAction['key'][],
    hiddenKeys: PinnedAction['key'][],
  ) => void;
  applyWidgetLayout: (visibleIds: string[], hiddenIds: string[]) => void;
  createDashboardNote: (content: string) => Promise<void>;
  data: DashboardData | null;
  deleteDashboardNote: (id: string) => Promise<void>;
  error: string | null;
  hiddenActions: PinnedAction[];
  hiddenMiniMetrics: MiniMetricDefinition[];
  notes: DashboardNote[];
  personalLinks: DashboardPersonalLink[];
  priorities: PriorityCard[];
  savingPreference: boolean;
  visibleMiniMetrics: MiniMetricDefinition[];
  createPersonalLink: (label: string, url: string) => Promise<void>;
  deletePersonalLink: (id: string) => Promise<void>;
  reorderDashboardNotes: (noteIds: string[]) => Promise<void>;
  updateDashboardNote: (id: string, content: string) => Promise<void>;
}

export function DashboardControlCenterView({
  actions,
  applyPinnedLayout,
  applyWidgetLayout,
  createDashboardNote,
  data,
  deleteDashboardNote,
  error,
  hiddenActions,
  hiddenMiniMetrics,
  notes,
  personalLinks,
  priorities,
  savingPreference,
  visibleMiniMetrics,
  createPersonalLink,
  deletePersonalLink,
  reorderDashboardNotes,
  updateDashboardNote,
}: DashboardControlCenterViewProps) {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="flex min-h-0 flex-col gap-5">
      {error ? <DashboardError message={error} /> : null}
      <section className="grid min-h-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="min-h-0 space-y-5">
          <PinnedActions
            actions={actions}
            editMode={editMode}
            hiddenActions={hiddenActions}
            onApplyPinnedLayout={applyPinnedLayout}
            onCreatePersonalLink={createPersonalLink}
            onDeletePersonalLink={deletePersonalLink}
            onToggleEdit={() => setEditMode((current) => !current)}
            personalLinks={personalLinks}
            saving={savingPreference}
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <MiniAnalytics
              data={data}
              editMode={editMode}
              hiddenMetrics={hiddenMiniMetrics}
              onApplyWidgetLayout={applyWidgetLayout}
              visibleMetrics={visibleMiniMetrics}
            />
            <PriorityFeed priorities={priorities} />
          </div>
        </div>
        <div
          className={`flex min-h-0 w-full min-w-0 flex-col self-start ${DASHBOARD_NOTES_COLUMN_MAX_HEIGHT_CLASS}`}
        >
          <DashboardNotesPanel
            className="min-h-0 flex-1"
            notes={notes}
            onCreateNote={createDashboardNote}
            onDeleteNote={deleteDashboardNote}
            onReorderNotes={reorderDashboardNotes}
            onUpdateNote={updateDashboardNote}
          />
        </div>
      </section>
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="flex min-h-0 flex-col gap-5">
      <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="min-h-0 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: PINNED_SKELETON_COUNT }).map((_, index) => (
              <Skeleton key={index} className="min-h-[4.75rem] rounded-xl" />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
        <Skeleton className={`min-h-0 rounded-2xl ${DASHBOARD_NOTES_COLUMN_MAX_HEIGHT_CLASS}`} />
      </div>
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      {message}
    </div>
  );
}
