'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ENTITY_NOTES_EDITOR_ROOT_CLASS,
  ENTITY_NOTES_LABEL_CLASS,
  ENTITY_NOTES_SHELL_BASE_CLASS,
  ENTITY_NOTES_SHELL_DISABLED_CLASS,
  ENTITY_NOTES_SHELL_PASSIVE_CLASS,
} from './entity-notes-field-classes';
import type { EntityNotesFieldProps } from './entity-notes-field.types';
import { EntityNotesToolbar } from './entity-notes-toolbar';
import { useEntityNotesEditor } from './use-entity-notes-editor';

const DEFAULT_PLACEHOLDER = 'Write a note…';

function focusLeftShell(shell: HTMLElement | null): boolean {
  const active = document.activeElement;
  return active !== null && shell !== null && !shell.contains(active);
}

export function EntityNotesField({
  entityType: _entityType,
  entityId: _entityId,
  value,
  onChange,
  onBlur,
  disabled = false,
  loading = false,
  placeholder = DEFAULT_PLACEHOLDER,
  label,
  className,
  shellClassName,
}: EntityNotesFieldProps) {
  const isLocked = disabled || loading;
  const shellRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const isEditing = isActive && !isLocked;

  const deactivate = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleEditorBlur = useCallback(() => {
    onBlur?.();
    requestAnimationFrame(() => {
      if (!focusLeftShell(shellRef.current)) return;
      deactivate();
    });
  }, [deactivate, onBlur]);

  const editor = useEntityNotesEditor({
    value,
    onChange,
    onBlur: handleEditorBlur,
    placeholder,
    disabled: isLocked,
    isActive: isEditing,
  });

  useEffect(() => {
    if (isLocked) setIsActive(false);
  }, [isLocked]);

  const activate = useCallback(() => {
    if (isLocked) return;
    setIsActive(true);
  }, [isLocked]);

  const onShellPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked || isActive) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    activate();
  };

  return (
    <div className={cn('w-full', className)}>
      {label ? <span className={ENTITY_NOTES_LABEL_CLASS}>{label}</span> : null}
      <div
        ref={shellRef}
        className={cn(
          ENTITY_NOTES_SHELL_BASE_CLASS,
          !isEditing && !isLocked && ENTITY_NOTES_SHELL_PASSIVE_CLASS,
          isLocked && ENTITY_NOTES_SHELL_DISABLED_CLASS,
          shellClassName,
        )}
        data-entity-notes-id={_entityId}
        data-entity-notes-type={_entityType}
        data-entity-notes-active={isEditing ? 'true' : 'false'}
        onPointerDown={onShellPointerDown}
      >
        {isEditing ? <EntityNotesToolbar editor={editor} disabled={isLocked} /> : null}
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
