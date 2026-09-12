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
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { dashboardPointerCollisionDetection } from '../dashboard-dnd-collision';
import { resolveTwoColumnSortMove } from '../dashboard-two-column-dnd';
import { PersonalLinkCard, PinnedActionCard } from './DashboardActionCards';
import {
  CreateLinkInline,
  EmptyPinnedActions,
  PinnedActionsTitle,
  PinnedDropColumn,
  PinnedTileGrid,
  SortablePinnedTile,
} from './DashboardPinnedActionsChrome';
import { DashboardPinnedActionsView } from './DashboardPinnedActionsView';
import { PINNED_DROP_HIDDEN, PINNED_DROP_VISIBLE } from '../dashboard-pinned-actions.constants';
import type { DashboardPersonalLink, PinnedAction } from '../dashboard-control-registry';

interface PinnedActionsProps {
  actions: PinnedAction[];
  editMode: boolean;
  hiddenActions: PinnedAction[];
  hiddenPersonalLinkIds: string[];
  onApplyPinnedLayout: (visibleIds: string[], hiddenIds: string[]) => void;
  onCreatePersonalLink: (label: string, url: string) => Promise<void>;
  onDeletePersonalLink: (id: string) => Promise<void>;
  onUpdatePersonalLink: (id: string, label: string, url: string) => Promise<void>;
  onToggleEdit: () => void;
  personalLinks: DashboardPersonalLink[];
  saving: boolean;
}

export function PinnedActions({
  actions,
  editMode,
  hiddenActions,
  hiddenPersonalLinkIds,
  onApplyPinnedLayout,
  onCreatePersonalLink,
  onDeletePersonalLink,
  onUpdatePersonalLink,
  onToggleEdit,
  personalLinks,
  saving,
}: PinnedActionsProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const dashboardLinks = personalLinks.filter((link) =>
    link.placement.includes('DASHBOARD_PINNED_ACTIONS'),
  );
  const hiddenLinkIdSet = new Set(hiddenPersonalLinkIds);
  const visibleLinks = dashboardLinks.filter((link) => !hiddenLinkIdSet.has(link.id));
  const hiddenLinks = dashboardLinks.filter((link) => hiddenLinkIdSet.has(link.id));
  const hasPinned =
    actions.length > 0 ||
    visibleLinks.length > 0 ||
    hiddenActions.length > 0 ||
    hiddenLinks.length > 0;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const visibleKeys = [...actions.map((action) => action.key), ...visibleLinks.map((link) => link.id)];
  const hiddenKeys = [
    ...hiddenActions.map((action) => action.key),
    ...hiddenLinks.map((link) => link.id),
  ];
  const editingLink = dashboardLinks.find((link) => link.id === editingLinkId) ?? null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
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
      {hasPinned ? (
        editMode ? (
          <PinnedActionsEdit
            actions={actions}
            activeDragId={activeDragId}
            dashboardLinks={dashboardLinks}
            editingLink={editingLink}
            hiddenActions={hiddenActions}
            hiddenKeys={hiddenKeys}
            hiddenLinks={hiddenLinks}
            saving={saving}
            sensors={sensors}
            visibleKeys={visibleKeys}
            visibleLinks={visibleLinks}
            onCancelEdit={() => setEditingLinkId(null)}
            onDeletePersonalLink={onDeletePersonalLink}
            onDragCancel={() => setActiveDragId(null)}
            onDragEnd={handleDragEnd}
            onDragStart={(event: DragStartEvent) => setActiveDragId(String(event.active.id))}
            onEditLink={setEditingLinkId}
            onSubmitLink={async (label, url) => {
              if (editingLink) {
                await onUpdatePersonalLink(editingLink.id, label, url);
                setEditingLinkId(null);
                return;
              }
              await onCreatePersonalLink(label, url);
            }}
          />
        ) : (
          <DashboardPinnedActionsView actions={actions} personalLinks={visibleLinks} />
        )
      ) : (
        <EmptyPinnedActions />
      )}
      <PinnedActionsTitle editMode={editMode} onToggleEdit={onToggleEdit} />
    </section>
  );
}

