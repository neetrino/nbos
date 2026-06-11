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
};

export type CredentialFolderDropHandlers = {
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
};
