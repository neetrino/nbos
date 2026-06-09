'use client';

import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { MAIL_COMPOSE_TABLE_GRID_MAX } from './mail-compose-editor-constants';

export interface MailComposeTableGridProps {
  editor: Editor;
  disabled?: boolean;
  children: ReactNode;
}

export function MailComposeTableGrid({ editor, disabled, children }: MailComposeTableGridProps) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ cols: 0, rows: 0 });

  const insertTable = (cols: number, rows: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setOpen(false);
    setHover({ cols: 0, rows: 0 });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} className="inline-flex">
        {children as ReactElement}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <p className="text-muted-foreground mb-2 text-xs">Insert table</p>
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${MAIL_COMPOSE_TABLE_GRID_MAX}, minmax(0, 1.25rem))`,
          }}
          onMouseLeave={() => setHover({ cols: 0, rows: 0 })}
        >
          {Array.from({ length: MAIL_COMPOSE_TABLE_GRID_MAX * MAIL_COMPOSE_TABLE_GRID_MAX }).map(
            (_, index) => {
              const row = Math.floor(index / MAIL_COMPOSE_TABLE_GRID_MAX) + 1;
              const col = (index % MAIL_COMPOSE_TABLE_GRID_MAX) + 1;
              const active = col <= hover.cols && row <= hover.rows;
              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  className={cn(
                    'size-5 rounded-sm border transition-colors',
                    active
                      ? 'border-primary bg-primary/20'
                      : 'border-border/70 bg-muted/30 hover:border-primary/50',
                  )}
                  aria-label={`${col} by ${row} table`}
                  onMouseEnter={() => setHover({ cols: col, rows: row })}
                  onClick={() => insertTable(col, row)}
                />
              );
            },
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
