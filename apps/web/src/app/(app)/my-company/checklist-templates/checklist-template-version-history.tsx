'use client';

import { Button } from '@/components/ui/button';
import type { ChecklistTemplateVersionSummary } from '@/lib/api/checklist-templates';

interface ChecklistTemplateVersionHistoryProps {
  versions: ChecklistTemplateVersionSummary[];
  onPreview: (versionId: string, label: string) => void;
}

export function ChecklistTemplateVersionHistory({
  versions,
  onPreview,
}: ChecklistTemplateVersionHistoryProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <p className="text-muted-foreground mb-3 text-sm font-medium">Version history</p>
      <ul className="text-muted-foreground max-h-48 space-y-1 overflow-auto text-xs">
        {versions.map((v) => (
          <li
            key={v.id}
            className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-b border-dashed py-1 last:border-0"
          >
            <span>
              v{v.versionNumber} · {v.status} · {new Date(v.createdAt).toLocaleString()}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 text-xs"
              onClick={() => onPreview(v.id, `v${v.versionNumber} · ${v.status}`)}
            >
              Preview
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
