'use client';

import { Button } from '@/components/ui/button';
import type { ChecklistTemplateItemEvidenceType } from '@/lib/api/checklist-templates';
import { cn } from '@/lib/utils';
import {
  CHECKLIST_DRAFT_PICKABLE_EVIDENCE_TYPES,
  EVIDENCE_ICON,
  EVIDENCE_MENU_HINT,
} from './checklist-draft-evidence-ui';

type Props = {
  disabled: boolean;
  atMax: boolean;
  onAdd: (evidenceType: ChecklistTemplateItemEvidenceType) => void;
};

export function ChecklistDraftAddEvidenceBar({ disabled, atMax, onAdd }: Props) {
  const blocked = disabled || atMax;

  return (
    <div className="border-border/80 bg-muted/40 rounded-xl border border-dashed p-4">
      <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        Add checklist step
      </p>
      <p className="text-muted-foreground mb-3 text-sm">
        Choose the evidence shape for the next step. It is added at the bottom; use the handle to
        reorder.
      </p>
      <div className="flex flex-wrap gap-2">
        {CHECKLIST_DRAFT_PICKABLE_EVIDENCE_TYPES.map((type) => {
          const Icon = EVIDENCE_ICON[type];
          return (
            <Button
              key={type}
              type="button"
              variant="secondary"
              size="icon"
              disabled={blocked}
              className={cn('size-10 rounded-lg shadow-sm', blocked && 'opacity-50')}
              title={EVIDENCE_MENU_HINT[type]}
              aria-label={EVIDENCE_MENU_HINT[type]}
              onClick={() => onAdd(type)}
            >
              <Icon className="size-4" aria-hidden />
            </Button>
          );
        })}
      </div>
      {atMax ? (
        <p className="text-muted-foreground mt-3 text-xs">Maximum number of items reached.</p>
      ) : null}
    </div>
  );
}
