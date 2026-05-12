'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES,
  type ChecklistTemplateItem,
  type ChecklistTemplateItemEvidenceType,
} from '@/lib/api/checklist-templates';
import {
  CHECKLIST_DRAFT_PICKABLE_EVIDENCE_TYPES,
  CHECKLIST_EVIDENCE_TYPE_SELECT_MAX_WIDTH_REM,
  CHECKLIST_EVIDENCE_UPLOAD_TYPES,
  EVIDENCE_LONG_LABEL,
  EVIDENCE_SHORT_LABEL,
  EvidenceTypeIcon,
} from './checklist-draft-evidence-ui';
import { ChecklistDraftEvidenceFileField } from './checklist-draft-evidence-file-field';
import { isHttpUrlString } from '@/features/checklist/checklist-evidence-value';

const CONFIRM_REMOVE_CHECKLIST_ITEM =
  'Delete this checklist step? This cannot be undone after you save the draft.';

const DECISION_REQUIRED_TOOLTIP =
  'Specialist must choose Done or Not Done on this item before the checklist can be completed. Not Done needs a comment.';

type Props = {
  item: ChecklistTemplateItem;
  templateId: string;
  disabled: boolean;
  onPatch: (patch: Partial<ChecklistTemplateItem>) => void;
  onRemove: () => void;
};

function applyEvidenceTypeChange(
  next: ChecklistTemplateItemEvidenceType,
): Partial<ChecklistTemplateItem> {
  const patch: Partial<ChecklistTemplateItem> = { evidenceType: next };
  if (next === 'TEXT_ONLY') {
    patch.evidenceValue = null;
    patch.evidenceLabel = null;
  } else if (next === 'FREE_TEXT') {
    patch.evidenceValue = null;
  } else {
    patch.evidenceLabel = null;
  }
  return patch;
}

