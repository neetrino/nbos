'use client';

import { EditorContent } from '@tiptap/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ENTITY_NOTES_EDITOR_ROOT_CLASS,
  ENTITY_NOTES_LABEL_CLASS,
  ENTITY_NOTES_SHELL_BASE_CLASS,
  ENTITY_NOTES_SHELL_DISABLED_CLASS,
} from './entity-notes-field-classes';
import type { EntityNotesFieldProps } from './entity-notes-field.types';
import { EntityNotesToolbar } from './entity-notes-toolbar';
import { useEntityNotesEditor } from './use-entity-notes-editor';

const DEFAULT_LABEL = 'Notes';
const DEFAULT_PLACEHOLDER = 'Write a note…';

export function EntityNotesField({
  entityType: _entityType,
  entityId: _entityId,
  value,
  onChange,
  onBlur,
  disabled = false,
  loading = false,
  placeholder = DEFAULT_PLACEHOLDER,
  label = DEFAULT_LABEL,
  className,
  shellClassName,
}: EntityNotesFieldProps) {
  const isLocked = disabled || loading;
  const editor = useEntityNotesEditor({
    value,
    onChange,
    onBlur,
    placeholder,
    disabled: isLocked,
  });

  return (
    <div className={cn('w-full', className)}>
      <span className={ENTITY_NOTES_LABEL_CLASS}>{label}</span>
      <div
        className={cn(
          ENTITY_NOTES_SHELL_BASE_CLASS,
          isLocked && ENTITY_NOTES_SHELL_DISABLED_CLASS,
          shellClassName,
        )}
        data-entity-notes-id={_entityId}
        data-entity-notes-type={_entityType}
      >
        <EntityNotesToolbar editor={editor} disabled={isLocked} />
        <div className={cn(ENTITY_NOTES_EDITOR_ROOT_CLASS, 'relative')}>
          <EditorContent editor={editor} />
          {loading ? (
            <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
              <Loader2 className="text-muted-foreground size-5 animate-spin" aria-hidden />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
