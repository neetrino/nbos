'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CREDENTIAL_QUICK_CATEGORY_FILTERS,
  type CredentialQuickFilterKey,
} from '@/features/credentials/constants/credential-vault';

export interface CredentialQuickFilterChipsProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  activeQuick: Set<CredentialQuickFilterKey>;
  onToggleQuick: (key: CredentialQuickFilterKey) => void;
}

export function CredentialQuickFilterChips({
  activeCategory,
  onCategoryChange,
  activeQuick,
  onToggleQuick,
}: CredentialQuickFilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CREDENTIAL_QUICK_CATEGORY_FILTERS.map((chip) => {
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
      <Button
        type="button"
        size="sm"
        variant={activeQuick.has('mine') ? 'default' : 'outline'}
        className="h-7 rounded-full px-3 text-xs"
        onClick={() => onToggleQuick('mine')}
      >
        Mine
      </Button>
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
