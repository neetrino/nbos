'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';

export interface CredentialFormCategoryMenuProps {
  category: string;
  categoryLabel: string;
  categoryOptions: readonly CredentialCategoryOption[];
  categoryLocked: boolean;
  onCategoryChange: (value: string) => void;
}

export function CredentialFormCategoryMenu({
  category,
  categoryLabel,
  categoryOptions,
  categoryLocked,
  onCategoryChange,
}: CredentialFormCategoryMenuProps) {
  if (categoryLocked) {
    return <span className="text-muted-foreground text-xs">{categoryLabel}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          'text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5',
          'rounded-md text-xs font-medium outline-none',
        )}
      >
        {categoryLabel}
        <ChevronDown className="size-3 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[10rem]">
        {categoryOptions.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onCategoryChange(opt.value)}
            className={opt.value === category ? 'bg-accent' : undefined}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
