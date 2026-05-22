'use client';

import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import { buildEntityNotesExtensions } from './entity-notes-extensions';
import { editorHtmlToNotesValue, notesValueToEditorHtml } from './entity-notes-value';

export function useEntityNotesEditor(opts: {
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const { value, onChange, onBlur, placeholder, disabled } = opts;
  const skipEmitRef = useRef(false);
  const lastExternalRef = useRef(value);

  const editor = useEditor(
    {
      extensions: buildEntityNotesExtensions(placeholder),
      content: notesValueToEditorHtml(value),
      editable: !disabled,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            'prose prose-sm dark:prose-invert max-w-none min-h-[88px] px-3 py-2.5 focus:outline-none',
        },
      },
      onUpdate: ({ editor: ed }) => {
        if (skipEmitRef.current) return;
        onChange(editorHtmlToNotesValue(ed.getHTML()));
      },
      onBlur: () => onBlur?.(),
    },
    [placeholder],
  );

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

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
