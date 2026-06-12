import type { DragEvent } from 'react';

/** Custom MIME for HTML5 drag of credential ids (vault folders view). */
export const CREDENTIAL_VAULT_DRAG_MIME = 'application/x-nbos-credential-ids';

export type CredentialVaultDragPayload = { credentialIds: readonly string[] };

export function stringifyCredentialVaultDragPayload(payload: CredentialVaultDragPayload): string {
  return JSON.stringify({ credentialIds: [...payload.credentialIds] });
}

export function parseCredentialVaultDragPayload(raw: string): CredentialVaultDragPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('credentialIds' in parsed)) return null;
    const ids = (parsed as { credentialIds: unknown }).credentialIds;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) return null;
    return { credentialIds: ids };
  } catch {
    return null;
  }
}

export function dataTransferHasCredentialVaultDrag(dataTransfer: DataTransfer): boolean {
  return [...dataTransfer.types].includes(CREDENTIAL_VAULT_DRAG_MIME);
}

/** When set, credential cards can be dragged onto folder drop targets. */
export type CredentialVaultCardDragConfig = {
  resolveDragCredentialIds: (credentialId: string) => string[];
  onDragStart?: (credentialIds: readonly string[]) => void;
  onDragEnd?: () => void;
};

export type CredentialFolderDropHandlers = {
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
};

const VAULT_DRAG_COUNT_MARKER = 'data-credential-vault-drag-count';

/** Temporary count badge on the draggable card surface (native drag ghost). */
export function attachCredentialVaultDragCount(source: HTMLElement, count: number): void {
  source.classList.remove('overflow-hidden');
  source.classList.add('overflow-visible');
  const badge = document.createElement('span');
  badge.setAttribute(VAULT_DRAG_COUNT_MARKER, 'true');
  badge.className =
    'bg-primary text-primary-foreground ring-background pointer-events-none absolute -top-3 -right-3 z-30 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-bold tabular-nums shadow-md ring-2';
  badge.textContent = String(count);
  source.appendChild(badge);
}

export function detachCredentialVaultDragCount(source: HTMLElement): void {
  source.querySelector(`[${VAULT_DRAG_COUNT_MARKER}]`)?.remove();
  source.classList.add('overflow-hidden');
  source.classList.remove('overflow-visible');
}
