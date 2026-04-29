import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { Extension } from '@/lib/api/extensions';
import {
  EXTENSION_LIFECYCLE_FILTERS,
  getExtensionLifecycleFilterValue,
} from './extension-status-flow';

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
  const doneCount = extensions.filter(
    (extension) => getExtensionLifecycleFilterValue(extension) === 'DONE',
  ).length;

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
      {EXTENSION_LIFECYCLE_FILTERS.filter(
        (status) => countByLifecycle(extensions, status.value) > 0,
      ).map((status) => (
        <StatusFilterButton
          key={status.value}
          active={statusFilter === status.value}
          onClick={() => onStatusFilterChange(status.value)}
        >
          {status.label} ({countByLifecycle(extensions, status.value)})
        </StatusFilterButton>
      ))}
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

function countByLifecycle(extensions: Extension[], value: string): number {
  return extensions.filter((extension) => getExtensionLifecycleFilterValue(extension) === value)
    .length;
}
