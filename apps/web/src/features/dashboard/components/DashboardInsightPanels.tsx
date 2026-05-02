'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { ComponentType, HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, BarChart3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveTwoColumnSortMove } from '../dashboard-two-column-dnd';
import {
  priorityClass,
  type DashboardData,
  type MiniMetricDefinition,
  type PriorityCard,
} from '../dashboard-control-registry';

const WIDGET_DROP_VISIBLE = 'widget-drop-visible';
const WIDGET_DROP_HIDDEN = 'widget-drop-hidden';

interface PriorityFeedProps {
  priorities: PriorityCard[];
}

interface MiniAnalyticsProps {
  data: DashboardData | null;
  editMode: boolean;
  hiddenMetrics: MiniMetricDefinition[];
  onApplyWidgetLayout: (visibleIds: string[], hiddenIds: string[]) => void;
  visibleMetrics: MiniMetricDefinition[];
}

export function PriorityFeed({ priorities }: PriorityFeedProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h2 className="text-base font-semibold">Priority feed</h2>
      </div>
      {priorities.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Nothing critical is waiting in the current lightweight feed.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {priorities.map((priority) => (
            <Link
              key={`${priority.source}:${priority.title}`}
              href={priority.href}
              className={`block rounded-xl border p-3 transition-colors hover:brightness-95 ${priorityClass(
                priority.severity,
              )}`}
            >
              <p className="text-sm font-medium">{priority.title}</p>
              <p className="mt-1 text-xs leading-5 opacity-80">{priority.context}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function MiniAnalytics({
  data,
  editMode,
  hiddenMetrics,
  onApplyWidgetLayout,
  visibleMetrics,
}: MiniAnalyticsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const visibleIds = visibleMetrics.map((m) => m.id);
  const hiddenIds = hiddenMetrics.map((m) => m.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const next = resolveTwoColumnSortMove(
      String(active.id),
      over.id ? String(over.id) : undefined,
      visibleIds,
      hiddenIds,
      WIDGET_DROP_VISIBLE,
      WIDGET_DROP_HIDDEN,
    );
    if (!next) return;
    onApplyWidgetLayout(next.left, next.right);
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-sky-600" />
        <h2 className="text-base font-semibold">Mini analytics</h2>
      </div>
      {editMode ? (
        <>
          <p className="text-muted-foreground mt-2 text-xs">
            Drag rows between Shown and Hidden. Changes save automatically.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="mt-4 flex flex-col gap-4">
              <SortableContext items={visibleIds} strategy={rectSortingStrategy}>
                <WidgetDropColumn id={WIDGET_DROP_VISIBLE} title="Shown">
                  <div className="mt-2 grid gap-2">
                    {visibleMetrics.map((metric) => (
                      <SortableWidgetRow
                        key={metric.id}
                        data={data}
                        metric={metric}
                        variant="visible"
                      />
                    ))}
                  </div>
                </WidgetDropColumn>
              </SortableContext>
              <SortableContext items={hiddenIds} strategy={rectSortingStrategy}>
                <WidgetDropColumn id={WIDGET_DROP_HIDDEN} title="Hidden">
                  <div className="mt-2 grid gap-2">
                    {hiddenMetrics.map((metric) => (
                      <SortableWidgetRow
                        key={metric.id}
                        data={data}
                        metric={metric}
                        variant="hidden"
                      />
                    ))}
                  </div>
                </WidgetDropColumn>
              </SortableContext>
            </div>
          </DndContext>
        </>
      ) : (
        <div className="mt-4 grid gap-2">
          {visibleMetrics.map((metric) => (
            <MiniMetricReadOnly
              key={metric.id}
              icon={metric.icon}
              label={metric.label}
              value={'key' in metric ? (data?.[metric.key] ?? 0) : metric.value}
              href={'href' in metric ? metric.href : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WidgetDropColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
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
      <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SortableWidgetRow({
  data,
  metric,
  variant,
}: {
  data: DashboardData | null;
  metric: MiniMetricDefinition;
  variant: 'visible' | 'hidden';
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: metric.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };
  const value = 'key' in metric ? (data?.[metric.key] ?? 0) : metric.value;

  return (
    <div ref={setNodeRef} style={style}>
      <MiniMetricEditRow
        dragHandleProps={{ ...attributes, ...listeners }}
        href={'href' in metric ? metric.href : undefined}
        icon={metric.icon}
        label={metric.label}
        value={value}
        variant={variant}
      />
    </div>
  );
}

function MiniMetricEditRow({
  dragHandleProps,
  href,
  icon: Icon,
  label,
  value,
  variant,
}: {
  dragHandleProps: HTMLAttributes<HTMLButtonElement>;
  href?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  variant: 'visible' | 'hidden';
}) {
  const isHidden = variant === 'hidden';
  const labelBlock = (
    <>
      <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
      <span className="text-sm">{label}</span>
    </>
  );

  return (
    <div className="border-border bg-background/70 flex items-center justify-between gap-2 rounded-lg border p-2.5">
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none rounded border border-transparent px-0.5 active:cursor-grabbing"
        aria-label={`Drag ${label}`}
        {...dragHandleProps}
      />
      {isHidden ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-primary shrink-0" aria-hidden>
            <Eye className="h-4 w-4" />
          </span>
          <span className="min-w-0 truncate text-sm">{label}</span>
        </div>
      ) : href ? (
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-2">
          {labelBlock}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">{labelBlock}</div>
      )}
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function MiniMetricReadOnly({
  href,
  icon: Icon,
  label,
  value,
}: {
  href?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
}) {
  const labelContent = (
    <>
      <Icon className="text-muted-foreground h-4 w-4" />
      <span className="text-sm">{label}</span>
    </>
  );

  return (
    <div className="border-border bg-background/70 flex items-center justify-between rounded-lg border p-2.5">
      {href ? (
        <Link href={href} className="flex min-w-0 items-center gap-2">
          {labelContent}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-2">{labelContent}</div>
      )}
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}
