'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type FormEvent, useState } from 'react';
import { DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS } from '../dashboard-dnd.constants';
import { dashboardPointerCollisionDetection } from '../dashboard-dnd-collision';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { resolveTwoColumnSortMove } from '../dashboard-two-column-dnd';
import { PersonalLinkCard, PinnedActionCard } from './DashboardActionCards';
import type { DashboardPersonalLink, PinnedAction } from '../dashboard-control-registry';

const PINNED_DROP_VISIBLE = 'pinned-drop-visible';
const PINNED_DROP_HIDDEN = 'pinned-drop-hidden';

const GRID_CLASS = 'grid grid-cols-2 gap-3 sm:grid-cols-4';

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

  function handleDragStart(event: DragStartEvent) {
    setActiveDragKey(event.active.id as PinnedAction['key']);
  }

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

  function handleDragCancel() {
    setActiveDragKey(null);
  }

  return (
    <section className="border-border bg-card rounded-2xl border p-4 shadow-sm">
      <PinnedActionsTitle editMode={editMode} />

      {hasPinned ? (
        editMode ? (
          <>
            <p className="text-muted-foreground mt-2 text-xs">
              Drag tiles between Shown and Hidden. Changes save automatically.
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={dashboardPointerCollisionDetection}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div className="mt-4 flex flex-col gap-4">
                <SortableContext items={visibleKeys} strategy={rectSortingStrategy}>
                  <PinnedDropColumn id={PINNED_DROP_VISIBLE} title="Shown on dashboard">
                    <div className={`${GRID_CLASS} ${DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS}`}>
                      {actions.map((action) => (
                        <SortablePinnedTile key={action.key} action={action} variant="visible" />
                      ))}
                    </div>
                  </PinnedDropColumn>
                </SortableContext>
                <SortableContext items={hiddenKeys} strategy={rectSortingStrategy}>
                  <PinnedDropColumn id={PINNED_DROP_HIDDEN} title="Hidden">
                    <div className={`${GRID_CLASS} ${DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS}`}>
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
                    editMode={false}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
            {dashboardLinks.length > 0 ? (
              <div className={`${GRID_CLASS} mt-4`}>
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
        ) : (
          <div className={`${GRID_CLASS} mt-4`}>
            {actions.map((action) => (
              <PinnedActionCard key={action.key} action={action} editMode={false} />
            ))}
            {dashboardLinks.map((link) => (
              <PersonalLinkCard
                key={link.id}
                editMode={false}
                link={link}
                onDelete={() => onDeletePersonalLink(link.id)}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyPinnedActions />
      )}
    </section>
  );
}

function PinnedDropColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-border/80 bg-muted/10 rounded-lg border border-dashed p-3',
        isOver && 'border-primary/50 bg-muted/25',
      )}
    >
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </div>
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
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'focus-visible:ring-ring touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-55',
      )}
      {...attributes}
      {...listeners}
    >
      <PinnedActionCard action={action} variant={variant} editMode />
    </div>
  );
}

function CreateLinkInline({
  onCreate,
  saving,
}: {
  onCreate: (label: string, url: string) => Promise<void>;
  saving: boolean;
}) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const canSubmit = Boolean(label.trim() && url.trim());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await onCreate(label.trim(), url.trim());
    setLabel('');
    setUrl('');
  }

  return (
    <div className="border-border/80 bg-muted/20 mt-5 rounded-xl border border-dashed p-4">
      <h3 className="text-sm font-semibold">New shortcut button</h3>
      <p className="text-muted-foreground mt-1 text-xs">
        Label and link are saved to your dashboard pinned area.
      </p>
      <form
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => void submit(e)}
      >
        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/path or example.com (https added)"
          />
        </div>
        <Button type="submit" disabled={!canSubmit || saving}>
          Save
        </Button>
      </form>
    </div>
  );
}

function PinnedActionsTitle({ editMode }: { editMode: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">Pinned actions</h2>
        {editMode ? <Badge variant="outline">Editing</Badge> : null}
      </div>
    </div>
  );
}

function EmptyPinnedActions() {
  return (
    <p className="text-muted-foreground mt-4 rounded-xl border border-dashed p-4 text-sm">
      No pinned actions are available for your current permissions.
    </p>
  );
}
