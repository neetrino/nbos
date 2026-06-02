'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface CredentialVaultSelectCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  ariaLabel: string;
  onToggle: () => void;
  className?: string;
}

function stopRowNavigation(event: { stopPropagation(): void }): void {
  event.stopPropagation();
}

export function CredentialVaultSelectCheckbox({
  checked,
  indeterminate,
  ariaLabel,
  onToggle,
  className,
}: CredentialVaultSelectCheckboxProps) {
  return (
    <span
      data-credential-vault-select
      className="inline-flex"
      onPointerDown={stopRowNavigation}
      onClick={stopRowNavigation}
    >
      <Checkbox
        checked={indeterminate ? ('indeterminate' as const) : checked}
        aria-label={ariaLabel}
        className={cn(className)}
        onPointerDown={stopRowNavigation}
        onClick={stopRowNavigation}
        onCheckedChange={() => onToggle()}
      />
    </span>
  );
}
