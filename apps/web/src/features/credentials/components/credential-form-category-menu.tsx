'use client';

import { ChevronDown } from 'lucide-react';
import { CredentialCategoryIcon } from '@/features/credentials/components/credential-meta-icon';
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
    return (
      <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1.5 text-sm font-medium">
        <CredentialCategoryIcon
          category={category}
          className="size-3.5 shrink-0 opacity-80"
          aria-hidden
        />
        {categoryLabel}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          'text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1',
          'rounded-md px-1.5 py-1 text-sm font-medium outline-none',
        )}
      >
        <CredentialCategoryIcon
          category={category}
          className="size-3.5 shrink-0 opacity-80"
          aria-hidden
        />
        {categoryLabel}
        <ChevronDown className="size-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[10rem]">
        {categoryOptions.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onCategoryChange(opt.value)}
            className={cn(
              'gap-2',
              opt.value === category ? 'bg-accent text-accent-foreground' : undefined,
            )}
          >
            <CredentialCategoryIcon
              category={opt.value}
              className="size-3.5 shrink-0 opacity-80"
              aria-hidden
            />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
