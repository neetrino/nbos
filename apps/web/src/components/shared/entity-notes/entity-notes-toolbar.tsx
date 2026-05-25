'use client';

import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/core';
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ENTITY_NOTES_TOOLBAR_BTN_ACTIVE_CLASS,
  ENTITY_NOTES_TOOLBAR_CLASS,
  ENTITY_NOTES_TOOLBAR_DIVIDER_CLASS,
  ENTITY_NOTES_TOOLBAR_GROUP_CLASS,
} from './entity-notes-field-classes';

function ToolbarBtn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        'text-muted-foreground size-8 shrink-0',
        active && ENTITY_NOTES_TOOLBAR_BTN_ACTIVE_CLASS,
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className={ENTITY_NOTES_TOOLBAR_GROUP_CLASS}>{children}</div>;
}

function ToolbarDivider() {
  return (
    <div
      className={ENTITY_NOTES_TOOLBAR_DIVIDER_CLASS}
      role="separator"
      aria-orientation="vertical"
    />
  );
}

function setLink(editor: Editor) {
  const prev = editor.getAttributes('link').href as string | undefined;
  const url = window.prompt('Link URL', prev ?? 'https://');
  if (url === null) return;
  if (url.trim() === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
}

export function EntityNotesToolbar({
  editor,
  disabled,
}: {
  editor: Editor | null;
  disabled?: boolean;
}) {
  if (!editor) return null;

  return (
    <div className={ENTITY_NOTES_TOOLBAR_CLASS} role="toolbar" aria-label="Note formatting">
      <ToolbarGroup>
        <ToolbarBtn
          label="Bold"
          disabled={disabled}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} strokeWidth={2.25} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Italic"
          disabled={disabled}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} strokeWidth={2.25} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Underline"
          disabled={disabled}
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} strokeWidth={2.25} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Strikethrough"
          disabled={disabled}
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} strokeWidth={2.25} />
        </ToolbarBtn>
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        <ToolbarBtn
          label="Numbered list"
          disabled={disabled}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} strokeWidth={2.25} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Bullet list"
          disabled={disabled}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} strokeWidth={2.25} />
        </ToolbarBtn>
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        <ToolbarBtn
          label="Link"
          disabled={disabled}
          active={editor.isActive('link')}
          onClick={() => setLink(editor)}
        >
          <Link2 size={15} strokeWidth={2.25} />
        </ToolbarBtn>
      </ToolbarGroup>
    </div>
  );
}
