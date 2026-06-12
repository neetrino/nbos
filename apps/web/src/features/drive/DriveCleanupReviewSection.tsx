'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Eraser, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DriveCleanupCandidateCategory } from '@/lib/api/drive';
import {
  DRIVE_CLEANUP_APPLY_ALL_KINDS,
  DRIVE_CLEANUP_DANGER_KINDS,
  cleanupApplyAllLabel,
  cleanupCategoryDescription,
} from './drive-cleanup-ui';

export function DriveCleanupReviewSection({
  busy,
  canApply,
  categories,
  selectionResetKey = 0,
  onApply,
  onApplyAll,
}: {
  busy: boolean;
  canApply: boolean;
  categories: DriveCleanupCandidateCategory[];
  selectionResetKey?: number;
  onApply: (kind: string, ids: string[]) => void;
  onApplyAll: (kind: string) => void;
}) {
  const activeCategories = useMemo(
    () => categories.filter((category) => category.count > 0),
    [categories],
  );
  const [selectedByKind, setSelectedByKind] = useState<Record<string, string[]>>({});
  const [trackedResetKey, setTrackedResetKey] = useState(selectionResetKey);

  if (trackedResetKey !== selectionResetKey) {
    setTrackedResetKey(selectionResetKey);
    setSelectedByKind({});
  }

  const cleanupTotal = activeCategories.reduce((sum, row) => sum + row.count, 0);
  const dangerTotal = activeCategories
    .filter((row) => DRIVE_CLEANUP_DANGER_KINDS.has(row.kind))
    .reduce((sum, row) => sum + row.count, 0);

  function toggleId(kind: string, id: string) {
    setSelectedByKind((prev) => {
      const current = new Set(prev[kind] ?? []);
      if (current.has(id)) current.delete(id);
      else current.add(id);
      return { ...prev, [kind]: [...current] };
    });
  }

  function selectAllInCategory(kind: string, ids: string[]) {
    setSelectedByKind((prev) => ({ ...prev, [kind]: ids }));
  }

  if (cleanupTotal === 0) {
    return <p className="text-muted-foreground text-xs">No cleanup candidates right now.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        {cleanupTotal} item(s) across {activeCategories.length} categories.
        {canApply
          ? ' Select items, then confirm apply — nothing is deleted until you click Apply.'
          : ' Review only — apply requires Drive DELETE permission.'}
      </p>
      {dangerTotal > 0 ? (
        <p className="text-destructive flex items-start gap-1.5 text-[11px]">
          <ShieldAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span>
            {dangerTotal} item(s) in permanent-purge categories. Confirm carefully before apply.
          </span>
        </p>
      ) : null}
      <ul className="max-h-52 space-y-2 overflow-y-auto">
        {activeCategories.map((category) => {
          const selected = selectedByKind[category.kind] ?? [];
          const previewIds = category.preview.map((item) => item.id);
          const supportsApplyAll = DRIVE_CLEANUP_APPLY_ALL_KINDS.has(category.kind);
          const isDanger = DRIVE_CLEANUP_DANGER_KINDS.has(category.kind);
          const description = cleanupCategoryDescription(category.kind);

          return (
            <li
              key={category.kind}
              className={cn(
                'rounded-lg px-2 py-1.5',
                isDanger ? 'border-destructive/25 bg-destructive/5 border' : 'bg-muted/30',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground flex items-center gap-1 text-xs font-medium">
                  {isDanger ? (
                    <AlertTriangle className="text-destructive size-3 shrink-0" aria-hidden />
                  ) : null}
                  {category.label}
                </span>
                <span className="text-muted-foreground text-xs">{category.count}</span>
              </div>
              {description ? (
                <p
                  className={cn(
                    'mt-0.5 text-[11px]',
                    isDanger ? 'text-destructive/90' : 'text-muted-foreground',
                  )}
                >
                  {description}
                </p>
              ) : null}
              {category.preview.length > 0 ? (
                <ul className="mt-1 space-y-0.5">
                  {category.preview.map((item) => {
                    const checked = selected.includes(item.id);
                    return (
                      <li key={`${category.kind}:${item.id}`}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 text-[11px]',
                            checked && 'bg-primary/10',
                            !canApply && 'cursor-default opacity-80',
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={checked}
                            disabled={busy || !canApply}
                            onChange={() => toggleId(category.kind, item.id)}
                          />
                          <span className="text-muted-foreground min-w-0 flex-1 truncate">
                            <span className="text-foreground">{item.label}</span>
                            {item.detail ? ` · ${item.detail}` : ''}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {canApply ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {previewIds.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px]"
                      disabled={busy}
                      onClick={() => selectAllInCategory(category.kind, previewIds)}
                    >
                      Select preview
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant={isDanger ? 'destructive' : 'outline'}
                    size="sm"
                    className="h-7 gap-1 text-[11px]"
                    disabled={busy || selected.length === 0}
                    onClick={() => onApply(category.kind, selected)}
                  >
                    <Eraser className="size-3" aria-hidden />
                    Apply selected ({selected.length})
                  </Button>
                  {supportsApplyAll ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      disabled={busy}
                      onClick={() => onApplyAll(category.kind)}
                    >
                      {cleanupApplyAllLabel(category.kind)}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
