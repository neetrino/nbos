'use client';

import { useMemo } from 'react';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChecklistTemplateItem } from '@/lib/api/checklist-templates';
import { ChecklistDraftSortableItem } from './checklist-draft-sortable-item';

const CHECKLIST_TEMPLATE_MAX_ITEMS = 200;

const POINTER_ACTIVATION_PX = 8;

type Props = {
  items: ChecklistTemplateItem[];
  disabled: boolean;
  onChange: (next: ChecklistTemplateItem[]) => void;
};

export function ChecklistDraftItemsEditor({ items, disabled, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_PX } }),
  );

  const ids = useMemo(() => items.map((row) => row.id), [items]);

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
        evidenceType: 'TEXT_ONLY',
        evidenceValue: null,
        evidenceLabel: null,
      },
    ]);
  }

  function patchItem(index: number, patch: Partial<ChecklistTemplateItem>) {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index).map((row, i) => ({ ...row, sortOrder: i })));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = items.findIndex((row) => row.id === active.id);
    const newIndex = items.findIndex((row) => row.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const next = arrayMove(items, oldIndex, newIndex).map((row, i) => ({ ...row, sortOrder: i }));
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Draft items ({items.length}/{CHECKLIST_TEMPLATE_MAX_ITEMS}). Drag the handle to reorder.
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No items yet. Add the first checklist step.
              </p>
            ) : null}
            {items.map((row, index) => (
              <ChecklistDraftSortableItem
                key={row.id}
                item={row}
                disabled={disabled}
                onPatch={(patch) => patchItem(index, patch)}
                onRemove={() => removeItem(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
