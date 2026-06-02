'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CredentialQuickFilterKey } from '@/features/credentials/constants/credential-vault';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';

export interface CredentialQuickFilterChipsProps {
  vaultScope: CredentialVaultScope;
  categoryChips: readonly CredentialCategoryOption[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  activeQuick: Set<CredentialQuickFilterKey>;
  onToggleQuick: (key: CredentialQuickFilterKey) => void;
}

export function CredentialQuickFilterChips({
  vaultScope,
  categoryChips,
  activeCategory,
  onCategoryChange,
  activeQuick,
  onToggleQuick,
}: CredentialQuickFilterChipsProps) {
  const showMineChip = vaultScope === 'all';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {categoryChips.map((chip) => {
        const active = activeCategory === chip.value;
        return (
          <Button
            key={chip.value}
            type="button"
            size="sm"
            variant={active ? 'default' : 'outline'}
            className={cn('h-7 rounded-full px-3 text-xs')}
            onClick={() => onCategoryChange(active ? null : chip.value)}
          >
            {chip.label}
          </Button>
        );
      })}
      {showMineChip && (
        <Button
          type="button"
          size="sm"
          variant={activeQuick.has('mine') ? 'default' : 'outline'}
          className="h-7 rounded-full px-3 text-xs"
          onClick={() => onToggleQuick('mine')}
        >
          Mine
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant={activeQuick.has('needsRotation') ? 'default' : 'outline'}
        className="h-7 rounded-full px-3 text-xs"
        onClick={() => onToggleQuick('needsRotation')}
      >
        Needs rotation
      </Button>
    </div>
  );
}
