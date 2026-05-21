'use client';

import { useMemo } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, Loader2 } from 'lucide-react';
import { EntityDetailSheetContent } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  parseChecklistInstanceItems,
  type ChecklistInstance,
  type ChecklistInstanceItem,
} from '@/lib/api/checklist-templates';
import { cn } from '@/lib/utils';
import {
  ChecklistWorkbenchItemRow,
  type ChecklistWorkbenchMarkHandler,
} from '@/features/checklist/checklist-instance-workbench-item-row';

/** Align floating rail with panel left edge (width: min(75vw, max-w-2xl|4xl|5xl) on right sheet). */
const CHECKLIST_WORKBENCH_FLOATING_RAIL_ANCHOR =
  'right-[min(75vw,42rem)] sm:right-[min(75vw,56rem)] xl:right-[min(75vw,64rem)]';

const CHECKLIST_WORKBENCH_PANEL_CLASS =
  'flex w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl xl:max-w-5xl';

export interface ChecklistInstanceWorkbenchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  instances: ChecklistInstance[];
  loading?: boolean;
  error: string | null;
  busyKey: string | null;
  onMark: ChecklistWorkbenchMarkHandler;
  onComplete: (instance: ChecklistInstance) => Promise<void>;
  /** When complete fails validation, item rows for this instance with these ids show a red frame. */
  completionBlockHighlight?: { instanceId: string; itemIds: readonly string[] } | null;
  /** Deep link + workspace rail (required — same UX as delivery product sheet). */
  floatingNav: {
    sourcePageHref: string;
    workspaceHref?: string | null;
  };
}

function isItemReviewed(item: ChecklistInstanceItem): boolean {
  return item.mark === 'DONE' || item.mark === 'NOT_DONE';
}

function computeTotals(instances: ChecklistInstance[]) {
  let total = 0;
  let reviewed = 0;
  let done = 0;
  let notDone = 0;
  for (const instance of instances) {
    const items = parseChecklistInstanceItems(instance.snapshotItems);
    for (const item of items) {
      total += 1;
      if (isItemReviewed(item)) reviewed += 1;
      if (item.mark === 'DONE') done += 1;
      if (item.mark === 'NOT_DONE') notDone += 1;
    }
  }
  const allInstancesComplete =
    instances.length > 0 && instances.every((i) => Boolean(i.completedAt));
  const progressPercent = total === 0 ? 0 : Math.round((reviewed / total) * 100);
  return { total, reviewed, done, notDone, allInstancesComplete, progressPercent };
}

