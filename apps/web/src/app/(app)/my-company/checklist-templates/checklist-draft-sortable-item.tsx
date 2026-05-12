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
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES,
  CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES,
  type ChecklistTemplateItem,
  type ChecklistTemplateItemEvidenceType,
} from '@/lib/api/checklist-templates';

const EVIDENCE_TYPE_LABELS: Record<ChecklistTemplateItemEvidenceType, string> = {
  TEXT_ONLY: 'Text instruction only',
  URL: 'URL',
  FILE_LINK: 'File (link)',
  IMAGE_LINK: 'Image (link)',
  VIDEO_LINK: 'Video (link)',
  DOCUMENT_LINK: 'PDF / document (link)',
  CREDENTIAL_LINK: 'Credential link',
  TASK_LINK: 'Task link',
  FREE_TEXT: 'Free text answer',
};

type Props = {
  item: ChecklistTemplateItem;
  disabled: boolean;
  onPatch: (patch: Partial<ChecklistTemplateItem>) => void;
  onRemove: () => void;
};

export function ChecklistDraftSortableItem({ item, disabled, onPatch, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const needsLink = CHECKLIST_TEMPLATE_ITEM_EVIDENCE_LINKING_TYPES.has(item.evidenceType);
  const showFreeTextLabel = item.evidenceType === 'FREE_TEXT';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? 'border-primary ring-primary/20 bg-card z-10 rounded-xl border-2 p-4 ring-2'
          : ''
      }
    >
      <div className="border-border bg-card space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-8 cursor-grab touch-none active:cursor-grabbing"
            disabled={disabled}
            aria-label="Reorder item"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive size-8"
            disabled={disabled}
            onClick={onRemove}
            aria-label="Remove item"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`checklist-item-title-${item.id}`}>Title</Label>
          <Input
            id={`checklist-item-title-${item.id}`}
            value={item.title}
            disabled={disabled}
            onChange={(e) => onPatch({ title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`checklist-item-instruction-${item.id}`}>Instruction</Label>
          <Textarea
            id={`checklist-item-instruction-${item.id}`}
            value={item.instruction}
            disabled={disabled}
            rows={3}
            onChange={(e) => onPatch({ instruction: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Evidence / input type</Label>
          <Select
            value={item.evidenceType}
            disabled={disabled}
            onValueChange={(v) => {
              const next = v as ChecklistTemplateItemEvidenceType;
              const patch: Partial<ChecklistTemplateItem> = { evidenceType: next };
              if (next === 'TEXT_ONLY') {
                patch.evidenceValue = null;
                patch.evidenceLabel = null;
              } else if (next === 'FREE_TEXT') {
                patch.evidenceValue = null;
              } else {
                patch.evidenceLabel = null;
              }
              onPatch(patch);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {EVIDENCE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {needsLink ? (
          <div className="space-y-2">
            <Label htmlFor={`checklist-item-evidence-url-${item.id}`}>Link or reference</Label>
            <Input
              id={`checklist-item-evidence-url-${item.id}`}
              value={item.evidenceValue ?? ''}
              disabled={disabled}
              placeholder="https://…"
              onChange={(e) => onPatch({ evidenceValue: e.target.value || null })}
            />
          </div>
        ) : null}
        {showFreeTextLabel ? (
          <div className="space-y-2">
            <Label htmlFor={`checklist-item-evidence-label-${item.id}`}>Answer field label</Label>
            <Input
              id={`checklist-item-evidence-label-${item.id}`}
              value={item.evidenceLabel ?? ''}
              disabled={disabled}
              placeholder="e.g. Paste client response"
              onChange={(e) => onPatch({ evidenceLabel: e.target.value || null })}
            />
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Checkbox
            id={`checklist-item-review-${item.id}`}
            checked={item.decisionRequired}
            disabled={disabled}
            onCheckedChange={(checked) => onPatch({ decisionRequired: checked === true })}
          />
          <Label htmlFor={`checklist-item-review-${item.id}`} className="font-normal">
            Must review (decision required)
          </Label>
        </div>
      </div>
    </div>
  );
}
