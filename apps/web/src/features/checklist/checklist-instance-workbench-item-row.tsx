'use client';

import { useState, type KeyboardEvent } from 'react';
import { ChevronDown, Sparkles, XCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import type {
  ChecklistInstance,
  ChecklistInstanceItem,
  ChecklistInstanceItemMark,
} from '@/lib/api/checklist-templates';
import { cn } from '@/lib/utils';
import {
  ChecklistEvidenceCollapsedHints,
  ChecklistEvidenceWorkbenchGrid,
} from '@/features/checklist/checklist-evidence-workbench-grid';

export type ChecklistWorkbenchMarkHandler = (
  instance: ChecklistInstance,
  item: ChecklistInstanceItem,
  mark: ChecklistInstanceItemMark,
  comment?: string,
) => Promise<void>;

function useChecklistItemMarkUi(
  instance: ChecklistInstance,
  item: ChecklistInstanceItem,
  disabled: boolean,
  busy: boolean,
  onMark: ChecklistWorkbenchMarkHandler,
) {
  const [notDoneArm, setNotDoneArm] = useState(false);
  const [comment, setComment] = useState(() => item.comment ?? '');
  const showNotDoneField = item.mark === 'NOT_DONE' || notDoneArm;
  const doneChecked = item.mark === 'DONE';
  const notDoneActive = item.mark === 'NOT_DONE';

  const submitNotDone = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    void onMark(instance, item, 'NOT_DONE', trimmed);
    setNotDoneArm(false);
  };

  const onDoneToggle = (checked: boolean) => {
    if (disabled || busy) return;
    setNotDoneArm(false);
    if (checked) void onMark(instance, item, 'DONE');
    else void onMark(instance, item, 'PENDING');
  };

  const onNotDoneToggle = () => {
    if (disabled || busy) return;
    if (notDoneActive) {
      void onMark(instance, item, 'PENDING');
      setNotDoneArm(false);
      return;
    }
    if (notDoneArm) {
      if (comment.trim()) {
        submitNotDone();
        return;
      }
      setNotDoneArm(false);
      return;
    }
    setNotDoneArm(true);
  };

  const onNotDoneBlur = () => {
    if (disabled || busy || item.mark !== 'NOT_DONE') return;
    const next = comment.trim();
    const prev = (item.comment ?? '').trim();
    if (next && next !== prev) void onMark(instance, item, 'NOT_DONE', next);
  };

  const onNotDoneKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    if (!notDoneArm || item.mark === 'NOT_DONE') return;
    if (!comment.trim()) return;
    event.preventDefault();
    submitNotDone();
  };

  return {
    comment,
    setComment,
    showNotDoneField,
    doneChecked,
    notDoneActive,
    notDoneArm,
    onDoneToggle,
    onNotDoneToggle,
    onNotDoneBlur,
    onNotDoneKeyDown,
  };
}

export function ChecklistWorkbenchItemRow({
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
  onMark: ChecklistWorkbenchMarkHandler;
}) {
  const [expanded, setExpanded] = useState(false);
  const ui = useChecklistItemMarkUi(instance, item, disabled, busy, onMark);

  return (
    <div
      className={cn(
        'border-border overflow-hidden rounded-lg border bg-white/40 dark:bg-black/10',
        ui.notDoneActive && 'border-amber-500/40',
        ui.doneChecked && 'border-emerald-500/35',
      )}
    >
      <Collapsible open={expanded} onOpenChange={setExpanded} className="min-w-0">
        <div className="flex min-h-[2.75rem] items-center gap-1.5 px-2 py-2">
          <Checkbox
            checked={ui.doneChecked}
            disabled={disabled || busy}
            onCheckedChange={(v) => ui.onDoneToggle(v === true)}
            onClick={(event) => event.stopPropagation()}
            className="size-5 shrink-0 rounded-[5px] border-2 data-checked:border-emerald-600 data-checked:bg-emerald-600 data-checked:text-white"
            aria-label={ui.doneChecked ? 'Clear done' : 'Mark done'}
          />
          <CollapsibleTrigger
            type="button"
            disabled={disabled}
            className="hover:bg-muted/40 flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 pr-1 pl-0.5 text-left transition-colors outline-none select-none disabled:opacity-50"
          >
            <ChevronDown
              className={cn(
                'text-muted-foreground size-3.5 shrink-0 transition-transform',
                expanded && 'rotate-180',
              )}
              aria-hidden
            />
            <span className="text-muted-foreground w-4 shrink-0 text-center text-[10px] tabular-nums">
              {index}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
            {item.decisionRequired ? (
              <Sparkles
                className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                strokeWidth={2}
                aria-label="Required"
              />
            ) : null}
            <span className="flex shrink-0 items-center gap-1">
              <ChecklistEvidenceCollapsedHints item={item} />
            </span>
          </CollapsibleTrigger>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={(event) => {
              event.stopPropagation();
              ui.onNotDoneToggle();
            }}
            className={cn(
              'text-muted-foreground hover:bg-muted/60 flex size-8 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-40',
              ui.notDoneActive && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
              ui.notDoneArm && !ui.notDoneActive && 'ring-1 ring-amber-500/40',
            )}
            aria-label={
              ui.notDoneActive ? 'Clear not done' : ui.notDoneArm ? 'Save not done' : 'Not done'
            }
            title={
              ui.notDoneActive
                ? 'Clear not done'
                : ui.notDoneArm
                  ? 'Save not done (or Enter in comment)'
                  : 'Not done'
            }
          >
            <XCircle className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <CollapsibleContent className="border-border border-t px-3 pb-2.5">
          {item.instruction ? (
            <p className="text-muted-foreground py-2 text-xs leading-relaxed">{item.instruction}</p>
          ) : null}
          <ChecklistEvidenceWorkbenchGrid item={item} />
        </CollapsibleContent>
      </Collapsible>

      {ui.showNotDoneField ? (
        <div className="border-border border-t px-3 py-2">
          <Textarea
            className="min-h-[4.5rem] resize-y text-xs"
            placeholder="Comment or Not Done reason"
            value={ui.comment}
            disabled={disabled}
            onChange={(e) => ui.setComment(e.target.value)}
            onBlur={ui.onNotDoneBlur}
            onKeyDown={ui.onNotDoneKeyDown}
          />
        </div>
      ) : null}
    </div>
  );
}
