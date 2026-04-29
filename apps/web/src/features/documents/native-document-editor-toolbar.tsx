'use client';

import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/core';
import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NativeDocumentEditorToolbarProps {
  editor: Editor | null;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon-sm"
      className="size-8 shrink-0"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

export function NativeDocumentEditorToolbar({ editor }: NativeDocumentEditorToolbarProps) {
  if (!editor) return null;
  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center gap-0.5 border-b px-1 py-1">
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Ordered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={16} />
      </ToolbarButton>
    </div>
  );
}
