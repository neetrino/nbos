import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  onDeleteChecklist: (checklistId: string) => void;
  onDeleteItem: (checklistId: string, itemId: string) => void;
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
  onDeleteChecklist,
  onDeleteItem,
}: TaskChecklistSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide">
          <ListChecks size={13} /> Checklists
        </h4>
        <span className="text-muted-foreground text-xs">{task.checklists.length} lists</span>
      </div>

      {task.checklists.length > 0 ? (
        <div className="space-y-3">
          {task.checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              newItemText={newItemTexts[checklist.id] ?? ''}
              onNewItemTextChange={(value) => onNewItemTextChange(checklist.id, value)}
              onAddItem={() => onAddItem(checklist.id)}
              onToggleItem={(itemId) => onToggleItem(checklist.id, itemId)}
              onDeleteChecklist={() => onDeleteChecklist(checklist.id)}
              onDeleteItem={(itemId) => onDeleteItem(checklist.id, itemId)}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-sm">
          No checklist yet.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newChecklistTitle}
          onChange={(event) => onNewChecklistTitleChange(event.target.value)}
          placeholder="New checklist title..."
          className="h-8 text-sm"
          onKeyDown={(event) => event.key === 'Enter' && onAddChecklist()}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={!newChecklistTitle.trim()}
          onClick={onAddChecklist}
        >
          <Plus size={14} /> Add Checklist
        </Button>
      </div>
    </section>
  );
}

interface ChecklistCardProps {
  checklist: Task['checklists'][number];
  newItemText: string;
  onNewItemTextChange: (value: string) => void;
  onAddItem: () => void;
  onToggleItem: (itemId: string) => void;
  onDeleteChecklist: () => void;
  onDeleteItem: (itemId: string) => void;
}

function ChecklistCard({
  checklist,
  newItemText,
  onNewItemTextChange,
  onAddItem,
  onToggleItem,
  onDeleteChecklist,
  onDeleteItem,
}: ChecklistCardProps) {
  const done = checklist.items.filter((item) => item.checked).length;
  const progress =
    checklist.items.length > 0 ? Math.round((done / checklist.items.length) * 100) : 0;

  return (
    <div className="border-border bg-card rounded-lg border p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-medium">
          <span className="break-words">{checklist.title}</span>
          <span className="text-muted-foreground ml-2 text-xs">
            {done}/{checklist.items.length}
          </span>
        </p>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          title="Delete checklist"
          onClick={onDeleteChecklist}
        >
          <Trash2 size={13} />
        </Button>
      </div>
      <Progress value={progress} className="mb-3" />

      <div className="space-y-1.5">
        {checklist.items.length > 0 ? (
          checklist.items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggleItem={onToggleItem}
              onDeleteItem={onDeleteItem}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-xs">No items yet.</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          value={newItemText}
          onChange={(event) => onNewItemTextChange(event.target.value)}
          placeholder="Add item..."
          className="h-8 text-sm"
          onKeyDown={(event) => event.key === 'Enter' && onAddItem()}
        />
        <Button
          size="icon-sm"
          variant="outline"
          title="Add checklist item"
          disabled={!newItemText.trim()}
          onClick={onAddItem}
        >
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );
}

function ChecklistItem({
  item,
  onToggleItem,
  onDeleteItem,
}: {
  item: TaskChecklistItem;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}) {
  return (
    <div className="group hover:bg-muted/60 flex items-center gap-2 rounded-md px-1 py-1">
      <Checkbox checked={item.checked} onCheckedChange={() => onToggleItem(item.id)} />
      <span
        className={`min-w-0 flex-1 text-sm break-words ${
          item.checked ? 'text-muted-foreground line-through' : ''
        }`}
      >
        {item.text}
      </span>
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        title="Delete item"
        onClick={() => onDeleteItem(item.id)}
      >
        <Trash2 size={12} />
      </Button>
    </div>
  );
}
