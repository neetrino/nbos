'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ENTITY_NOTES_SHELL_EDITING_SURFACE_CLASS } from '@/components/shared/entity-notes/entity-notes-field-classes';
import { MAIL_HTML_BODY_CLASS } from './mail-html-purify-config';
import { buildMailComposeEditorExtensions } from './mail-compose-editor-extensions';
import {
  MailComposeEditorToolbar,
  type MailComposeEditorMode,
} from './mail-compose-editor-toolbar';
import {
  composeEditorHtmlToValue,
  composeValueToEditorHtml,
  htmlToPlainTextFallback,
  sanitizeComposeEmailHtml,
} from './mail-compose-html-sanitize';

export interface MailComposeMessageContent {
  bodyHtml: string | null;
  bodyText: string;
}

export interface MailComposeMessageEditorProps {
  value: string | null;
  onChange: (content: MailComposeMessageContent) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

const COMPOSE_EDITOR_MIN_HEIGHT_CLASS = 'min-h-[260px]';
const COMPOSE_EDITOR_FULLSCREEN_MIN_HEIGHT_CLASS = 'min-h-[calc(100vh-11rem)]';

function MailComposeHtmlPreview({ html }: { html: string }) {
  const safeHtml = sanitizeComposeEmailHtml(html);
  if (!safeHtml.trim()) {
    return <p className="text-muted-foreground px-3 py-4 text-sm">Nothing to preview.</p>;
  }
  return (
    <div
      className={cn(MAIL_HTML_BODY_CLASS, 'px-3 py-3')}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

export function MailComposeMessageEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Write your message…',
  id,
}: MailComposeMessageEditorProps) {
  const skipEmitRef = useRef(false);
  const lastExternalRef = useRef(value);
  const [mode, setMode] = useState<MailComposeEditorMode>('visual');
  const [fullscreen, setFullscreen] = useState(false);
  const [htmlSource, setHtmlSource] = useState('');

  const emitChange = useCallback(
    (rawHtml: string) => {
      const bodyHtml = composeEditorHtmlToValue(rawHtml);
      const bodyText = bodyHtml ? htmlToPlainTextFallback(bodyHtml) : '';
      onChange({ bodyHtml, bodyText });
    },
    [onChange],
  );

  const editor = useEditor(
    {
      extensions: buildMailComposeEditorExtensions(placeholder),
      content: composeValueToEditorHtml(value),
      editable: !disabled && mode === 'visual',
      immediatelyRender: false,
      editorProps: {
        attributes: {
          id: id ?? 'compose-body',
          class: cn(
            'mail-compose-prosemirror entity-notes-prosemirror max-w-none px-3 py-2 text-sm focus:outline-none',
            fullscreen
              ? COMPOSE_EDITOR_FULLSCREEN_MIN_HEIGHT_CLASS
              : COMPOSE_EDITOR_MIN_HEIGHT_CLASS,
          ),
        },
      },
      onUpdate: ({ editor: ed }) => {
        if (skipEmitRef.current || mode !== 'visual') {
          return;
        }
        emitChange(ed.getHTML());
      },
    },
    [placeholder],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled && mode === 'visual');
  }, [disabled, editor, mode]);

  useEffect(() => {
    if (!editor || value === lastExternalRef.current) {
      return;
    }
    lastExternalRef.current = value;
    const html = composeValueToEditorHtml(value);
    if (editor.getHTML() === html) {
      return;
    }
    skipEmitRef.current = true;
    editor.commands.setContent(html, { emitUpdate: false });
    skipEmitRef.current = false;
  }, [editor, value]);

  useEffect(() => {
    if (!fullscreen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreen]);

  const handleModeChange = (next: MailComposeEditorMode) => {
    if (!editor) {
      setMode(next);
      return;
    }
    if (mode === 'visual' && (next === 'html' || next === 'preview')) {
      setHtmlSource(editor.getHTML());
    }
    if (mode === 'html' && next === 'visual') {
      const sanitized = sanitizeComposeEmailHtml(htmlSource);
      skipEmitRef.current = true;
      editor.commands.setContent(sanitized, { emitUpdate: false });
      skipEmitRef.current = false;
      emitChange(sanitized);
    }
    if (mode === 'html' && next === 'preview') {
      setHtmlSource(sanitizeComposeEmailHtml(htmlSource));
    }
    if (mode === 'preview' && next === 'html') {
      // htmlSource already holds preview HTML
    }
    if (mode === 'preview' && next === 'visual') {
      const sanitized = sanitizeComposeEmailHtml(htmlSource);
      skipEmitRef.current = true;
      editor.commands.setContent(sanitized, { emitUpdate: false });
      skipEmitRef.current = false;
    }
    setMode(next);
  };

  const previewHtml =
    mode === 'visual' && editor ? editor.getHTML() : sanitizeComposeEmailHtml(htmlSource);

  return (
    <div
      className={cn(
        fullscreen &&
          'bg-background fixed inset-0 z-[220] flex flex-col overflow-hidden p-3 sm:p-4',
      )}
    >
      {fullscreen ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Message (fullscreen)</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setFullscreen(false)}>
            Exit fullscreen
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          ENTITY_NOTES_SHELL_EDITING_SURFACE_CLASS,
          'nbos-mail-compose-editor flex min-h-0 flex-1 flex-col',
          disabled && 'pointer-events-none opacity-60',
          fullscreen && 'min-h-0 flex-1',
        )}
        data-entity-notes-active="true"
        data-entity-notes-empty={value ? 'false' : 'true'}
      >
        <MailComposeEditorToolbar
          editor={editor}
          disabled={disabled}
          mode={mode}
          fullscreen={fullscreen}
          onModeChange={handleModeChange}
          onFullscreenToggle={() => setFullscreen((prev) => !prev)}
        />

        <div className="nbos-entity-notes-editor min-h-0 flex-1 overflow-y-auto">
          {mode === 'visual' ? <EditorContent editor={editor} className="h-full" /> : null}

          {mode === 'html' ? (
            <div className="flex h-full min-h-[260px] flex-col gap-2 p-3">
              <p className="text-muted-foreground text-xs">
                Unsafe HTML will be sanitized before sending.
              </p>
              <Textarea
                value={htmlSource}
                onChange={(event) => {
                  const next = event.target.value;
                  setHtmlSource(next);
                  emitChange(next);
                }}
                className="min-h-[220px] flex-1 font-mono text-xs"
                spellCheck={false}
              />
            </div>
          ) : null}

          {mode === 'preview' ? <MailComposeHtmlPreview html={previewHtml} /> : null}
        </div>
      </div>
    </div>
  );
}
