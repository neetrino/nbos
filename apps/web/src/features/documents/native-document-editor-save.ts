import type { Editor } from '@tiptap/core';
import { documentsApi } from '@/lib/api/documents';

export function fingerprintEditorJson(editor: Editor): string {
  return JSON.stringify(editor.getJSON());
}

export async function saveNativeDocumentEditor(
  documentId: string,
  editor: Editor,
  recordActivity: boolean,
) {
  const payload = {
    contentJson: editor.getJSON(),
    contentHtml: editor.getHTML(),
    plainText: editor.getText(),
    ...(recordActivity ? {} : { recordActivity: false as const }),
  };
  return documentsApi.updateDocument(documentId, payload);
}
