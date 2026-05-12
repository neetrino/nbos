'use client';

import { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StatusBadge } from '@/components/shared';
import type { ChecklistTemplateVersionSummary } from '@/lib/api/checklist-templates';
import { cn } from '@/lib/utils';

function versionStatusVariant(
  status: string,
): 'default' | 'green' | 'gray' | 'blue' | 'amber' | 'red' {
  const s = status.toUpperCase();
  if (s === 'PUBLISHED') return 'green';
  if (s === 'DRAFT') return 'blue';
  return 'gray';
}

interface ChecklistTemplateVersionHistoryProps {
  versions: ChecklistTemplateVersionSummary[];
  onPreview: (versionId: string, label: string) => void;
}

export function ChecklistTemplateVersionHistory({
  versions,
  onPreview,
}: ChecklistTemplateVersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const latest = versions[0];

  return (
    <div className="border-border/80 bg-card rounded-2xl border shadow-sm shadow-black/[0.03]">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left outline-none select-none">
          <span className="flex min-w-0 items-center gap-2">
            <History className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="text-foreground block text-sm font-semibold">Version history</span>
              <span className="text-muted-foreground block truncate text-xs">
                {versions.length} snapshot{versions.length === 1 ? '' : 's'}
                {latest
                  ? ` · latest v${latest.versionNumber} (${latest.status.toLowerCase()})`
                  : ''}
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-border/60 border-t px-4 pb-3">
          <p className="text-muted-foreground py-2 text-xs leading-relaxed">
            Publishing keeps immutable snapshots for Delivery rules and checklist instances. Keep
            this list for traceability; collapse it when you focus on editing the draft.
          </p>
          <ul className="text-muted-foreground max-h-52 space-y-1 overflow-auto text-xs">
            {versions.map((v) => (
              <li
                key={v.id}
                className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-b border-dashed py-1.5 last:border-0"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span>
                    v{v.versionNumber} · {new Date(v.createdAt).toLocaleString()}
                  </span>
                  <StatusBadge label={v.status} variant={versionStatusVariant(v.status)} />
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(v.id, `v${v.versionNumber} · ${v.status}`);
                  }}
                >
                  Preview
                </Button>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
