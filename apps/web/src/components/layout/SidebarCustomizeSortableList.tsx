'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EyeOff, GripVertical } from 'lucide-react';
import { SIDEBAR_MODULE_KEYS_NON_HIDABLE, type SidebarModuleKey } from '@nbos/shared/constants';
import type { NavModuleDefinition } from '@/lib/navigation/nav-config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SidebarModuleIcon } from './SidebarModuleIcon';

type SidebarCustomizeSortableListProps = {
  items: NavModuleDefinition[];
  isSaving: boolean;
  onReorder: (keys: SidebarModuleKey[]) => void;
  onHide: (key: SidebarModuleKey) => void;
};

export function SidebarCustomizeSortableList({
  items,
  isSaving,
  onReorder,
  onHide,
}: SidebarCustomizeSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const itemKeys = items.map((item) => item.key);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = itemKeys.indexOf(active.id as SidebarModuleKey);
    const newIndex = itemKeys.indexOf(over.id as SidebarModuleKey);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(itemKeys, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemKeys} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1.5">
          {items.map((item) => (
            <SortableModuleRow
              key={item.key}
              item={item}
              isSaving={isSaving}
              canHide={!SIDEBAR_MODULE_KEYS_NON_HIDABLE.includes(item.key)}
              onHide={() => onHide(item.key)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableModuleRow({
  item,
  isSaving,
  canHide,
  onHide,
}: {
  item: NavModuleDefinition;
  isSaving: boolean;
  canHide: boolean;
  onHide: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.key,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border-border/70 flex items-center gap-2 rounded-lg border px-2 py-2 shadow-sm',
        isDragging && 'opacity-60',
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none rounded p-1 active:cursor-grabbing"
        aria-label={`Drag to reorder ${item.label}`}
        disabled={isSaving}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <SidebarModuleIcon moduleKey={item.key} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
      {canHide && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isSaving}
          aria-label={`Hide ${item.label}`}
          onClick={onHide}
        >
          <EyeOff size={16} />
        </Button>
      )}
    </li>
  );
}
