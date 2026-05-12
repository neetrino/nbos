'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ClipboardList } from 'lucide-react';
import type {
  ChecklistTemplateItem,
  ChecklistTemplateItemEvidenceType,
} from '@/lib/api/checklist-templates';
import { ChecklistDraftAddEvidenceBar } from './checklist-draft-add-evidence-bar';
import { CHECKLIST_DRAFT_DEFAULT_TITLE_BY_EVIDENCE } from './checklist-draft-default-titles';
import { ChecklistDraftSortableItem } from './checklist-draft-sortable-item';

const CHECKLIST_TEMPLATE_MAX_ITEMS = 200;

const POINTER_ACTIVATION_PX = 8;

type Props = {
  items: ChecklistTemplateItem[];
  disabled: boolean;
  onChange: (next: ChecklistTemplateItem[]) => void;
};

function newItemForEvidence(
  evidenceType: ChecklistTemplateItemEvidenceType,
  sortOrder: number,
): ChecklistTemplateItem {
  return {
    id: crypto.randomUUID(),
    title: CHECKLIST_DRAFT_DEFAULT_TITLE_BY_EVIDENCE[evidenceType],
    instruction: '',
    decisionRequired: false,
    sortOrder,
    evidenceType,
    evidenceValue: null,
    evidenceLabel: evidenceType === 'FREE_TEXT' ? 'Answer' : null,
  };
}

export function ChecklistDraftItemsEditor({ items, disabled, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_PX } }),
  );
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);

  const ids = useMemo(() => items.map((row) => row.id), [items]);

  useEffect(() => {
    if (!scrollToItemId) {
      return;
    }
    const targetId = scrollToItemId;
    requestAnimationFrame(() => {
      document.getElementById(`checklist-draft-item-${targetId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
      setScrollToItemId(null);
    });
  }, [scrollToItemId]);

  function addItemWithEvidence(evidenceType: ChecklistTemplateItemEvidenceType) {
    if (items.length >= CHECKLIST_TEMPLATE_MAX_ITEMS) {
      return;
    }
    const created = newItemForEvidence(evidenceType, items.length);
    onChange([...items, created]);
    setScrollToItemId(created.id);
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

  const atMax = items.length >= CHECKLIST_TEMPLATE_MAX_ITEMS;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-foreground text-base font-semibold tracking-tight">Draft items</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {items.length} / {CHECKLIST_TEMPLATE_MAX_ITEMS} steps · drag the grip to reorder
          </p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="border-border/80 text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm">
                <ClipboardList className="size-8 opacity-40" aria-hidden />
                <p>No steps yet. Add the first one below.</p>
              </div>
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

      <ChecklistDraftAddEvidenceBar
        disabled={disabled}
        atMax={atMax}
        onAdd={(type) => addItemWithEvidence(type)}
      />
    </div>
  );
}
