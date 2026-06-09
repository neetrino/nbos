'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eye,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ENTITY_NOTES_TOOLBAR_CLASS } from '@/components/shared/entity-notes/entity-notes-field-classes';
import {
  MAIL_COMPOSE_FONT_FAMILIES,
  MAIL_COMPOSE_FONT_SIZES,
} from './mail-compose-editor-constants';
import { setMailComposeFontFamily } from './mail-compose-editor-extensions';
import {
  MailComposeHighlightColorControl,
  MailComposeTextColorControl,
} from './mail-compose-toolbar-colors';
import { MailComposeTableControls } from './mail-compose-toolbar-table-controls';
import {
  ComposeToolbarBtn,
  ComposeToolbarDivider,
  ComposeToolbarGroup,
  ComposeToolbarIconShell,
  ComposeToolbarSelect,
} from './mail-compose-toolbar-shared';

export type MailComposeEditorMode = 'visual' | 'html' | 'preview';

export interface MailComposeEditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  mode: MailComposeEditorMode;
  fullscreen: boolean;
  onModeChange: (mode: MailComposeEditorMode) => void;
  onFullscreenToggle: () => void;
}

export function MailComposeEditorToolbar({
  editor,
  disabled,
  mode,
  fullscreen,
  onModeChange,
  onFullscreenToggle,
}: MailComposeEditorToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  if (!editor) {
    return null;
  }

  const visualDisabled = disabled || mode !== 'visual';
  const currentFontSize = (editor.getAttributes('textStyle').fontSize as string | undefined) ?? '';
  const currentFontFamily =
    (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? '';

  const openLinkEditor = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    setLinkUrl(prev ?? 'https://');
    setLinkOpen(true);
  };

  const applyLink = () => {
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
    }
    setLinkOpen(false);
  };

  return (
    <div className={ENTITY_NOTES_TOOLBAR_CLASS} role="toolbar" aria-label="Email formatting">
      <ComposeToolbarGroup>
        <ComposeToolbarBtn
          label="Bold"
          disabled={visualDisabled}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} strokeWidth={2.25} />
        </ComposeToolbarBtn>
        <ComposeToolbarBtn
          label="Italic"
          disabled={visualDisabled}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} strokeWidth={2.25} />
        </ComposeToolbarBtn>
        <ComposeToolbarBtn
          label="Underline"
          disabled={visualDisabled}
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} strokeWidth={2.25} />
        </ComposeToolbarBtn>
        <ComposeToolbarBtn
          label="Strikethrough"
          disabled={visualDisabled}
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} strokeWidth={2.25} />
        </ComposeToolbarBtn>
      </ComposeToolbarGroup>

      <ComposeToolbarDivider />

      <ComposeToolbarGroup>
        <ComposeToolbarSelect
          label="Font family"
          disabled={visualDisabled}
          value={currentFontFamily}
          options={MAIL_COMPOSE_FONT_FAMILIES}
          onChange={(value) => setMailComposeFontFamily(editor, value)}
        />
        <ComposeToolbarSelect
          label="Font size"
          disabled={visualDisabled}
          value={currentFontSize}
          options={[
            { label: 'Default', value: '' },
            ...MAIL_COMPOSE_FONT_SIZES.map((size) => ({ label: size, value: size })),
          ]}
          onChange={(value) => {
            if (!value) {
              editor.chain().focus().unsetFontSize().run();
              return;
            }
            editor.chain().focus().setFontSize(value).run();
          }}
        />
      </ComposeToolbarGroup>

      <ComposeToolbarDivider />

      <ComposeToolbarGroup>
        <MailComposeTextColorControl editor={editor} disabled={visualDisabled} />
        <MailComposeHighlightColorControl editor={editor} disabled={visualDisabled} />
      </ComposeToolbarGroup>

      <ComposeToolbarDivider />

      <ComposeToolbarGroup>
        <ComposeToolbarBtn
          label="Bullet list"
          disabled={visualDisabled}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} strokeWidth={2.25} />
        </ComposeToolbarBtn>
        <ComposeToolbarBtn
          label="Ordered list"
          disabled={visualDisabled}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} strokeWidth={2.25} />
        </ComposeToolbarBtn>
      </ComposeToolbarGroup>

      <ComposeToolbarDivider />

      <ComposeToolbarGroup>
        {(['left', 'center', 'right', 'justify'] as const).map((align) => {
          const Icon =
            align === 'left'
              ? AlignLeft
              : align === 'center'
                ? AlignCenter
                : align === 'right'
                  ? AlignRight
                  : AlignJustify;
          return (
            <ComposeToolbarBtn
              key={align}
              label={`Align ${align}`}
              disabled={visualDisabled}
              active={editor.isActive({ textAlign: align })}
              onClick={() => editor.chain().focus().setTextAlign(align).run()}
            >
              <Icon size={15} strokeWidth={2.25} />
            </ComposeToolbarBtn>
          );
        })}
      </ComposeToolbarGroup>

      <ComposeToolbarDivider />

      <ComposeToolbarGroup>
        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverTrigger
            disabled={visualDisabled}
            className="inline-flex"
            aria-label="Link"
            onClick={openLinkEditor}
          >
            <ComposeToolbarIconShell
              label="Link"
              disabled={visualDisabled}
              active={editor.isActive('link')}
            >
              <Link2 size={15} strokeWidth={2.25} />
            </ComposeToolbarIconShell>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 gap-2 p-3">
            <p className="text-sm font-medium">Link URL</p>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setLinkOpen(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={applyLink}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <MailComposeTableControls editor={editor} disabled={visualDisabled} />
      </ComposeToolbarGroup>

      <ComposeToolbarDivider />

      <ComposeToolbarGroup>
        <ComposeToolbarSelect
          label="Editor mode"
          disabled={disabled}
          value={mode}
          options={[
            { label: 'Visual', value: 'visual' },
            { label: 'HTML', value: 'html' },
            { label: 'Preview', value: 'preview' },
          ]}
          onChange={(value) => onModeChange(value as MailComposeEditorMode)}
        />
        <ComposeToolbarBtn
          label={fullscreen ? 'Exit fullscreen' : 'Fullscreen editor'}
          disabled={disabled}
          onClick={onFullscreenToggle}
        >
          {fullscreen ? (
            <Minimize2 size={15} strokeWidth={2.25} />
          ) : (
            <Maximize2 size={15} strokeWidth={2.25} />
          )}
        </ComposeToolbarBtn>
        {mode === 'html' ? (
          <span className="text-muted-foreground hidden items-center gap-1 text-[10px] sm:inline-flex">
            <Code2 size={12} aria-hidden />
            Sanitized on send
          </span>
        ) : null}
        {mode === 'preview' ? (
          <span className="text-muted-foreground hidden items-center gap-1 text-[10px] sm:inline-flex">
            <Eye size={12} aria-hidden />
            Preview
          </span>
        ) : null}
      </ComposeToolbarGroup>
    </div>
  );
}
