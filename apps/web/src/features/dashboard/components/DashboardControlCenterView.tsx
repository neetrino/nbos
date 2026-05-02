'use client';

import { useState } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  DashboardData,
  DashboardPersonalLink,
  MiniMetricDefinition,
  PinnedAction,
  PriorityCard,
} from '../dashboard-control-registry';
import { MiniAnalytics, PriorityFeed } from './DashboardInsightPanels';
import { PinnedActions } from './DashboardPinnedActions';

const PINNED_SKELETON_COUNT = 6;

interface DashboardControlCenterViewProps {
  actions: PinnedAction[];
  applyPinnedLayout: (
    visibleKeys: PinnedAction['key'][],
    hiddenKeys: PinnedAction['key'][],
  ) => void;
  applyWidgetLayout: (visibleIds: string[], hiddenIds: string[]) => void;
  data: DashboardData | null;
  error: string | null;
  hiddenActions: PinnedAction[];
  hiddenMiniMetrics: MiniMetricDefinition[];
  personalLinks: DashboardPersonalLink[];
  priorities: PriorityCard[];
  savingPreference: boolean;
  visibleMiniMetrics: MiniMetricDefinition[];
  createPersonalLink: (label: string, url: string) => Promise<void>;
  deletePersonalLink: (id: string) => Promise<void>;
}

export function DashboardControlCenterView({
  actions,
  applyPinnedLayout,
  applyWidgetLayout,
  data,
  error,
  hiddenActions,
  hiddenMiniMetrics,
  personalLinks,
  priorities,
  savingPreference,
  visibleMiniMetrics,
  createPersonalLink,
  deletePersonalLink,
}: DashboardControlCenterViewProps) {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="space-y-5">
      <DashboardHeader
        editMode={editMode}
        onToggleEdit={() => setEditMode((current) => !current)}
      />
      {error ? <DashboardError message={error} /> : null}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <PinnedActions
          actions={actions}
          editMode={editMode}
          hiddenActions={hiddenActions}
          onApplyPinnedLayout={applyPinnedLayout}
          onCreatePersonalLink={createPersonalLink}
          onDeletePersonalLink={deletePersonalLink}
          personalLinks={personalLinks}
          saving={savingPreference}
        />
        <MiniAnalytics
          data={data}
          editMode={editMode}
          hiddenMetrics={hiddenMiniMetrics}
          onApplyWidgetLayout={applyWidgetLayout}
          visibleMetrics={visibleMiniMetrics}
        />
      </section>
      <PriorityFeed priorities={priorities} />
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: PINNED_SKELETON_COUNT }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

function DashboardHeader({
  editMode,
  onToggleEdit,
}: {
  editMode: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <PageHeader title="Dashboard">
      <Button variant={editMode ? 'default' : 'secondary'} size="sm" onClick={onToggleEdit}>
        {editMode ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <SlidersHorizontal className="h-3.5 w-3.5" />
        )}
        {editMode ? 'Done' : 'Edit layout'}
      </Button>
    </PageHeader>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      {message}
    </div>
  );
}
