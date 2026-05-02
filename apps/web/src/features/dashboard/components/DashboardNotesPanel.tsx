'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'framer-motion';
import { GripVertical, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { DashboardNote } from '../dashboard-control-registry';

const NOTE_TIME_FORMAT = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
});

interface DashboardNotesPanelProps {
  className?: string;
  notes?: DashboardNote[];
  onCreateNote: (content: string) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onReorderNotes: (noteIds: string[]) => Promise<void>;
  onUpdateNote: (id: string, content: string) => Promise<void>;
}

export function DashboardNotesPanel({
  className,
  notes,
  onCreateNote,
  onDeleteNote,
  onReorderNotes,
  onUpdateNote,
}: DashboardNotesPanelProps) {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const canSave = draft.trim().length > 0 && !saving;
  const visibleNotes = notes ?? [];

  async function saveDraft() {
    if (!canSave) return;
    const content = draft;
    setDraft('');
    setSaving(true);
    try {
      await onCreateNote(content);
    } catch {
      setDraft(content);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void saveDraft();
  }

  return (
    <section className={cn('flex min-h-0 flex-col space-y-4', className)}>
      <div className="relative">
        {saving ? (
          <Loader2 className="absolute top-3 right-3 z-10 h-4 w-4 animate-spin text-amber-900/45" />
        ) : null}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/90 shadow-inner">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a note and press Enter..."
            className={cn(
              'min-h-36 resize-none border-0 bg-transparent px-4 py-4 text-sm leading-7 shadow-none',
              'placeholder:text-amber-900/40 focus-visible:ring-0',
            )}
          />
          <div className="flex justify-end px-4 pb-3">
            <Button size="sm" onClick={() => void saveDraft()} disabled={!canSave}>
              Save
            </Button>
          </div>
        </div>
      </div>

      <NoteStack
        notes={visibleNotes}
        onDeleteNote={onDeleteNote}
        onReorderNotes={onReorderNotes}
        onUpdateNote={onUpdateNote}
      />
    </section>
  );
}

function NoteStack({
  notes,
  onDeleteNote,
  onReorderNotes,
  onUpdateNote,
}: {
  notes: DashboardNote[];
  onDeleteNote: (id: string) => Promise<void>;
  onReorderNotes: (noteIds: string[]) => Promise<void>;
  onUpdateNote: (id: string, content: string) => Promise<void>;
}) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const noteIds = notes.map((note) => note.id);
  const activeDragNote = activeDragId ? notes.find((note) => note.id === activeDragId) : null;

  if (notes.length === 0) {
    return (
      <div className="border-border bg-muted/20 text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
        Your saved notes will collect here.
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = noteIds.indexOf(String(active.id));
    const newIndex = noteIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    void onReorderNotes(arrayMove(noteIds, oldIndex, newIndex));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function startEditing(note: DashboardNote) {
    setEditingNoteId(note.id);
    setEditDraft(note.content);
  }

  async function saveEdit(noteId: string) {
    const content = editDraft.trim();
    if (!content) return;
    await onUpdateNote(noteId, content);
    setEditingNoteId(null);
    setEditDraft('');
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col pt-1 pb-3">
              <AnimatePresence initial={false}>
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    editDraft={editDraft}
                    isEditing={editingNoteId === note.id}
                    note={note}
                    onCancelEdit={() => setEditingNoteId(null)}
                    onChangeEditDraft={setEditDraft}
                    onDeleteNote={onDeleteNote}
                    onSaveEdit={saveEdit}
                    onStartEdit={startEditing}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeDragNote ? <NoteDragPreview note={activeDragNote} /> : null}
        </DragOverlay>
      </DndContext>
      <p className="text-center text-xs font-medium text-amber-900/50">
        {formatNoteCount(notes.length)}
      </p>
    </div>
  );
}

function NoteCard({
  editDraft,
  isEditing,
  note,
  onCancelEdit,
  onChangeEditDraft,
  onDeleteNote,
  onSaveEdit,
  onStartEdit,
}: {
  editDraft: string;
  isEditing: boolean;
  note: DashboardNote;
  onCancelEdit: () => void;
  onChangeEditDraft: (value: string) => void;
  onDeleteNote: (id: string) => Promise<void>;
  onSaveEdit: (id: string) => Promise<void>;
  onStartEdit: (note: DashboardNote) => void;
}) {
  const savedTime = useMemo(() => formatNoteTime(note.createdAt), [note.createdAt]);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    disabled: isEditing,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  function handleEditKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancelEdit();
      return;
    }
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void onSaveEdit(note.id);
  }

  return (
    <motion.article
      ref={setNodeRef}
      layout
      style={style}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'group relative -mt-2 touch-none first:mt-0 hover:z-10 hover:mb-2',
        isDragging && 'opacity-25',
      )}
    >
      <div className="relative rounded-xl border border-amber-200 bg-amber-50 px-3 pt-3 pb-7 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <NoteActions
          note={note}
          dragAttributes={attributes}
          dragListeners={listeners}
          onDeleteNote={onDeleteNote}
          onStartEdit={onStartEdit}
        />
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editDraft}
              onChange={(event) => onChangeEditDraft(event.target.value)}
              onKeyDown={handleEditKeyDown}
              className="min-h-24 resize-none border-amber-200 bg-amber-50/80 text-sm leading-6 text-amber-950 focus-visible:ring-1"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!editDraft.trim()}
                onClick={() => void onSaveEdit(note.id)}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 whitespace-pre-wrap text-amber-950">{note.content}</p>
        )}
        {!isEditing ? (
          <span className="absolute bottom-2 left-3 text-[10px] font-medium text-amber-900/45">
            {savedTime}
          </span>
        ) : null}
      </div>
    </motion.article>
  );
}

