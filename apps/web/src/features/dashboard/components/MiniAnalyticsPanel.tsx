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
import { useMemo, useState, type ComponentType } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BarChart3, Eye } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';
import { AnalyticsCard } from '@/components/ui/analytics-card';
import { cn } from '@/lib/utils';
import { DASHBOARD_TWO_COLUMN_DROP_MIN_HEIGHT_CLASS } from '../dashboard-dnd.constants';
import { dashboardPointerCollisionDetection } from '../dashboard-dnd-collision';
import { resolveTwoColumnSortMove } from '../dashboard-two-column-dnd';
import type { DashboardData, MiniMetricDefinition } from '../dashboard-control-registry';
import { buildMiniAnalyticsChart } from './mini-analytics-chart-data';

const WIDGET_DROP_VISIBLE = 'widget-drop-visible';
const WIDGET_DROP_HIDDEN = 'widget-drop-hidden';

interface MiniAnalyticsProps {
  data: DashboardData | null;
  editMode: boolean;
  hiddenMetrics: MiniMetricDefinition[];
  onApplyWidgetLayout: (visibleIds: string[], hiddenIds: string[]) => void;
  visibleMetrics: MiniMetricDefinition[];
}

export function MiniAnalytics({
  data,
  editMode,
  hiddenMetrics,
  onApplyWidgetLayout,
  visibleMetrics,
}: MiniAnalyticsProps) {
  const t = useTranslations('dashboard');
  const numberLocale = resolveDatePickerLocale(useLocale());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const { bars, totalAmount } = useMemo(() => {
    const chart = buildMiniAnalyticsChart(visibleMetrics, data, numberLocale);
    return {
      totalAmount: chart.totalAmount,
      bars: chart.bars.map((bar, index) => ({
        ...bar,
        label: t(visibleMetrics[index]?.labelKey ?? 'widgets.metrics.leads'),
      })),
    };
  }, [visibleMetrics, data, numberLocale, t]);
  const visibleIds = visibleMetrics.map((m) => m.id);
  const hiddenIds = hiddenMetrics.map((m) => m.id);
  const activeDragMetric =
    activeDragId !== null
      ? ([...visibleMetrics, ...hiddenMetrics].find((m) => m.id === activeDragId) ?? null)
      : null;
  const activeDragValue = activeDragMetric !== null ? (data?.[activeDragMetric.key] ?? 0) : '';

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

  if (editMode) {
    return (
      <div className="nbos-desk-surface text-card-foreground w-full p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-muted-foreground text-lg font-medium">
            {t('widgets.miniAnalyticsTitle')}
          </h3>
          <div className="bg-muted/50 flex h-8 w-8 items-center justify-center rounded-full">
            <BarChart3 className="text-muted-foreground h-4 w-4" aria-hidden />
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-xs">{t('widgets.editHint')}</p>
        <DndContext
          sensors={sensors}
          collisionDetection={dashboardPointerCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="mt-4 flex flex-col gap-4">
            <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
              <WidgetDropColumn id={WIDGET_DROP_VISIBLE} title={t('widgets.shown')}>
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
              <WidgetDropColumn id={WIDGET_DROP_HIDDEN} title={t('widgets.hidden')}>
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
              <MiniMetricEditRow
                icon={activeDragMetric.icon}
                labelKey={activeDragMetric.labelKey}
                value={activeDragValue}
                variant="visible"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    );
  }

  return (
    <AnalyticsCard
      title={t('widgets.miniAnalyticsTitle')}
      totalAmount={totalAmount}
      icon={<BarChart3 className="text-muted-foreground h-4 w-4" />}
      data={bars}
      locale={numberLocale}
    />
  );
}

function WidgetDropColumn({
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
  const value = data?.[metric.key] ?? 0;

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
      <MiniMetricEditRow
        icon={metric.icon}
        labelKey={metric.labelKey}
        value={value}
        variant={variant}
      />
    </div>
  );
}

function MiniMetricEditRow({
  icon: Icon,
  labelKey,
  value,
  variant,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  labelKey: MiniMetricDefinition['labelKey'];
  value: number | string;
  variant: 'visible' | 'hidden';
}) {
  const t = useTranslations('dashboard');
  const label = t(labelKey);
  const isHidden = variant === 'hidden';

  return (
    <div className="border-border bg-background/70 flex items-center justify-between gap-2 rounded-lg border p-2.5">
      {isHidden ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Eye className="text-primary h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 truncate text-sm">{label}</span>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2 select-none">
          <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="text-sm">{label}</span>
        </div>
      )}
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}
