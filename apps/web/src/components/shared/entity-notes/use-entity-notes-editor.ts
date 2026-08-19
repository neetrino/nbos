'use client';

import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import { NOTES_EDIT_ACTIVATE_GUARD_MS } from './entity-notes-edit-focus';
import { buildEntityNotesExtensions } from './entity-notes-extensions';
import { editorHtmlToNotesValue, notesValueToEditorHtml } from './entity-notes-value';

export function useEntityNotesEditor(opts: {
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  placeholder: string;
  disabled?: boolean;
  /** When false, editor is read-only (passive view). */
  isActive?: boolean;
}) {
  const { value, onChange, onBlur, placeholder, disabled, isActive = true } = opts;
  const skipEmitRef = useRef(false);
  const lastExternalRef = useRef(value);
  const onBlurRef = useRef(onBlur);
  const suppressBlurRef = useRef(false);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  const editor = useEditor(
    {
      extensions: buildEntityNotesExtensions(placeholder),
      content: notesValueToEditorHtml(value),
      editable: !disabled && isActive,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: 'entity-notes-prosemirror max-w-none px-3 text-sm focus:outline-none',
        },
      },
      onUpdate: ({ editor: ed }) => {
        if (skipEmitRef.current) return;
        onChange(editorHtmlToNotesValue(ed.getHTML()));
      },
      onBlur: () => {
        if (suppressBlurRef.current) return;
        onBlurRef.current?.();
      },
    },
    [placeholder],
  );

  useEffect(() => {
    if (!editor) return;

    const shouldFocus = isActive && !disabled && !wasActiveRef.current;
    if (shouldFocus) suppressBlurRef.current = true;

    editor.setEditable(!disabled && isActive);
    if (shouldFocus) editor.commands.focus();

    wasActiveRef.current = disabled ? false : isActive;
    if (!shouldFocus) return;

    const timer = window.setTimeout(() => {
      suppressBlurRef.current = false;
    }, NOTES_EDIT_ACTIVATE_GUARD_MS);
    return () => window.clearTimeout(timer);
  }, [disabled, editor, isActive]);

  useEffect(() => {
    if (!editor || value === lastExternalRef.current) return;
    lastExternalRef.current = value;
    const html = notesValueToEditorHtml(value);
    if (editor.getHTML() === html) return;
    skipEmitRef.current = true;
    editor.commands.setContent(html, { emitUpdate: false });
    skipEmitRef.current = false;
  }, [editor, value]);

  return editor;
}

export type EntityNotesEditor = Editor | null;
