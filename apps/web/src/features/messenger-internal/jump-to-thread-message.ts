import {
  SHEET_REPLY_JUMP_FLASH_DELAY_MS,
  SHEET_REPLY_JUMP_FLASH_MS,
} from './internal-messenger.constants';

let flashTimer: ReturnType<typeof setTimeout> | undefined;
let flashTarget: HTMLElement | null = null;

export function jumpToThreadMessage(messageId: string): void {
  const node = document.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
  if (!(node instanceof HTMLElement)) return;
  node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  scheduleReplyJumpFlash(node);
}

function scheduleReplyJumpFlash(node: HTMLElement): void {
  clearReplyJumpFlash();
  flashTimer = setTimeout(() => {
    flashTarget = node;
    node.dataset.replyFlash = '';
    flashTimer = setTimeout(() => {
      delete node.dataset.replyFlash;
      flashTarget = null;
    }, SHEET_REPLY_JUMP_FLASH_MS);
  }, SHEET_REPLY_JUMP_FLASH_DELAY_MS);
}

function clearReplyJumpFlash(): void {
  if (flashTimer !== undefined) clearTimeout(flashTimer);
  flashTimer = undefined;
  if (flashTarget) delete flashTarget.dataset.replyFlash;
  flashTarget = null;
}
