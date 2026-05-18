'use client';

import { useMemo, useState } from 'react';
import { Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DriveCleanupCandidateCategory } from '@/lib/api/drive';
import { DRIVE_CLEANUP_APPLY_ALL_KINDS, cleanupApplyAllLabel } from './drive-cleanup-ui';

export function DriveCleanupReviewSection({
  busy,
  categories,
  onApply,
  onApplyAll,
}: {
  busy: boolean;
  categories: DriveCleanupCandidateCategory[];
  onApply: (kind: string, ids: string[]) => void;
  onApplyAll: (kind: string) => void;
}) {
  const activeCategories = useMemo(
    () => categories.filter((category) => category.count > 0),
    [categories],
  );
  const [selectedByKind, setSelectedByKind] = useState<Record<string, string[]>>({});

  const cleanupTotal = activeCategories.reduce((sum, row) => sum + row.count, 0);

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
        {cleanupTotal} item(s) across {activeCategories.length} categories. Select items, then
        confirm apply — nothing is deleted until you click Apply.
      </p>
      <ul className="max-h-52 space-y-2 overflow-y-auto">
        {activeCategories.map((category) => {
          const selected = selectedByKind[category.kind] ?? [];
          const previewIds = category.preview.map((item) => item.id);
          const supportsApplyAll = DRIVE_CLEANUP_APPLY_ALL_KINDS.has(category.kind);

          return (
            <li key={category.kind} className="bg-muted/30 rounded-lg px-2 py-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground text-xs font-medium">{category.label}</span>
                <span className="text-muted-foreground text-xs">{category.count}</span>
              </div>
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
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={checked}
                            disabled={busy}
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
                  variant="outline"
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
