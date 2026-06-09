'use client';

import type { Editor } from '@tiptap/core';
import { Table2 } from 'lucide-react';
import { MailComposeTableGrid } from './mail-compose-table-grid';
import { ComposeToolbarBtn, ComposeToolbarIconShell } from './mail-compose-toolbar-shared';

export function MailComposeTableControls({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled?: boolean;
}) {
  return (
    <>
      <MailComposeTableGrid editor={editor} disabled={disabled}>
        <ComposeToolbarIconShell
          label="Insert table"
          disabled={disabled}
          active={editor.isActive('table')}
        >
          <Table2 size={15} strokeWidth={2.25} />
        </ComposeToolbarIconShell>
      </MailComposeTableGrid>

      {editor.isActive('table') ? (
        <>
          <ComposeToolbarBtn
            label="Add row after"
            disabled={disabled}
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            <span className="text-[10px] font-semibold">+R</span>
          </ComposeToolbarBtn>
          <ComposeToolbarBtn
            label="Delete row"
            disabled={disabled}
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            <span className="text-[10px] font-semibold">−R</span>
          </ComposeToolbarBtn>
          <ComposeToolbarBtn
            label="Add column after"
            disabled={disabled}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            <span className="text-[10px] font-semibold">+C</span>
          </ComposeToolbarBtn>
          <ComposeToolbarBtn
            label="Delete column"
            disabled={disabled}
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            <span className="text-[10px] font-semibold">−C</span>
          </ComposeToolbarBtn>
          <ComposeToolbarBtn
            label="Delete table"
            disabled={disabled}
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <span className="text-[10px] font-semibold">×T</span>
          </ComposeToolbarBtn>
        </>
      ) : null}
    </>
  );
}