export function ChecklistInstanceWorkbenchSheet({
  open,
  onOpenChange,
  title,
  instances,
  loading = false,
  error,
  busyKey,
  onMark,
  onComplete,
  completionBlockHighlight = null,
  floatingNav,
}: ChecklistInstanceWorkbenchSheetProps) {
  const totals = useMemo(() => computeTotals(instances), [instances]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        forceNestedBackdrop
        contentClassName={CHECKLIST_WORKBENCH_PANEL_CLASS}
        railAnchorClassName={CHECKLIST_WORKBENCH_FLOATING_RAIL_ANCHOR}
        sourcePageHref={floatingNav.sourcePageHref}
        workspaceHref={floatingNav.workspaceHref}
      >
        <ChecklistWorkbenchSheetBody
          title={title}
          totals={totals}
          loading={loading}
          error={error}
          instances={instances}
          busyKey={busyKey}
          onMark={onMark}
          onComplete={onComplete}
          completionBlockHighlight={completionBlockHighlight}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}

function ChecklistWorkbenchSheetBody({
  title,
  totals,
  loading,
  error,
  instances,
  busyKey,
  onMark,
  onComplete,
  completionBlockHighlight,
  headerPaddingClassName,
}: {
  title: string;
  totals: ReturnType<typeof computeTotals>;
  loading: boolean;
  error: string | null;
  instances: ChecklistInstance[];
  busyKey: string | null;
  onMark: ChecklistWorkbenchMarkHandler;
  onComplete: ChecklistInstanceWorkbenchSheetProps['onComplete'];
  completionBlockHighlight: ChecklistInstanceWorkbenchSheetProps['completionBlockHighlight'];
}) {
  return (
    <>
      <SheetHeader className="border-border shrink-0 space-y-3 border-b px-5 py-4">
        <div className="pr-2">
          <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
        </div>

        <div className="space-y-1.5">
          <div className="text-muted-foreground text-[11px] tabular-nums">
            <span>
              {totals.reviewed}/{totals.total}
            </span>
          </div>
          <Progress
            value={totals.progressPercent}
            className={cn(
              'h-1 w-full gap-0 [&_[data-slot=progress-track]]:h-1',
              totals.allInstancesComplete && '[&_[data-slot=progress-indicator]]:bg-emerald-600',
              !totals.allInstancesComplete &&
                totals.notDone > 0 &&
                '[&_[data-slot=progress-indicator]]:bg-amber-500',
            )}
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground flex items-center gap-2 text-[11px]">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Loading
          </p>
        ) : null}
        {error ? <p className="text-destructive text-[11px]">{error}</p> : null}
      </SheetHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 px-5 py-4">
          {instances.length === 0 && !loading ? (
            <p className="text-muted-foreground text-sm">No checklists.</p>
          ) : (
            instances.map((instance, index) => (
              <div key={instance.id}>
                {index > 0 ? <Separator className="mb-5" /> : null}
                <WorkbenchInstanceBlock
                  instance={instance}
                  busyKey={busyKey}
                  onMark={onMark}
                  onComplete={onComplete}
                  completionBlockItemIds={
                    completionBlockHighlight?.instanceId === instance.id
                      ? completionBlockHighlight.itemIds
                      : null
                  }
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function WorkbenchInstanceBlock({
  instance,
  busyKey,
  onMark,
  onComplete,
  completionBlockItemIds,
}: {
  instance: ChecklistInstance;
  busyKey: string | null;
  onMark: ChecklistWorkbenchMarkHandler;
  onComplete: ChecklistInstanceWorkbenchSheetProps['onComplete'];
  completionBlockItemIds: readonly string[] | null;
}) {
  const items = parseChecklistInstanceItems(instance.snapshotItems);
  const complete = Boolean(instance.completedAt);
  const reviewedCount = items.filter((item) => isItemReviewed(item)).length;
  const blockedIds = useMemo(
    () => (completionBlockItemIds ? new Set(completionBlockItemIds) : null),
    [completionBlockItemIds],
  );

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="truncate text-sm font-medium">{instance.template.name}</h4>
        <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
          v{instance.templateVersion.versionNumber} · {reviewedCount}/{items.length}
        </span>
      </div>

      <ol className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={`${instance.id}-${item.id}-${item.mark}`} className="list-none">
            <ChecklistWorkbenchItemRow
              index={idx + 1}
              instance={instance}
              item={item}
              disabled={complete}
              busy={busyKey === `${instance.id}:${item.id}`}
              onMark={onMark}
              completionBlocked={blockedIds?.has(item.id) ?? false}
            />
          </li>
        ))}
      </ol>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2 h-8 text-xs"
        disabled={complete || busyKey === `${instance.id}:complete`}
        onClick={() => void onComplete(instance)}
      >
        {busyKey === `${instance.id}:complete` ? (
          <>
            <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
            Completing…
          </>
        ) : (
          'Complete checklist'
        )}
      </Button>
    </section>
  );
}

export function ChecklistWorkbenchStatusIcon({
  variant,
  className,
}: {
  variant: 'complete' | 'attention' | 'empty';
  className?: string;
}) {
  if (variant === 'complete') {
    return <CheckCircle2 className={cn('size-5 text-emerald-600', className)} aria-hidden />;
  }
  if (variant === 'attention') {
    return <AlertCircle className={cn('size-5 text-amber-600', className)} aria-hidden />;
  }
  return <ClipboardCheck className={cn('text-muted-foreground size-5', className)} aria-hidden />;
}

export function computeChecklistWorkbenchTriggerVariant(
  instances: ChecklistInstance[],
  loading: boolean,
): 'complete' | 'attention' | 'empty' {
  if (loading || instances.length === 0) return 'empty';
  const allDone = instances.every((i) => Boolean(i.completedAt));
  if (allDone) return 'complete';
  return 'attention';
}
