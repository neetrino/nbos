'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ChecklistTemplateItem } from '@/lib/api/checklist-templates';

const CHECKLIST_TEMPLATE_MAX_ITEMS = 200;

type Props = {
  items: ChecklistTemplateItem[];
  disabled: boolean;
  onChange: (next: ChecklistTemplateItem[]) => void;
};

function reorder(
  items: ChecklistTemplateItem[],
  from: number,
  to: number,
): ChecklistTemplateItem[] {
  const copy = [...items];
  const [removed] = copy.splice(from, 1);
  if (!removed) {
    return items;
  }
  copy.splice(to, 0, removed);
  return copy.map((row, index) => ({ ...row, sortOrder: index }));
}

export function ChecklistDraftItemsEditor({ items, disabled, onChange }: Props) {
  function addItem() {
    if (items.length >= CHECKLIST_TEMPLATE_MAX_ITEMS) {
      return;
    }
    const nextSort = items.length;
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        title: 'New item',
        instruction: '',
        decisionRequired: false,
        sortOrder: nextSort,
      },
    ]);
  }

  function updateItem(index: number, patch: Partial<ChecklistTemplateItem>) {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index).map((row, i) => ({ ...row, sortOrder: i })));
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= items.length) {
      return;
    }
    onChange(reorder(items, index, next));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Draft items ({items.length}/{CHECKLIST_TEMPLATE_MAX_ITEMS}). Order is saved top-to-bottom.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || items.length >= CHECKLIST_TEMPLATE_MAX_ITEMS}
          onClick={addItem}
        >
          <Plus className="mr-1 size-4" />
          Add item
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No items yet. Add the first checklist step.
          </p>
        ) : null}
        {items.map((row, index) => (
          <div key={row.id} className="border-border bg-card space-y-3 rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={disabled || index === 0}
                onClick={() => move(index, -1)}
                aria-label="Move item up"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={disabled || index === items.length - 1}
                onClick={() => move(index, 1)}
                aria-label="Move item down"
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive size-8"
                disabled={disabled}
                onClick={() => removeItem(index)}
                aria-label="Remove item"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`checklist-item-title-${row.id}`}>Title</Label>
              <Input
                id={`checklist-item-title-${row.id}`}
                value={row.title}
                disabled={disabled}
                onChange={(e) => updateItem(index, { title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`checklist-item-instruction-${row.id}`}>Instruction</Label>
              <Textarea
                id={`checklist-item-instruction-${row.id}`}
                value={row.instruction}
                disabled={disabled}
                rows={3}
                onChange={(e) => updateItem(index, { instruction: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`checklist-item-review-${row.id}`}
                checked={row.decisionRequired}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  updateItem(index, { decisionRequired: checked === true })
                }
              />
              <Label htmlFor={`checklist-item-review-${row.id}`} className="font-normal">
                Must review (decision required)
              </Label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
