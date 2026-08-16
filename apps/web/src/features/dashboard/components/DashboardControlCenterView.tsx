'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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

/**
 * Side column only (xl): topbar (4rem) + main inset pt-4 (1rem).
 * Below xl, notes sit under Priority Feed in the stacked / 2-col grid.
 */
const DASHBOARD_NOTES_COLUMN_MAX_HEIGHT_CLASS = 'xl:max-h-[calc(100dvh-5rem)]';

const DASHBOARD_GRID_CLASS = cn(
  'grid min-h-0 items-start gap-5',
  'grid-cols-1',
  'lg:grid-cols-2',
  'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,400px)]',
);

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
    <div className="flex min-h-0 w-full max-w-none flex-col gap-5 max-md:gap-4">
      {error ? <DashboardError message={error} /> : null}
      <section className={DASHBOARD_GRID_CLASS}>
        <div className="min-w-0 lg:col-span-2 xl:col-span-2 xl:row-start-1">
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
        </div>

        <div className="min-w-0 xl:col-start-1 xl:row-start-2">
          <MiniAnalytics
            data={data}
            editMode={editMode}
            hiddenMetrics={hiddenMiniMetrics}
            onApplyWidgetLayout={applyWidgetLayout}
            visibleMetrics={visibleMiniMetrics}
          />
        </div>

        <div className="min-w-0 xl:col-start-2 xl:row-start-2">
          <PriorityFeed priorities={priorities} />
        </div>

        <div
          className={cn(
            'flex min-h-0 w-full min-w-0 flex-col',
            'lg:col-start-2',
            'xl:col-start-3 xl:row-span-2 xl:row-start-1',
            DASHBOARD_NOTES_COLUMN_MAX_HEIGHT_CLASS,
          )}
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
    <div className="flex min-h-0 w-full max-w-none flex-col gap-5 max-md:gap-4">
      <div className={DASHBOARD_GRID_CLASS}>
        <div className="min-w-0 lg:col-span-2 xl:col-span-2 xl:row-start-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: PINNED_SKELETON_COUNT }).map((_, index) => (
              <Skeleton key={index} className="min-h-[4.75rem] rounded-xl" />
            ))}
          </div>
        </div>
        <Skeleton className="h-64 min-w-0 rounded-2xl xl:col-start-1 xl:row-start-2" />
        <Skeleton className="h-28 min-w-0 rounded-2xl xl:col-start-2 xl:row-start-2" />
        <Skeleton
          className={cn(
            'min-h-40 min-w-0 rounded-2xl',
            'lg:col-start-2',
            'xl:col-start-3 xl:row-span-2 xl:row-start-1',
            DASHBOARD_NOTES_COLUMN_MAX_HEIGHT_CLASS,
          )}
        />
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
