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
  /** Open list for a sheet tab, without the collapsible card. */
  plain?: boolean;
}

export function ChecklistTemplateVersionHistory({
  versions,
  onPreview,
  plain = false,
}: ChecklistTemplateVersionHistoryProps) {
  const [open, setOpen] = useState(false);
  if (plain) {
    return <VersionList versions={versions} onPreview={onPreview} />;
  }
  const latest = versions[0];

  return (
    <div className="border-border bg-card rounded-2xl border">
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
          <VersionList versions={versions} onPreview={onPreview} compact />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function VersionList({
  versions,
  onPreview,
  compact = false,
}: {
  versions: ChecklistTemplateVersionSummary[];
  onPreview: (versionId: string, label: string) => void;
  compact?: boolean;
}) {
  return (
    <ul className={cn('flex flex-col gap-1', compact && 'max-h-52 overflow-auto')}>
      {versions.map((version) => (
        <li key={version.id} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
          <span className="text-primary w-8 shrink-0 text-xs font-semibold tabular-nums">
            v{version.versionNumber}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-medium">
              {new Date(version.createdAt).toLocaleString()}
            </p>
          </div>
          <StatusBadge label={version.status} variant={versionStatusVariant(version.status)} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 text-xs"
            onClick={() => onPreview(version.id, `v${version.versionNumber} · ${version.status}`)}
          >
            Preview
          </Button>
        </li>
      ))}
    </ul>
  );
}
