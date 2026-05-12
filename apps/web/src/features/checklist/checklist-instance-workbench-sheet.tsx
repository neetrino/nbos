'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Loader2,
  Star,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  parseChecklistInstanceItems,
  type ChecklistInstance,
  type ChecklistInstanceItem,
  type ChecklistInstanceItemMark,
} from '@/lib/api/checklist-templates';
import { cn } from '@/lib/utils';
import { ChecklistItemEvidenceDisplay } from '@/features/checklist/checklist-item-evidence-display';

export interface ChecklistInstanceWorkbenchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  instances: ChecklistInstance[];
  loading?: boolean;
  error: string | null;
  busyKey: string | null;
  onMark: (
    instance: ChecklistInstance,
    item: ChecklistInstanceItem,
    mark: ChecklistInstanceItemMark,
    comment?: string,
  ) => Promise<void>;
  onComplete: (instance: ChecklistInstance) => Promise<void>;
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
  description,
  instances,
  loading = false,
  error,
  busyKey,
  onMark,
  onComplete,
}: ChecklistInstanceWorkbenchSheetProps) {
  const totals = useMemo(() => computeTotals(instances), [instances]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-border bg-card/30 shrink-0 space-y-3 border-b px-6 py-5">
          <div className="flex items-start gap-3 pr-10">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <ClipboardCheck className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <SheetTitle className="text-lg leading-tight">{title}</SheetTitle>
              {description ? (
                <SheetDescription className="text-muted-foreground text-sm leading-snug">
                  {description}
                </SheetDescription>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground font-medium tracking-wide uppercase">
                Progress
              </span>
              <span className="text-foreground font-semibold tabular-nums">
                {totals.reviewed}/{totals.total} reviewed
                {totals.total > 0 ? (
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    · {totals.done} done
                    {totals.notDone > 0 ? (
                      <span className="text-amber-600"> · {totals.notDone} not done</span>
                    ) : null}
                  </span>
                ) : null}
              </span>
            </div>
            <Progress
              value={totals.progressPercent}
              className={cn(
                'h-2 w-full gap-0 [&_[data-slot=progress-track]]:h-2',
                totals.allInstancesComplete && '[&_[data-slot=progress-indicator]]:bg-emerald-600',
                !totals.allInstancesComplete &&
                  totals.notDone > 0 &&
                  '[&_[data-slot=progress-indicator]]:bg-amber-500',
              )}
            />
            {totals.allInstancesComplete ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                All checklists completed for this view.
              </p>
            ) : totals.total > 0 ? (
              <p className="text-muted-foreground text-xs">
                Mark each item, then use &quot;Complete checklist&quot; on each template when ready.
              </p>
            ) : null}
          </div>

          {loading ? (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Loading…
            </p>
          ) : null}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-6 py-5">
            {instances.length === 0 && !loading ? (
              <p className="text-muted-foreground text-sm">No checklists in this context.</p>
            ) : (
              instances.map((instance, index) => (
                <div key={instance.id}>
                  {index > 0 ? <Separator className="mb-6" /> : null}
                  <WorkbenchInstanceBlock
                    instance={instance}
                    busyKey={busyKey}
                    onMark={onMark}
                    onComplete={onComplete}
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function WorkbenchInstanceBlock({
  instance,
  busyKey,
  onMark,
  onComplete,
}: {
  instance: ChecklistInstance;
  busyKey: string | null;
  onMark: ChecklistInstanceWorkbenchSheetProps['onMark'];
  onComplete: ChecklistInstanceWorkbenchSheetProps['onComplete'];
}) {
  const items = parseChecklistInstanceItems(instance.snapshotItems);
  const complete = Boolean(instance.completedAt);
  const reviewedCount = items.filter((item) => isItemReviewed(item)).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-foreground text-base font-semibold">{instance.template.name}</h4>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Version {instance.templateVersion.versionNumber} · {reviewedCount}/{items.length}{' '}
            reviewed
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase',
            complete
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {complete ? 'Complete' : 'Open'}
        </span>
      </div>

      <ol className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={`${instance.id}-${item.id}-${item.mark}-${item.comment ?? ''}`}
            className="list-none"
          >
            <WorkbenchItemCard
              index={idx + 1}
              instance={instance}
              item={item}
              disabled={complete}
              busy={busyKey === `${instance.id}:${item.id}`}
              onMark={onMark}
            />
          </li>
        ))}
      </ol>

      <Button
        type="button"
        size="sm"
        className="w-full sm:w-auto"
        disabled={complete || busyKey === `${instance.id}:complete`}
        onClick={() => void onComplete(instance)}
      >
        {busyKey === `${instance.id}:complete` ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Completing…
          </>
        ) : (
          'Complete checklist'
        )}
      </Button>
    </section>
  );
}

function WorkbenchItemCard({
  index,
  instance,
  item,
  disabled,
  busy,
  onMark,
}: {
  index: number;
  instance: ChecklistInstance;
  item: ChecklistInstanceItem;
  disabled: boolean;
  busy: boolean;
  onMark: ChecklistInstanceWorkbenchSheetProps['onMark'];
}) {
  const [comment, setComment] = useState(() => item.comment ?? '');

  const Icon = item.mark === 'DONE' ? CheckCircle2 : item.mark === 'NOT_DONE' ? XCircle : Circle;
  const statusBorder =
    item.mark === 'DONE'
      ? 'border-l-emerald-500'
      : item.mark === 'NOT_DONE'
        ? 'border-l-amber-500'
        : 'border-l-muted-foreground/30';

  return (
    <div
      className={cn(
        'border-border bg-card/50 relative overflow-hidden rounded-xl border border-l-4 shadow-sm',
        statusBorder,
      )}
    >
      <div className="flex gap-3 p-4">
        <div
          className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums"
          aria-hidden
        >
          {index}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <Icon
              className={cn(
                'mt-0.5 size-4 shrink-0',
                item.mark === 'DONE'
                  ? 'text-emerald-600'
                  : item.mark === 'NOT_DONE'
                    ? 'text-amber-600'
                    : 'text-muted-foreground',
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug font-medium">{item.title}</p>
              {item.instruction ? (
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {item.instruction}
                </p>
              ) : null}
            </div>
          </div>

          {item.decisionRequired ? (
            <div className="flex items-center gap-1.5 rounded-md border border-amber-200/80 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              <Star
                className="size-3.5 shrink-0 fill-amber-400 text-amber-700 dark:fill-amber-500 dark:text-amber-200"
                aria-hidden
              />
              <span>Required — must be explicitly reviewed</span>
            </div>
          ) : null}

          <ChecklistItemEvidenceDisplay item={item} />
        </div>
      </div>

      <div className="border-border space-y-2 border-t bg-black/[0.02] px-4 py-3 dark:bg-white/[0.02]">
        <Textarea
          className="min-h-14 resize-y text-xs"
          placeholder="Comment or Not Done reason"
          value={comment}
          disabled={disabled}
          onChange={(event) => setComment(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || busy}
            onClick={() => void onMark(instance, item, 'DONE', comment)}
          >
            Done
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || busy}
            onClick={() => void onMark(instance, item, 'NOT_DONE', comment)}
          >
            Not Done
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled || busy}
            onClick={() => void onMark(instance, item, 'PENDING')}
          >
            Pending
          </Button>
        </div>
      </div>
    </div>
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
