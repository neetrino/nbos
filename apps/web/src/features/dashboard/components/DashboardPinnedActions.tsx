'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS } from '../dashboard-dnd.constants';
import { dashboardPointerCollisionDetection } from '../dashboard-dnd-collision';
import { cn } from '@/lib/utils';
import { resolveTwoColumnSortMove } from '../dashboard-two-column-dnd';
import { PersonalLinkCard, PinnedActionCard } from './DashboardActionCards';
import {
  CreateLinkInline,
  EmptyPinnedActions,
  PinnedActionsTitle,
  PinnedDropColumn,
} from './DashboardPinnedActionsChrome';
import { DashboardPinnedActionsView } from './DashboardPinnedActionsView';
import { DASHBOARD_PINNED_TILE_MIN_HEIGHT_CLASS } from '../dashboard-pinned-action-tones';
import {
  DASHBOARD_PINNED_GRID_CLASS,
  PINNED_DROP_HIDDEN,
  PINNED_DROP_VISIBLE,
} from '../dashboard-pinned-actions.constants';
import type { DashboardPersonalLink, PinnedAction } from '../dashboard-control-registry';

interface PinnedActionsProps {
  actions: PinnedAction[];
  editMode: boolean;
  hiddenActions: PinnedAction[];
  onApplyPinnedLayout: (
    visibleKeys: PinnedAction['key'][],
    hiddenKeys: PinnedAction['key'][],
  ) => void;
  onCreatePersonalLink: (label: string, url: string) => Promise<void>;
  onDeletePersonalLink: (id: string) => Promise<void>;
  onToggleEdit: () => void;
  personalLinks: DashboardPersonalLink[];
  saving: boolean;
}

export function PinnedActions({
  actions,
  editMode,
  hiddenActions,
  onApplyPinnedLayout,
  onCreatePersonalLink,
  onDeletePersonalLink,
  onToggleEdit,
  personalLinks,
  saving,
}: PinnedActionsProps) {
  const [activeDragKey, setActiveDragKey] = useState<PinnedAction['key'] | null>(null);
  const dashboardLinks = personalLinks.filter((link) =>
    link.placement.includes('DASHBOARD_PINNED_ACTIONS'),
  );
  const hasPinned = actions.length > 0 || dashboardLinks.length > 0 || hiddenActions.length > 0;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const visibleKeys = actions.map((a) => a.key);
  const hiddenKeys = hiddenActions.map((a) => a.key);
  const activeDragAction =
    activeDragKey !== null
      ? ([...actions, ...hiddenActions].find((a) => a.key === activeDragKey) ?? null)
      : null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragKey(null);
    if (!over) return;
    const next = resolveTwoColumnSortMove(
      String(active.id),
      over.id ? String(over.id) : undefined,
      visibleKeys,
      hiddenKeys,
      PINNED_DROP_VISIBLE,
      PINNED_DROP_HIDDEN,
    );
    if (!next) return;
    onApplyPinnedLayout(next.left, next.right);
  }

  return (
    <section className="nbos-desk-surface p-4 sm:p-5">
      <PinnedActionsTitle editMode={editMode} onToggleEdit={onToggleEdit} />
      {hasPinned ? (
        editMode ? (
          <PinnedActionsEdit
            actions={actions}
            activeDragAction={activeDragAction}
            dashboardLinks={dashboardLinks}
            hiddenActions={hiddenActions}
            hiddenKeys={hiddenKeys}
            saving={saving}
            sensors={sensors}
            visibleKeys={visibleKeys}
            onCreatePersonalLink={onCreatePersonalLink}
            onDeletePersonalLink={onDeletePersonalLink}
            onDragCancel={() => setActiveDragKey(null)}
            onDragEnd={handleDragEnd}
            onDragStart={(event: DragStartEvent) =>
              setActiveDragKey(event.active.id as PinnedAction['key'])
            }
          />
        ) : (
          <DashboardPinnedActionsView
            actions={actions}
            personalLinks={dashboardLinks}
            onDeletePersonalLink={onDeletePersonalLink}
          />
        )
      ) : (
        <EmptyPinnedActions />
      )}
    </section>
  );
}

function PinnedActionsEdit({
  actions,
  activeDragAction,
  dashboardLinks,
  hiddenActions,
  hiddenKeys,
  saving,
  sensors,
  visibleKeys,
  onCreatePersonalLink,
  onDeletePersonalLink,
  onDragCancel,
  onDragEnd,
  onDragStart,
}: {
  actions: PinnedAction[];
  activeDragAction: PinnedAction | null;
  dashboardLinks: DashboardPersonalLink[];
  hiddenActions: PinnedAction[];
  hiddenKeys: PinnedAction['key'][];
  saving: boolean;
  sensors: ReturnType<typeof useSensors>;
  visibleKeys: PinnedAction['key'][];
  onCreatePersonalLink: (label: string, url: string) => Promise<void>;
  onDeletePersonalLink: (id: string) => Promise<void>;
  onDragCancel: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart: (event: DragStartEvent) => void;
}) {
  return (
    <>
      <p className="text-muted-foreground mt-2 text-xs">
        Drag tiles between Shown and Hidden. Plus creates in place. Arrow opens a page.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={dashboardPointerCollisionDetection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="mt-4 flex flex-col gap-4">
          <SortableContext items={visibleKeys} strategy={rectSortingStrategy}>
            <PinnedDropColumn id={PINNED_DROP_VISIBLE} title="Shown on dashboard">
              <div
                className={`${DASHBOARD_PINNED_GRID_CLASS} ${DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS}`}
              >
                {actions.map((action) => (
                  <SortablePinnedTile key={action.key} action={action} variant="visible" />
                ))}
              </div>
            </PinnedDropColumn>
          </SortableContext>
          <SortableContext items={hiddenKeys} strategy={rectSortingStrategy}>
            <PinnedDropColumn id={PINNED_DROP_HIDDEN} title="Hidden">
              <div
                className={`${DASHBOARD_PINNED_GRID_CLASS} ${DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS}`}
              >
                {hiddenActions.map((action) => (
                  <SortablePinnedTile key={action.key} action={action} variant="hidden" />
                ))}
              </div>
            </PinnedDropColumn>
          </SortableContext>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDragAction ? (
            <PinnedActionCard
              action={activeDragAction}
              variant={visibleKeys.includes(activeDragAction.key) ? 'visible' : 'hidden'}
              editMode
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      {dashboardLinks.length > 0 ? (
        <div className={`${DASHBOARD_PINNED_GRID_CLASS} mt-4`}>
          {dashboardLinks.map((link) => (
            <PersonalLinkCard
              key={link.id}
              editMode
              link={link}
              onDelete={() => onDeletePersonalLink(link.id)}
            />
          ))}
        </div>
      ) : null}
      <CreateLinkInline onCreate={onCreatePersonalLink} saving={saving} />
    </>
  );
}

function SortablePinnedTile({
  action,
  variant,
}: {
  action: PinnedAction;
  variant: 'visible' | 'hidden';
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action.key,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
      }}
      className={cn(
        'focus-visible:ring-ring touch-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'cursor-grab active:cursor-grabbing',
        DASHBOARD_PINNED_TILE_MIN_HEIGHT_CLASS,
        'w-full',
        isDragging && 'opacity-55',
      )}
      {...attributes}
      {...listeners}
    >
      <PinnedActionCard action={action} variant={variant} editMode />
    </div>
  );
}
