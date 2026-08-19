'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { formatGlobalSearchShortcutLabel } from './global-search-constants';
import { hasAnyGlobalSearchModule } from './global-search-permissions';
import { useGlobalSearch } from './GlobalSearchProvider';

export function GlobalSearchTrigger({ className }: { className?: string }) {
  const { can, isLoading } = usePermission();
  const { openGlobalSearch } = useGlobalSearch();

  if (isLoading || !hasAnyGlobalSearchModule(can)) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={openGlobalSearch}
      className={cn(
        'text-muted-foreground hover:text-foreground hidden h-9 gap-2 rounded-xl px-3 md:inline-flex',
        className,
      )}
      aria-label="Open global search"
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="hidden lg:inline">Search</span>
      <kbd className="bg-muted text-muted-foreground hidden rounded-md px-1.5 py-0.5 text-[10px] font-medium lg:inline">
        {formatGlobalSearchShortcutLabel()}
      </kbd>
    </Button>
  );
}

export function GlobalSearchMobileTrigger({ className }: { className?: string }) {
  const { can, isLoading } = usePermission();
  const { openGlobalSearch } = useGlobalSearch();

  if (isLoading || !hasAnyGlobalSearchModule(can)) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={openGlobalSearch}
      className={cn('text-muted-foreground md:hidden', className)}
      aria-label="Open global search"
    >
      <Search className="size-4" />
    </Button>
  );
}
