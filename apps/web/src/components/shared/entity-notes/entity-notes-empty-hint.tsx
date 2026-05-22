import { Pencil } from 'lucide-react';
import { ENTITY_NOTES_EMPTY_HINT_CLASS } from './entity-notes-field-classes';

interface EntityNotesEmptyHintProps {
  text: string;
}

/** Passive empty state: placeholder label + edit affordance (matches detail-sheet mock). */
export function EntityNotesEmptyHint({ text }: EntityNotesEmptyHintProps) {
  return (
    <div className={ENTITY_NOTES_EMPTY_HINT_CLASS} aria-hidden>
      <span className="truncate">{text}</span>
      <Pencil className="size-3 shrink-0 opacity-80" strokeWidth={1.75} />
    </div>
  );
}
