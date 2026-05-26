'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LIST_SEARCH_INPUT_PROPS } from '../list-search-input-props';
import { useHeroSearchExpansionState } from './page-hero-toolbar-context';

export interface PageHeroSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PageHeroSearch({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: PageHeroSearchProps) {
  const [focused, setFocused] = useState(false);
  const hasQuery = value.trim().length > 0;

  useHeroSearchExpansionState({ focused, panelOpen: false, hasQuery });

  return (
    <div className={cn('relative min-w-0', className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
        aria-hidden
      />
      <Input
        {...LIST_SEARCH_INPUT_PROPS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label={placeholder}
        role="searchbox"
        className="bg-muted/50 border-border/60 h-11 rounded-2xl pl-11 text-base shadow-none md:text-base"
      />
    </div>
  );
}
