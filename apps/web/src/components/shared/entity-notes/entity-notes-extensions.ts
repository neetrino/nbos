import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import type { Extensions } from '@tiptap/react';

export function buildEntityNotesExtensions(placeholder: string): Extensions {
  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      code: false,
      blockquote: false,
      horizontalRule: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    Placeholder.configure({ placeholder }),
  ];
}
