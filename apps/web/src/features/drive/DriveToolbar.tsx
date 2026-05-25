import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';

const SEARCH_PLACEHOLDER = 'Search by name or filename…';

export function DriveToolbar({
  search,
  onSearchChange,
  variant = 'card',
}: {
  search: string;
  onSearchChange: (value: string) => void;
  variant?: 'card' | 'header';
}) {
  const field = (
    <div className="relative min-w-0">
      <Search
        className={cn(
          'text-muted-foreground pointer-events-none absolute top-1/2 -translate-y-1/2',
          variant === 'header' ? 'left-3.5 size-5' : 'left-3 size-4',
        )}
        aria-hidden
      />
      <Input
        {...LIST_SEARCH_INPUT_PROPS}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label={SEARCH_PLACEHOLDER}
        role="searchbox"
        className={cn(
          variant === 'header' ? 'pl-11' : 'pl-9',
          variant === 'header' &&
            'bg-muted/50 border-border/60 h-11 rounded-2xl text-base shadow-none md:text-base',
        )}
      />
    </div>
  );

  if (variant === 'header') {
    return field;
  }

  return <div className="border-border/70 bg-card/80 rounded-3xl border p-3">{field}</div>;
}
