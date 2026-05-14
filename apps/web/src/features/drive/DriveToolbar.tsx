import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function DriveToolbar({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="border-border/70 bg-card/80 rounded-3xl border p-3">
      <div className="relative min-w-0">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name or filename…"
          className="pl-9"
        />
      </div>
    </div>
  );
}