function PinnedActionsEdit({
  actions,
  activeDragId,
  dashboardLinks,
  editingLink,
  hiddenActions,
  hiddenKeys,
  hiddenLinks,
  saving,
  sensors,
  visibleKeys,
  visibleLinks,
  onCancelEdit,
  onDeletePersonalLink,
  onDragCancel,
  onDragEnd,
  onDragStart,
  onEditLink,
  onSubmitLink,
}: {
  actions: PinnedAction[];
  activeDragId: string | null;
  dashboardLinks: DashboardPersonalLink[];
  editingLink: DashboardPersonalLink | null;
  hiddenActions: PinnedAction[];
  hiddenKeys: string[];
  hiddenLinks: DashboardPersonalLink[];
  saving: boolean;
  sensors: ReturnType<typeof useSensors>;
  visibleKeys: string[];
  visibleLinks: DashboardPersonalLink[];
  onCancelEdit: () => void;
  onDeletePersonalLink: (id: string) => Promise<void>;
  onDragCancel: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart: (event: DragStartEvent) => void;
  onEditLink: (id: string) => void;
  onSubmitLink: (label: string, url: string) => Promise<void>;
}) {
  const t = useTranslations('dashboard');
  const activeDragAction =
    activeDragId === null
      ? null
      : ([...actions, ...hiddenActions].find((action) => action.key === activeDragId) ?? null);
  const activeDragLink =
    activeDragId === null ? null : (dashboardLinks.find((link) => link.id === activeDragId) ?? null);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={dashboardPointerCollisionDetection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex flex-col gap-4">
          <SortableContext items={visibleKeys} strategy={rectSortingStrategy}>
            <PinnedDropColumn id={PINNED_DROP_VISIBLE} title={t('pinned.shownOnDashboard')}>
              <PinnedTileGrid>
                {actions.map((action) => (
                  <SortablePinnedTile key={action.key} id={action.key}>
                    <PinnedActionCard action={action} variant="visible" editMode />
                  </SortablePinnedTile>
                ))}
                {visibleLinks.map((link) => (
                  <SortablePinnedTile key={link.id} id={link.id}>
                    <PersonalLinkCard
                      editMode
                      link={link}
                      onDelete={() => onDeletePersonalLink(link.id)}
                      onEdit={() => onEditLink(link.id)}
                    />
                  </SortablePinnedTile>
                ))}
              </PinnedTileGrid>
            </PinnedDropColumn>
          </SortableContext>
          <SortableContext items={hiddenKeys} strategy={rectSortingStrategy}>
            <PinnedDropColumn id={PINNED_DROP_HIDDEN} title={t('pinned.hidden')}>
              <PinnedTileGrid>
                {hiddenActions.map((action) => (
                  <SortablePinnedTile key={action.key} id={action.key}>
                    <PinnedActionCard action={action} variant="hidden" editMode />
                  </SortablePinnedTile>
                ))}
                {hiddenLinks.map((link) => (
                  <SortablePinnedTile key={link.id} id={link.id}>
                    <PersonalLinkCard
                      editMode
                      hidden
                      link={link}
                      onDelete={() => onDeletePersonalLink(link.id)}
                      onEdit={() => onEditLink(link.id)}
                    />
                  </SortablePinnedTile>
                ))}
              </PinnedTileGrid>
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
          ) : activeDragLink ? (
            <PersonalLinkCard
              editMode
              hidden={hiddenKeys.includes(activeDragLink.id)}
              link={activeDragLink}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <CreateLinkInline
        key={editingLink?.id ?? 'create'}
        editing={editingLink}
        saving={saving}
        onCancelEdit={onCancelEdit}
        onSubmit={onSubmitLink}
      />
    </>
  );
}
