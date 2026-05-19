'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  return (
    <div className={cn('relative min-w-0', className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="bg-muted/50 border-border/60 h-11 rounded-2xl pl-11 text-base shadow-none md:text-base"
      />
    </div>
  );
}