export function ChecklistDraftSortableItem({
  item,
  templateId,
  disabled,
  onPatch,
  onRemove,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const needsLink = CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES.has(item.evidenceType);
  const needsUploadEvidence = CHECKLIST_EVIDENCE_UPLOAD_TYPES.has(item.evidenceType);
  const needsTextLink = needsLink && !needsUploadEvidence;
  const showFreeTextLabel = item.evidenceType === 'FREE_TEXT';

  const evidenceSelectOptions: ChecklistTemplateItemEvidenceType[] = [
    ...CHECKLIST_DRAFT_PICKABLE_EVIDENCE_TYPES,
    ...(['TASK_LINK', 'IMAGE_LINK', 'DOCUMENT_LINK'].includes(item.evidenceType) &&
    !CHECKLIST_DRAFT_PICKABLE_EVIDENCE_TYPES.includes(item.evidenceType)
      ? [item.evidenceType]
      : []),
  ];

  return (
    <div
      ref={setNodeRef}
      id={`checklist-draft-item-${item.id}`}
      style={style}
      className={
        isDragging
          ? 'border-primary ring-primary/20 bg-card z-10 rounded-lg border-2 p-3 ring-2'
          : ''
      }
    >
      <div className="border-border/80 bg-card space-y-2.5 rounded-lg border p-3 shadow-sm shadow-black/[0.02]">
        <div className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
          <div
            className="min-w-0 shrink-0"
            style={{
              width: `min(100%, ${String(CHECKLIST_EVIDENCE_TYPE_SELECT_MAX_WIDTH_REM)}rem)`,
            }}
          >
            <Select
              value={item.evidenceType}
              disabled={disabled}
              onValueChange={(v) =>
                onPatch(applyEvidenceTypeChange(v as ChecklistTemplateItemEvidenceType))
              }
            >
              <SelectTrigger
                className="border-border/70 bg-background h-9 w-full min-w-0 gap-2 px-2.5"
                aria-label="Step input type"
              >
                <SelectValue>
                  {(value: string | null) => {
                    if (!value) return null;
                    const t = value as ChecklistTemplateItemEvidenceType;
                    return (
                      <span className="flex min-w-0 items-center gap-2">
                        <EvidenceTypeIcon
                          type={t}
                          className="text-muted-foreground size-3.5 shrink-0"
                        />
                        <span className="truncate text-sm font-medium">
                          {EVIDENCE_SHORT_LABEL[t] ?? value}
                        </span>
                      </span>
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger>
                {evidenceSelectOptions.map((t) => (
                  <SelectItem
                    key={t}
                    value={t}
                    className="items-start [&>span]:min-w-0 [&>span]:items-start [&>span]:whitespace-normal"
                  >
                    <span className="flex items-start gap-2.5 py-0.5">
                      <EvidenceTypeIcon
                        type={t}
                        className="text-muted-foreground mt-0.5 size-4 shrink-0"
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm leading-tight font-medium">
                          {EVIDENCE_SHORT_LABEL[t]}
                        </span>
                        <span className="text-muted-foreground text-[0.6875rem] leading-snug whitespace-normal">
                          {EVIDENCE_LONG_LABEL[t]}
                        </span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex shrink-0 items-center self-center">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:bg-muted/60 h-9 w-11 shrink-0 cursor-grab touch-none rounded-lg px-0 active:cursor-grabbing"
              disabled={disabled}
              aria-label="Reorder item"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4 rotate-90" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`checklist-item-title-${item.id}`} className="text-xs">
            Title
          </Label>
          <Input
            id={`checklist-item-title-${item.id}`}
            value={item.title}
            disabled={disabled}
            className="h-9 text-sm"
            onChange={(e) => onPatch({ title: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`checklist-item-instruction-${item.id}`} className="text-xs">
            Instruction
          </Label>
          <Textarea
            id={`checklist-item-instruction-${item.id}`}
            value={item.instruction}
            disabled={disabled}
            rows={2}
            className="min-h-[4.25rem] resize-y text-sm"
            onChange={(e) => onPatch({ instruction: e.target.value })}
          />
        </div>
        {needsUploadEvidence ? (
          <div className="space-y-3">
            {item.evidenceValue && isHttpUrlString(item.evidenceValue) ? (
              <div className="space-y-1.5">
                <Label
                  htmlFor={`checklist-item-evidence-legacy-url-${item.id}`}
                  className="text-xs"
                >
                  External link (legacy)
                </Label>
                <Input
                  id={`checklist-item-evidence-legacy-url-${item.id}`}
                  value={item.evidenceValue}
                  disabled={disabled}
                  className="h-9 text-sm"
                  placeholder="https://…"
                  onChange={(e) => onPatch({ evidenceValue: e.target.value || null })}
                />
                <p className="text-muted-foreground text-[11px] leading-snug">
                  Upload a file below to store it in Drive instead of an external URL.
                </p>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label className="text-xs">Attachment</Label>
              <ChecklistDraftEvidenceFileField
                itemId={item.id}
                templateId={templateId}
                evidenceType={item.evidenceType as 'FILE_LINK' | 'IMAGE_LINK' | 'DOCUMENT_LINK'}
                value={item.evidenceValue}
                disabled={disabled}
                onChange={(next) => onPatch({ evidenceValue: next })}
              />
            </div>
          </div>
        ) : null}
        {needsTextLink ? (
          <div className="space-y-1.5">
            <Label htmlFor={`checklist-item-evidence-url-${item.id}`} className="text-xs">
              Link or reference
            </Label>
            <Input
              id={`checklist-item-evidence-url-${item.id}`}
              value={item.evidenceValue ?? ''}
              disabled={disabled}
              className="h-9 text-sm"
              placeholder="https://…"
              onChange={(e) => onPatch({ evidenceValue: e.target.value || null })}
            />
          </div>
        ) : null}
        {showFreeTextLabel ? (
          <div className="space-y-1.5">
            <Label htmlFor={`checklist-item-evidence-label-${item.id}`} className="text-xs">
              Answer field label
            </Label>
            <Input
              id={`checklist-item-evidence-label-${item.id}`}
              value={item.evidenceLabel ?? ''}
              disabled={disabled}
              className="h-9 text-sm"
              placeholder="e.g. Paste client response"
              onChange={(e) => onPatch({ evidenceLabel: e.target.value || null })}
            />
          </div>
        ) : null}
        <div className="border-border/50 flex flex-wrap items-center justify-between gap-3 border-t pt-2">
          <div className="flex min-w-0 items-center gap-2">
            <Checkbox
              id={`checklist-item-review-${item.id}`}
              checked={item.decisionRequired}
              disabled={disabled}
              onCheckedChange={(checked) => onPatch({ decisionRequired: checked === true })}
            />
            <Label
              htmlFor={`checklist-item-review-${item.id}`}
              className="text-muted-foreground cursor-pointer text-xs font-normal"
              title={DECISION_REQUIRED_TOOLTIP}
            >
              Required
            </Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 gap-1.5 text-xs"
            onClick={() => {
              if (window.confirm(CONFIRM_REMOVE_CHECKLIST_ITEM)) {
                onRemove();
              }
            }}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Remove step
          </Button>
        </div>
      </div>
    </div>
  );
}
