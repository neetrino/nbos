'use client';

import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import {
  CHECKLIST_OWNER_MODULE_LABELS,
  CHECKLIST_TEMPLATE_CATEGORY_LABELS,
} from '@/features/checklist/checklist-template-form-labels';
import type { ChecklistTemplateListItem } from '@/lib/api/checklist-templates';
import { cn } from '@/lib/utils';

const STATUS_VARIANT = {
  ACTIVE: 'green',
  DRAFT: 'blue',
  ARCHIVED: 'gray',
} as const;

function statusVariant(status: string): 'green' | 'gray' | 'blue' {
  if (status === 'ACTIVE' || status === 'ARCHIVED' || status === 'DRAFT') {
    return STATUS_VARIANT[status];
  }
  return 'blue';
}

function versionLabel(row: ChecklistTemplateListItem): string {
  if (row.activeVersion) return `Published v${row.activeVersion.versionNumber}`;
  return 'Not published';
}

export function ChecklistTemplateCard({ row }: { row: ChecklistTemplateListItem }) {
  return (
    <li className="flex min-w-0">
      <Link
        href={`/my-company/checklist-templates/${row.id}`}
        className={cn(
          'border-border bg-card hover:border-primary/40 flex h-full w-full min-w-0 flex-col gap-3 rounded-2xl border p-4 text-left transition-colors',
          row.status === 'ARCHIVED' && 'opacity-70',
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
            <ListChecks className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{row.name}</p>
              <StatusBadge
                label={row.status}
                variant={statusVariant(row.status)}
                className="shrink-0"
              />
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {CHECKLIST_TEMPLATE_CATEGORY_LABELS[row.category]}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground line-clamp-2 min-h-8 text-xs leading-relaxed">
          {row.description?.trim() || 'No description yet.'}
        </p>
        <p className="text-muted-foreground mt-auto text-xs">
          {CHECKLIST_OWNER_MODULE_LABELS[row.ownerModule]} · {versionLabel(row)}
        </p>
      </Link>
    </li>
  );
}
