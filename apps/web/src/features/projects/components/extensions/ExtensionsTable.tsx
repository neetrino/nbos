'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import {
  EXTENSION_STATUSES,
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
  getExtensionSize,
  getExtensionStatus,
} from '@/features/projects/constants/projects';
import type { Extension } from '@/lib/api/extensions';
import {
  DeliveryLifecycleActionDialog,
  type DeliveryLifecycleAction,
  type DeliveryLifecycleActionPayload,
} from '@/features/projects/components/DeliveryLifecycleActionDialog';
import { ExtensionReadiness } from './ExtensionReadiness';
import { getNextExtensionTarget } from './extension-status-flow';

interface ExtensionsTableProps {
  extensions: Extension[];
  onStatusChange: (extension: Extension, nextStatus: string) => void;
  onLifecycleAction: (
    extension: Extension,
    action: DeliveryLifecycleAction | 'resume',
    payload?: DeliveryLifecycleActionPayload,
  ) => void | Promise<void>;
}

export function ExtensionsTable({
  extensions,
  onStatusChange,
  onLifecycleAction,
}: ExtensionsTableProps) {
  const [dialogAction, setDialogAction] = useState<DeliveryLifecycleAction | null>(null);
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);

  const openLifecycleDialog = (extension: Extension, action: DeliveryLifecycleAction) => {
    setSelectedExtension(extension);
    setDialogAction(action);
  };

  const handleDialogConfirm = async (payload: DeliveryLifecycleActionPayload) => {
    if (!selectedExtension || !dialogAction) return;
    await onLifecycleAction(selectedExtension, dialogAction, payload);
    setSelectedExtension(null);
    setDialogAction(null);
  };

  return (
    <>
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
                onLifecycleAction={onLifecycleAction}
                onOpenLifecycleDialog={openLifecycleDialog}
              />
            ))}
          </tbody>
        </table>
      </div>
      <DeliveryLifecycleActionDialog
        action={dialogAction}
        entityLabel={selectedExtension?.name ?? 'extension'}
        isSubmitting={false}
        onOpenChange={(open) => {
          if (open) return;
          setSelectedExtension(null);
          setDialogAction(null);
        }}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
}

function ExtensionTableRow({
  extension,
  onStatusChange,
  onLifecycleAction,
  onOpenLifecycleDialog,
}: {
  extension: Extension;
  onStatusChange: (extension: Extension, nextStatus: string) => void;
  onLifecycleAction: (extension: Extension, action: 'resume') => void | Promise<void>;
  onOpenLifecycleDialog: (extension: Extension, action: DeliveryLifecycleAction) => void;
}) {
  return (
    <tr className="border-border border-t">
      <ExtensionNameCell extension={extension} />
      <td className="text-muted-foreground px-4 py-2.5 text-xs">
        {extension.product?.name ?? '-'}
      </td>
      <ExtensionSizeCell size={extension.size} />
      <ExtensionStatusCell extension={extension} />
      <ExtensionAssigneeCell extension={extension} />
      <td className="text-muted-foreground px-4 py-2.5 text-xs">{extension._count.tasks}</td>
      <ExtensionActionCell
        extension={extension}
        onStatusChange={onStatusChange}
        onLifecycleAction={onLifecycleAction}
        onOpenLifecycleDialog={onOpenLifecycleDialog}
      />
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

function ExtensionStatusCell({ extension }: { extension: Extension }) {
  const extensionStatus = getExtensionStatus(extension.status);
  const label = extension.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(extension.deliveryLifecycle)
    : extensionStatus?.label;
  const variant = extension.deliveryLifecycle
    ? getDeliveryLifecycleVariant(extension.deliveryLifecycle)
    : extensionStatus?.variant;
  return (
    <td className="px-4 py-2.5">
      {label && <StatusBadge label={label} variant={variant ?? 'gray'} />}
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
  onLifecycleAction,
  onOpenLifecycleDialog,
}: {
  extension: Extension;
  onStatusChange: (extension: Extension, nextStatus: string) => void;
  onLifecycleAction: (extension: Extension, action: 'resume') => void | Promise<void>;
  onOpenLifecycleDialog: (extension: Extension, action: DeliveryLifecycleAction) => void;
}) {
  const nextStatus = getNextExtensionTarget(extension.deliveryLifecycle);
  const lifecycle = extension.deliveryLifecycle;
  if (lifecycle?.isTerminal) return <td className="px-4 py-2.5" />;

  return (
    <td className="px-4 py-2.5 text-right">
      <div className="flex flex-wrap justify-end gap-1.5">
        {nextStatus && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onStatusChange(extension, nextStatus)}
          >
            -&gt; {EXTENSION_STATUSES.find((status) => status.value === nextStatus)?.label}
          </Button>
        )}
        {lifecycle?.workStatus === 'ON_HOLD' ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs"
            onClick={() => void onLifecycleAction(extension, 'resume')}
          >
            Resume
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenLifecycleDialog(extension, 'pause')}
          >
            Pause
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onOpenLifecycleDialog(extension, 'cancel')}
        >
          Cancel
        </Button>
      </div>
    </td>
  );
}
