'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PAGE_HERO_TAB_SCROLL } from '@/components/shared/page-hero/page-hero-constants';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
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
  trailing?: ReactNode;
}

export function CredentialQuickFilterChips({
  vaultScope,
  categoryChips,
  activeCategory,
  onCategoryChange,
  activeQuick,
  onToggleQuick,
  trailing,
}: CredentialQuickFilterChipsProps) {
  const showMineChip = vaultScope === 'all';

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className={cn(PAGE_HERO_TAB_SCROLL, 'min-w-0 flex-1')}>
        <div className="flex w-max flex-nowrap items-center gap-2">
          {categoryChips.map((chip) => {
            const active = activeCategory === chip.value;
            return (
              <Button
                key={chip.value}
                type="button"
                size="sm"
                variant={active ? 'default' : 'outline'}
                className={cn('h-7 shrink-0 rounded-full px-3 text-xs')}
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
              className="h-7 shrink-0 rounded-full px-3 text-xs"
              onClick={() => onToggleQuick('mine')}
            >
              Mine
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant={activeQuick.has('favorites') ? 'default' : 'outline'}
            className="h-7 shrink-0 rounded-full px-3 text-xs"
            onClick={() => onToggleQuick('favorites')}
          >
            <Star size={12} className={activeQuick.has('favorites') ? 'fill-current' : undefined} />
            Favorites
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeQuick.has('needsRotation') ? 'default' : 'outline'}
            className="h-7 shrink-0 rounded-full px-3 text-xs"
            onClick={() => onToggleQuick('needsRotation')}
          >
            Needs rotation
          </Button>
        </div>
      </div>
      {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
    </div>
  );
}
