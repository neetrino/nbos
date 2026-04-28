import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { EXTENSION_STATUSES } from '@/features/projects/constants/projects';
import type { Extension } from '@/lib/api/extensions';

interface ExtensionsTabHeaderProps {
  extensions: Extension[];
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  onCreateClick: () => void;
}

export function ExtensionsTabHeader({
  extensions,
  statusFilter,
  onStatusFilterChange,
  onCreateClick,
}: ExtensionsTabHeaderProps) {
  const doneCount = extensions.filter((extension) => extension.status === 'DONE').length;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{extensions.length} extensions</span>
        {extensions.length > 0 && (
          <span className="text-muted-foreground text-xs">({doneCount} done)</span>
        )}
        <ExtensionStatusFilters
          extensions={extensions}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      </div>
      <Button size="sm" onClick={onCreateClick} className="gap-1.5">
        <Plus size={14} />
        New Extension
      </Button>
    </div>
  );
}

function ExtensionStatusFilters({
  extensions,
  statusFilter,
  onStatusFilterChange,
}: {
  extensions: Extension[];
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
}) {
  return (
    <div className="flex gap-1">
      <StatusFilterButton active={statusFilter === null} onClick={() => onStatusFilterChange(null)}>
        All
      </StatusFilterButton>
      {EXTENSION_STATUSES.filter((status) => countByStatus(extensions, status.value) > 0).map(
        (status) => (
          <StatusFilterButton
            key={status.value}
            active={statusFilter === status.value}
            onClick={() => onStatusFilterChange(status.value)}
          >
            {status.label} ({countByStatus(extensions, status.value)})
          </StatusFilterButton>
        ),
      )}
    </div>
  );
}

function StatusFilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      className="h-7 text-xs"
    >
      {children}
    </Button>
  );
}

function countByStatus(extensions: Extension[], status: string): number {
  return extensions.filter((extension) => extension.status === status).length;
}