function NoteActions({
  dragAttributes,
  dragListeners,
  note,
  onDeleteNote,
  onStartEdit,
}: {
  dragAttributes: ReturnType<typeof useSortable>['attributes'];
  dragListeners: ReturnType<typeof useSortable>['listeners'];
  note: DashboardNote;
  onDeleteNote: (id: string) => Promise<void>;
  onStartEdit: (note: DashboardNote) => void;
}) {
  return (
    <div className="absolute right-2 bottom-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        className="cursor-grab rounded-full border border-amber-200 bg-amber-50/90 p-1.5 text-amber-900/45 shadow-sm backdrop-blur active:cursor-grabbing"
        aria-label="Drag note"
        {...dragAttributes}
        {...dragListeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full border border-amber-200 bg-amber-50/90 text-amber-900/45 shadow-sm backdrop-blur hover:text-amber-800"
        onClick={(event) => {
          event.stopPropagation();
          onStartEdit(note);
        }}
        aria-label="Edit note"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full border border-amber-200 bg-amber-50/90 text-amber-900/45 shadow-sm backdrop-blur hover:text-red-700"
        onClick={(event) => {
          event.stopPropagation();
          void onDeleteNote(note.id);
        }}
        aria-label="Delete note"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function NoteDragPreview({ note }: { note: DashboardNote }) {
  return (
    <div className="max-w-sm rotate-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 opacity-95 shadow-2xl ring-2 ring-amber-300/45">
      <div className="mb-2 flex items-center gap-1.5">
        <GripVertical className="h-3.5 w-3.5 text-amber-900/50" />
        <span className="text-xs font-semibold text-amber-900/70">Moving note</span>
      </div>
      <p className="line-clamp-4 text-sm leading-6 whitespace-pre-wrap text-amber-950">
        {note.content}
      </p>
    </div>
  );
}

function formatNoteTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return NOTE_TIME_FORMAT.format(date);
}

function formatNoteCount(count: number): string {
  return `${count} saved ${count === 1 ? 'note' : 'notes'}`;
}
