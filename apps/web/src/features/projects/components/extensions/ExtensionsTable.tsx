import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import {
  EXTENSION_STATUSES,
  getExtensionSize,
  getExtensionStatus,
} from '@/features/projects/constants/projects';
import type { Extension } from '@/lib/api/extensions';
import { ExtensionReadiness } from './ExtensionReadiness';
import { getNextExtensionStatus, isActiveExtensionStatus } from './extension-status-flow';

interface ExtensionsTableProps {
  extensions: Extension[];
  onStatusChange: (extension: Extension, nextStatus: string) => void;
}

export function ExtensionsTable({ extensions, onStatusChange }: ExtensionsTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Extension</th>
            <th className="px-4 py-2.5 text-left font-medium">Product</th>
            <th className="px-4 py-2.5 text-left font-medium">Size</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Assignee</th>
            <th className="px-4 py-2.5 text-left font-medium">Tasks</th>
            <th className="px-4 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {extensions.map((extension) => (
            <ExtensionTableRow
              key={extension.id}
              extension={extension}
              onStatusChange={onStatusChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExtensionTableRow({
  extension,
  onStatusChange,
}: {
  extension: Extension;
  onStatusChange: (extension: Extension, nextStatus: string) => void;
}) {
  return (
    <tr className="border-border border-t">
      <ExtensionNameCell extension={extension} />
      <td className="text-muted-foreground px-4 py-2.5 text-xs">
        {extension.product?.name ?? '-'}
      </td>
      <ExtensionSizeCell size={extension.size} />
      <ExtensionStatusCell status={extension.status} />
      <ExtensionAssigneeCell extension={extension} />
      <td className="text-muted-foreground px-4 py-2.5 text-xs">{extension._count.tasks}</td>
      <ExtensionActionCell extension={extension} onStatusChange={onStatusChange} />
    </tr>
  );
}

function ExtensionNameCell({ extension }: { extension: Extension }) {
  return (
    <td className="px-4 py-2.5">
      <p className="font-medium">{extension.name}</p>
      {extension.description && (
        <p className="text-muted-foreground max-w-[200px] truncate text-xs">
          {extension.description}
        </p>
      )}
      <ExtensionReadiness extension={extension} />
    </td>
  );
}

function ExtensionSizeCell({ size }: { size: string }) {
  const extensionSize = getExtensionSize(size);
  return (
    <td className="px-4 py-2.5">
      {extensionSize && <StatusBadge label={extensionSize.label} variant={extensionSize.variant} />}
    </td>
  );
}

function ExtensionStatusCell({ status }: { status: string }) {
  const extensionStatus = getExtensionStatus(status);
  return (
    <td className="px-4 py-2.5">
      {extensionStatus && (
        <StatusBadge label={extensionStatus.label} variant={extensionStatus.variant} />
      )}
    </td>
  );
}

function ExtensionAssigneeCell({ extension }: { extension: Extension }) {
  if (!extension.assignee) {
    return <td className="text-muted-foreground px-4 py-2.5 text-xs">-</td>;
  }

  return (
    <td className="px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <User size={12} className="text-muted-foreground" />
        <span className="text-xs">
          {extension.assignee.firstName} {extension.assignee.lastName}
        </span>
      </div>
    </td>
  );
}

function ExtensionActionCell({
  extension,
  onStatusChange,
}: {
  extension: Extension;
  onStatusChange: (extension: Extension, nextStatus: string) => void;
}) {
  const nextStatus = getNextExtensionStatus(extension.status);
  if (!nextStatus || !isActiveExtensionStatus(extension.status))
    return <td className="px-4 py-2.5" />;

  return (
    <td className="px-4 py-2.5 text-right">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={() => onStatusChange(extension, nextStatus)}
      >
        -&gt; {EXTENSION_STATUSES.find((status) => status.value === nextStatus)?.label}
      </Button>
    </td>
  );
}
