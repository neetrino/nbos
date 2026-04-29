'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { Loader2, Rocket, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DOCUMENT_AUTOSAVE_DEBOUNCE_MS } from '@/features/documents/document-autosave.constants';
import { getEmptyNativeDocumentJson } from '@/features/documents/native-document-empty-json';
import { buildNativeDocumentEditorExtensions } from '@/features/documents/native-document-editor-extensions';
import { NativeDocumentEditorToolbar } from '@/features/documents/native-document-editor-toolbar';
import {
  fingerprintEditorJson,
  saveNativeDocumentEditor,
} from '@/features/documents/native-document-editor-save';
import { getApiErrorMessage } from '@/lib/api-errors';
import { documentsApi, type DocumentDetail } from '@/lib/api/documents';

export type NativeEditorSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface NativeDocumentEditorProps {
  documentId: string;
  documentStatus: string;
  initialContentJson: unknown;
  onDocumentUpdated: (doc: DocumentDetail) => void;
}

function resolveInitialJson(initialContentJson: unknown): Record<string, unknown> {
  if (
    initialContentJson &&
    typeof initialContentJson === 'object' &&
    !Array.isArray(initialContentJson)
  ) {
    return initialContentJson as Record<string, unknown>;
  }
  return getEmptyNativeDocumentJson();
}

export function NativeDocumentEditor({
  documentId,
  documentStatus,
  initialContentJson,
  onDocumentUpdated,
}: NativeDocumentEditorProps) {
  const [saveStatus, setSaveStatus] = useState<NativeEditorSaveStatus>('idle');
  const [publishing, setPublishing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedLabelRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFingerprintRef = useRef<string>('');
  const editorRef = useRef<Editor | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const clearSavedLabel = useCallback(() => {
    if (savedLabelRef.current) {
      clearTimeout(savedLabelRef.current);
      savedLabelRef.current = null;
    }
  }, []);

  const runSave = useCallback(
    async (recordActivity: boolean) => {
      const editor = editorRef.current;
      if (!editor) return;
      const fp = fingerprintEditorJson(editor);
      if (!recordActivity && fp === lastFingerprintRef.current) return;

      setSaveStatus('saving');
      setLastError(null);
      try {
        const updated = await saveNativeDocumentEditor(documentId, editor, recordActivity);
        lastFingerprintRef.current = fp;
        onDocumentUpdated(updated);
        setSaveStatus('saved');
        clearSavedLabel();
        savedLabelRef.current = setTimeout(() => {
          setSaveStatus('idle');
          savedLabelRef.current = null;
        }, 2000);
      } catch (e) {
        setLastError(getApiErrorMessage(e, 'Could not save document.'));
        setSaveStatus('error');
      }
    },
    [clearSavedLabel, documentId, onDocumentUpdated],
  );

  const handlePublish = async () => {
    const ed = editorRef.current;
    if (!ed || documentStatus !== 'DRAFT') return;
    clearDebounce();
    setPublishing(true);
    setLastError(null);
    try {
      const updated = await documentsApi.updateDocument(documentId, {
        contentJson: ed.getJSON(),
        contentHtml: ed.getHTML(),
        plainText: ed.getText(),
        status: 'PUBLISHED',
      });
      lastFingerprintRef.current = fingerprintEditorJson(ed);
      onDocumentUpdated(updated);
      setSaveStatus('idle');
    } catch (e) {
      setLastError(getApiErrorMessage(e, 'Could not publish document.'));
      setSaveStatus('error');
    } finally {
      setPublishing(false);
    }
  };

  const scheduleAutosave = useCallback(() => {
    clearDebounce();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void runSave(false);
    }, DOCUMENT_AUTOSAVE_DEBOUNCE_MS);
  }, [clearDebounce, runSave]);

  const editor = useEditor({
    extensions: buildNativeDocumentEditorExtensions(),
    content: resolveInitialJson(initialContentJson),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'nbos-document-editor ProseMirror min-h-[240px] px-3 py-2 text-sm outline-none focus:outline-none',
      },
    },
    onCreate: ({ editor: ed }) => {
      lastFingerprintRef.current = fingerprintEditorJson(ed);
    },
    onUpdate: () => {
      scheduleAutosave();
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor]);

  useEffect(() => {
    return () => {
      clearDebounce();
      clearSavedLabel();
    };
  }, [clearDebounce, clearSavedLabel]);

  const handleManualSave = () => {
    clearDebounce();
    void runSave(true);
  };

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved'
        : saveStatus === 'error'
          ? 'Save failed'
          : 'Autosave when idle';

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <NativeDocumentEditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
        <div className="text-muted-foreground flex min-h-5 items-center gap-2 text-xs">
          {saveStatus === 'saving' ? <Loader2 className="size-3.5 animate-spin" /> : null}
          <span>{saveLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {documentStatus === 'DRAFT' ? (
            <Button
              type="button"
              size="sm"
              className="gap-1"
              onClick={() => void handlePublish()}
              disabled={publishing || saveStatus === 'saving'}
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
              Publish
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={handleManualSave}
          >
            <Save size={14} />
            Save
          </Button>
        </div>
      </div>
      {lastError ? <p className="text-destructive px-3 pb-2 text-xs">{lastError}</p> : null}
    </div>
  );
}
