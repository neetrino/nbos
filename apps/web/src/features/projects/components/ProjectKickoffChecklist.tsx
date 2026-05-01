'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type {
  ProjectKickoffChecklistItem,
  UpdateKickoffChecklistItemInput,
} from '@/lib/api/projects';

interface ProjectKickoffChecklistProps {
  items: ProjectKickoffChecklistItem[];
  onUpdate: (
    itemId: string,
    data: UpdateKickoffChecklistItemInput,
  ) => Promise<ProjectKickoffChecklistItem>;
}

export function ProjectKickoffChecklist({ items, onUpdate }: ProjectKickoffChecklistProps) {
  const requiredItems = items.filter((item) => item.isRequired);
  const checkedRequired = requiredItems.filter((item) => item.isChecked).length;

  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-sky-200 p-4 text-xs text-sky-700 dark:border-sky-900 dark:text-sky-300">
        Kickoff checklist will be generated when project details are refreshed.
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-sky-100 bg-white/70 p-4 dark:border-sky-900/40 dark:bg-stone-900/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">Kickoff Checklist</h4>
          <p className="text-muted-foreground text-xs">
            Persisted PM acceptance before delivery gates are added.
          </p>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
          {checkedRequired}/{requiredItems.length} required
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <KickoffChecklistRow key={item.id} item={item} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}

function KickoffChecklistRow({
  item,
  onUpdate,
}: {
  item: ProjectKickoffChecklistItem;
  onUpdate: (
    itemId: string,
    data: UpdateKickoffChecklistItemInput,
  ) => Promise<ProjectKickoffChecklistItem>;
}) {
  const [note, setNote] = useState(item.note ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(item.note ?? '');
  }, [item.note]);

  const handleCheckedChange = async () => {
    await updateItem({ isChecked: !item.isChecked }, 'Checklist status updated');
  };

  const handleSaveNote = async () => {
    await updateItem({ note: note.trim() || null }, 'Checklist note saved');
  };

  const updateItem = async (data: UpdateKickoffChecklistItemInput, successMessage: string) => {
    setSaving(true);
    try {
      await onUpdate(item.id, data);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update checklist');
      setNote(item.note ?? '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-stone-100 bg-white/70 p-3 dark:border-stone-800 dark:bg-stone-950/20">
      <KickoffChecklistRowHeader
        item={item}
        saving={saving}
        onCheckedChange={handleCheckedChange}
      />
      <KickoffChecklistNoteEditor
        item={item}
        note={note}
        saving={saving}
        setNote={setNote}
        onSaveNote={handleSaveNote}
      />
    </div>
  );
}

function KickoffChecklistRowHeader({
  item,
  saving,
  onCheckedChange,
}: {
  item: ProjectKickoffChecklistItem;
  saving: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox checked={item.isChecked} disabled={saving} onCheckedChange={onCheckedChange} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-medium ${item.isChecked ? 'text-muted-foreground line-through' : ''}`}
          >
            {item.title}
          </p>
          <KickoffChecklistRequiredBadge isRequired={item.isRequired} />
        </div>
        {item.checkedAt && (
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            Checked {new Date(item.checkedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function KickoffChecklistRequiredBadge({ isRequired }: { isRequired: boolean }) {
  if (!isRequired) {
    return <span className="text-muted-foreground text-[10px] font-semibold">Optional</span>;
  }

  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
      Required
    </span>
  );
}

function KickoffChecklistNoteEditor({
  item,
  note,
  saving,
  setNote,
  onSaveNote,
}: {
  item: ProjectKickoffChecklistItem;
  note: string;
  saving: boolean;
  setNote: (note: string) => void;
  onSaveNote: () => void;
}) {
  return (
    <div className="mt-3 flex flex-col gap-2 md:flex-row">
      <Textarea
        value={note}
        disabled={saving}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional PM note..."
        className="min-h-16 text-xs"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={saving || note === (item.note ?? '')}
        onClick={onSaveNote}
        className="md:self-start"
      >
        {saving ? <Loader2 className="size-3 animate-spin" /> : 'Save note'}
      </Button>
    </div>
  );
}
