import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { Task, TaskChecklistItem } from '@/lib/api/tasks';

interface TaskChecklistSectionProps {
  task: Task;
  newChecklistTitle: string;
  newItemTexts: Record<string, string>;
  onNewChecklistTitleChange: (value: string) => void;
  onNewItemTextChange: (checklistId: string, value: string) => void;
  onAddChecklist: () => void;
  onAddItem: (checklistId: string) => void;
  onToggleItem: (checklistId: string, itemId: string) => void;
}

export function TaskChecklistSection({
  task,
  newChecklistTitle,
  newItemTexts,
  onNewChecklistTitleChange,
  onNewItemTextChange,
  onAddChecklist,
  onAddItem,
  onToggleItem,
}: TaskChecklistSectionProps) {
  return (
    <div>
      <h4 className="text-muted-foreground mb-2 text-xs font-medium uppercase">Checklists</h4>
      {task.checklists.map((checklist) => (
        <ChecklistCard
          key={checklist.id}
          checklist={checklist}
          newItemText={newItemTexts[checklist.id] ?? ''}
          onNewItemTextChange={(value) => onNewItemTextChange(checklist.id, value)}
          onAddItem={() => onAddItem(checklist.id)}
          onToggleItem={(itemId) => onToggleItem(checklist.id, itemId)}
        />
      ))}
      <div className="mt-2 flex gap-2">
        <Input
          value={newChecklistTitle}
          onChange={(event) => onNewChecklistTitleChange(event.target.value)}
          placeholder="New checklist title..."
          className="h-8 text-sm"
          onKeyDown={(event) => event.key === 'Enter' && onAddChecklist()}
        />
        <Button size="sm" variant="outline" onClick={onAddChecklist}>
          <Plus size={14} /> Add Checklist
        </Button>
      </div>
    </div>
  );
}

interface ChecklistCardProps {
  checklist: Task['checklists'][number];
  newItemText: string;
  onNewItemTextChange: (value: string) => void;
  onAddItem: () => void;
  onToggleItem: (itemId: string) => void;
}

function ChecklistCard({
  checklist,
  newItemText,
  onNewItemTextChange,
  onAddItem,
  onToggleItem,
}: ChecklistCardProps) {
  const done = checklist.items.filter((item) => item.checked).length;

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium">
          {checklist.title} ({done}/{checklist.items.length})
        </p>
      </div>
      <div className="space-y-1">
        {checklist.items.map((item) => (
          <ChecklistItem key={item.id} item={item} onToggleItem={onToggleItem} />
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={newItemText}
          onChange={(event) => onNewItemTextChange(event.target.value)}
          placeholder="Add item..."
          className="h-8 text-sm"
          onKeyDown={(event) => event.key === 'Enter' && onAddItem()}
        />
        <Button size="sm" variant="ghost" onClick={onAddItem}>
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );
}

function ChecklistItem({
  item,
  onToggleItem,
}: {
  item: TaskChecklistItem;
  onToggleItem: (itemId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={item.checked} onCheckedChange={() => onToggleItem(item.id)} />
      <span className={`text-sm ${item.checked ? 'text-muted-foreground line-through' : ''}`}>
        {item.text}
      </span>
    </div>
  );
}
