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
import { useState, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, BarChart3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS } from '../dashboard-dnd.constants';
import { dashboardPointerCollisionDetection } from '../dashboard-dnd-collision';
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
    <div className="border-border bg-card rounded-2xl border p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h2 className="text-sm font-semibold">Priority feed</h2>
      </div>
      {priorities.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">
          Nothing critical is waiting in the current lightweight feed.
        </p>
      ) : (
        <div className="mt-3 max-h-36 space-y-2 overflow-y-auto pr-1">
          {priorities.map((priority) => (
            <Link
              key={`${priority.source}:${priority.title}`}
              href={priority.href}
              className={`block rounded-xl border px-3 py-2 transition-colors hover:brightness-95 ${priorityClass(
                priority.severity,
              )}`}
            >
              <p className="text-sm font-medium">{priority.title}</p>
              <p className="mt-0.5 text-xs leading-5 opacity-80">{priority.context}</p>
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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const visibleIds = visibleMetrics.map((m) => m.id);
  const hiddenIds = hiddenMetrics.map((m) => m.id);
  const activeDragMetric =
    activeDragId !== null
      ? ([...visibleMetrics, ...hiddenMetrics].find((m) => m.id === activeDragId) ?? null)
      : null;
  const activeDragValue =
    activeDragMetric && 'key' in activeDragMetric
      ? (data?.[activeDragMetric.key] ?? 0)
      : activeDragMetric && 'value' in activeDragMetric
        ? activeDragMetric.value
        : '';

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
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

  function handleDragCancel() {
    setActiveDragId(null);
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
            collisionDetection={dashboardPointerCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="mt-4 flex flex-col gap-4">
              <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
                <WidgetDropColumn id={WIDGET_DROP_VISIBLE} title="Shown">
                  <div className={`mt-2 grid gap-2 ${DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS}`}>
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
              <SortableContext items={hiddenIds} strategy={verticalListSortingStrategy}>
                <WidgetDropColumn id={WIDGET_DROP_HIDDEN} title="Hidden">
                  <div className={`mt-2 grid gap-2 ${DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS}`}>
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
            <DragOverlay dropAnimation={null}>
              {activeDragMetric ? (
                <div className="shadow-md">
                  <MiniMetricReadOnly
                    icon={activeDragMetric.icon}
                    label={activeDragMetric.label}
                    value={activeDragValue}
                    href={'href' in activeDragMetric ? activeDragMetric.href : undefined}
                  />
                </div>
              ) : null}
            </DragOverlay>
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'focus-visible:ring-ring touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-55',
      )}
      {...attributes}
      {...listeners}
    >
      <MiniMetricEditRow icon={metric.icon} label={metric.label} value={value} variant={variant} />
    </div>
  );
}

function MiniMetricEditRow({
  icon: Icon,
  label,
  value,
  variant,
}: {
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
      {isHidden ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-primary shrink-0" aria-hidden>
            <Eye className="h-4 w-4" />
          </span>
          <span className="min-w-0 truncate text-sm">{label}</span>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2 select-none">{labelBlock}</div>
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
