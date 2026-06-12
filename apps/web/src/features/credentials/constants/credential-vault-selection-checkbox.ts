import { cn } from '@/lib/utils';

/** Opacity only — hit target stays active so clicks do not reach row/card open handlers. */
export function credentialVaultCheckboxRevealClass(
  selectionActive: boolean,
  selected: boolean,
  groupHoverClass: string,
): string {
  const pinned = selectionActive || selected;
  return cn(
    'pointer-events-auto transition-opacity duration-150',
    pinned ? 'opacity-100' : cn('opacity-0', groupHoverClass, 'focus-within:opacity-100'),
  );
}

/** Ignore row/card navigation when the event originated on the vault select checkbox. */
export function isCredentialVaultCheckboxTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.closest('[data-credential-vault-select]') !== null ||
    target.closest('[data-credential-vault-action]') !== null
  );
}
