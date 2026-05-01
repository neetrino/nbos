import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DocumentImageNodeView } from '@/features/documents/document-image-node-view';

export const DocumentImageNode = Node.create({
  name: 'documentImage',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      documentId: '',
    };
  },

  addAttributes() {
    return {
      fileAssetId: {
        default: null,
        parseHTML: (element) => {
          if (typeof element === 'string') return null;
          return element.getAttribute('data-nbos-file');
        },
      },
      alt: {
        default: '',
        parseHTML: (element) => {
          if (typeof element === 'string') return '';
          return element.getAttribute('alt') ?? '';
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'img[data-nbos-file]' }];
  },

  renderHTML({ node }) {
    const id = node.attrs.fileAssetId as string | null;
    const alt = (node.attrs.alt as string) ?? '';
    return [
      'img',
      mergeAttributes({
        'data-nbos-file': id ?? '',
        src: '',
        alt,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentImageNodeView);
  },
});
