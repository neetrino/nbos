import type { Editor } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import type { Extensions } from '@tiptap/react';
import {
  MAIL_COMPOSE_FONT_FAMILIES,
  MAIL_COMPOSE_TABLE_CELL_STYLE,
  MAIL_COMPOSE_TABLE_HEADER_STYLE,
  MAIL_COMPOSE_TABLE_STYLE,
} from './mail-compose-editor-constants';
import { MailComposeFontSize } from './mail-compose-font-size.extension';

const ALLOWED_FONT_FAMILIES: Set<string> = new Set(
  MAIL_COMPOSE_FONT_FAMILIES.map((item) => item.value).filter(Boolean),
);

export function buildMailComposeEditorExtensions(placeholder: string): Extensions {
  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: {},
      horizontalRule: false,
      link: false,
      underline: false,
    }),
    Underline,
    TextStyle,
    MailComposeFontSize,
    FontFamily.configure({
      types: ['textStyle'],
    }),
    Color.configure({ types: ['textStyle'] }),
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    Placeholder.configure({ placeholder }),
    Table.configure({
      resizable: false,
      HTMLAttributes: { style: MAIL_COMPOSE_TABLE_STYLE },
    }),
    TableRow,
    TableHeader.configure({
      HTMLAttributes: { style: MAIL_COMPOSE_TABLE_HEADER_STYLE },
    }),
    TableCell.configure({
      HTMLAttributes: { style: MAIL_COMPOSE_TABLE_CELL_STYLE },
    }),
  ];
}

/** Restricts font family to the compose toolbar allowlist. */
export function setMailComposeFontFamily(editor: Editor, value: string): void {
  if (!value) {
    editor.chain().focus().unsetFontFamily().run();
    return;
  }
  if (!ALLOWED_FONT_FAMILIES.has(value)) {
    return;
  }
  type AllowedFont = (typeof MAIL_COMPOSE_FONT_FAMILIES)[number]['value'];
  editor
    .chain()
    .focus()
    .setFontFamily(value as AllowedFont)
    .run();
}
