'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '../detail-sheet-classes';
import {
  NOTES_EDIT_ACTIVATE_GUARD_MS,
  shouldCloseNotesEditorAfterBlur,
} from './entity-notes-edit-focus';
import {
  ENTITY_NOTES_COLLAPSE_FADE_CLASS,
  ENTITY_NOTES_COLLAPSED_PREVIEW_CLASS,
  ENTITY_NOTES_EDITOR_ROOT_CLASS,
  ENTITY_NOTES_SHELL_DISABLED_CLASS,
  ENTITY_NOTES_SHELL_EDITING_SURFACE_CLASS,
  ENTITY_NOTES_SHELL_PASSIVE_SURFACE_CLASS,
} from './entity-notes-field-classes';
import type { EntityNotesFieldProps } from './entity-notes-field.types';
import { EntityNotesEmptyHint } from './entity-notes-empty-hint';
import { EntityNotesPreviewFooter } from './EntityNotesPreviewFooter';
import { EntityNotesToolbar } from './entity-notes-toolbar';
import { isNotesValueEmpty } from './entity-notes-value';
import { useEntityNotesCollapse } from './use-entity-notes-collapse';
import { useEntityNotesEditor } from './use-entity-notes-editor';

const DEFAULT_PLACEHOLDER = 'Description';
const DEFAULT_FIELD_LABEL = 'Description';

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
  collapsiblePreview = false,
}: EntityNotesFieldProps) {
  const isLocked = disabled || loading;
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const activatingRef = useRef(false);
  const activatingTimerRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const isEditing = isActive && !isLocked;
  const isEmpty = isNotesValueEmpty(value);
  const showEmptyHint = !isEditing && isEmpty;
  const usePreviewChrome = collapsiblePreview && !isEditing && !isEmpty;

  const deactivate = useCallback(() => {
    setIsActive(false);
  }, []);

  const markActivating = useCallback(() => {
    activatingRef.current = true;
    if (activatingTimerRef.current != null) window.clearTimeout(activatingTimerRef.current);
    activatingTimerRef.current = window.setTimeout(() => {
      activatingRef.current = false;
      activatingTimerRef.current = null;
    }, NOTES_EDIT_ACTIVATE_GUARD_MS);
  }, []);

  useEffect(
    () => () => {
      if (activatingTimerRef.current != null) window.clearTimeout(activatingTimerRef.current);
    },
    [],
  );

  const handleEditorBlur = useCallback(() => {
    onBlur?.();
    requestAnimationFrame(() => {
      if (
        !shouldCloseNotesEditorAfterBlur({
          activating: activatingRef.current,
          shell: shellRef.current,
          activeElement: document.activeElement,
        })
      ) {
        return;
      }
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

  const { expanded, canCollapse, toggleExpanded, resetExpanded } = useEntityNotesCollapse({
    enabled: usePreviewChrome,
    contentRef,
    value,
    isEditing,
  });

  const activate = useCallback(() => {
    if (isLocked) return;
    markActivating();
    setIsActive(true);
    resetExpanded();
  }, [isLocked, markActivating, resetExpanded]);

  const onShellPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked || isActive) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if (usePreviewChrome) return;
    e.preventDefault();
    activate();
  };

  const fieldLabel = label === null ? null : (label ?? DEFAULT_FIELD_LABEL);
  const showCollapseFade = usePreviewChrome && canCollapse && !expanded;

  const shell = (
    <div
      ref={shellRef}
      className={cn(
        isEditing
          ? ENTITY_NOTES_SHELL_EDITING_SURFACE_CLASS
          : ENTITY_NOTES_SHELL_PASSIVE_SURFACE_CLASS,
        isLocked && ENTITY_NOTES_SHELL_DISABLED_CLASS,
        shellClassName,
      )}
      data-entity-notes-id={_entityId}
      data-entity-notes-type={_entityType}
      data-entity-notes-active={isEditing ? 'true' : 'false'}
      data-entity-notes-empty={isEmpty ? 'true' : 'false'}
      data-entity-notes-preview={usePreviewChrome ? 'true' : 'false'}
      data-entity-notes-collapsed={showCollapseFade ? 'true' : 'false'}
      onPointerDown={onShellPointerDown}
    >
      {isEditing ? <EntityNotesToolbar editor={editor} disabled={isLocked} /> : null}
      <div className="relative">
        <div
          ref={contentRef}
          className={cn(
            ENTITY_NOTES_EDITOR_ROOT_CLASS,
            'relative',
            showCollapseFade && ['overflow-hidden', ENTITY_NOTES_COLLAPSED_PREVIEW_CLASS],
          )}
        >
          {showEmptyHint ? <EntityNotesEmptyHint text={placeholder} /> : null}
          <EditorContent editor={editor} />
          {loading ? (
            <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
              <Loader2 className="text-muted-foreground size-5 animate-spin" aria-hidden />
            </div>
          ) : null}
        </div>
        {showCollapseFade ? <div className={ENTITY_NOTES_COLLAPSE_FADE_CLASS} aria-hidden /> : null}
      </div>
      {usePreviewChrome ? (
        <EntityNotesPreviewFooter
          expanded={expanded}
          canCollapse={canCollapse}
          disabled={isLocked}
          onEdit={activate}
          onToggleExpand={toggleExpanded}
        />
      ) : null}
    </div>
  );

  return (
    <div className={cn('w-full', className)}>
      {fieldLabel ? (
        <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
          <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{fieldLabel}</span>
          {shell}
        </div>
      ) : (
        shell
      )}
    </div>
  );
}
