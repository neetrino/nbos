'use client';

import type { Editor } from '@tiptap/core';
import { Highlighter, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  MAIL_COMPOSE_HIGHLIGHT_COLORS,
  MAIL_COMPOSE_TEXT_COLORS,
} from './mail-compose-editor-constants';
import { ComposeToolbarIconShell } from './mail-compose-toolbar-shared';

function ColorSwatchGrid({
  colors,
  onPick,
}: {
  colors: ReadonlyArray<{ label: string; value: string }>;
  onPick: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {colors.map((color) => (
        <button
          key={color.label}
          type="button"
          title={color.label}
          className={cn(
            'h-7 rounded-md border text-[10px] font-medium',
            !color.value && 'bg-background text-muted-foreground',
          )}
          style={color.value ? { backgroundColor: color.value } : undefined}
          onClick={() => onPick(color.value)}
        >
          {!color.value ? '×' : ''}
        </button>
      ))}
    </div>
  );
}

export function MailComposeTextColorControl({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger disabled={disabled} className="inline-flex" aria-label="Text color">
        <ComposeToolbarIconShell label="Text color" disabled={disabled}>
          <Palette size={15} strokeWidth={2.25} />
        </ComposeToolbarIconShell>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <ColorSwatchGrid
          colors={MAIL_COMPOSE_TEXT_COLORS}
          onPick={(value) => {
            if (!value) {
              editor.chain().focus().unsetColor().run();
              return;
            }
            editor.chain().focus().setColor(value).run();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function MailComposeHighlightColorControl({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger disabled={disabled} className="inline-flex" aria-label="Highlight">
        <ComposeToolbarIconShell
          label="Highlight"
          disabled={disabled}
          active={editor.isActive('highlight')}
        >
          <Highlighter size={15} strokeWidth={2.25} />
        </ComposeToolbarIconShell>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <ColorSwatchGrid
          colors={MAIL_COMPOSE_HIGHLIGHT_COLORS}
          onPick={(value) => {
            if (!value) {
              editor.chain().focus().unsetHighlight().run();
              return;
            }
            editor.chain().focus().setHighlight({ color: value }).run();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
