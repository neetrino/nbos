import type { DragEvent } from 'react';

export const MAIL_DRAG_MIME = 'application/x-nbos-mail-account';

const MAILBOX_DRAG_PREVIEW_CLASS =
  'bg-popover text-foreground pointer-events-none fixed top-0 -left-[9999px] z-50 w-80 rounded-md shadow-md';

export function readDragAccountId(event: DragEvent): string | null {
  const raw =
    event.dataTransfer.getData(MAIL_DRAG_MIME) || event.dataTransfer.getData('text/plain');
  const id = raw.trim();
  return id.length > 0 ? id : null;
}

export function writeMailboxDragPayload(
  event: DragEvent,
  accountId: string,
  emailAddress: string,
): void {
  event.dataTransfer.setData(MAIL_DRAG_MIME, accountId);
  event.dataTransfer.setData('text/plain', emailAddress);
  event.dataTransfer.effectAllowed = 'move';
}

/**
 * Native drag ghosts the source node (the grip). Clone the row so the cursor
 * shows the mailbox address instead of a 28px square.
 */
export function setMailboxRowDragImage(event: DragEvent, row: HTMLElement): void {
  const preview = row.cloneNode(true);
  if (!(preview instanceof HTMLElement)) {
    return;
  }
  preview.className = `${row.className} ${MAILBOX_DRAG_PREVIEW_CLASS}`;
  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(preview, 20, Math.max(row.offsetHeight / 2, 12));
  window.requestAnimationFrame(() => {
    preview.remove();
  });
}
