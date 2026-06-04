'use client';

import { ArrowRight, Puzzle, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { ProjectExtensionSummary } from '@/lib/api/projects';
import {
  formatDeliveryLifecycleLabel,
  getExtensionSize,
  getExtensionStatus,
} from '@/features/projects/constants/projects';
import { PROJECT_PRODUCTS_CARD_GRID_CLASS } from './project-detail-layout.constants';

interface ProjectExtensionsSectionProps {
  extensions: ProjectExtensionSummary[];
  onOpenExtension: (extension: ProjectExtensionSummary) => void;
}

export function ProjectExtensionsSection({
  extensions,
  onOpenExtension,
}: ProjectExtensionsSectionProps) {
  if (extensions.length === 0) return null;

  return (
    <div className="min-w-0 space-y-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">Extensions</h2>
        <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
          {extensions.length}
        </span>
      </div>

      <div className={PROJECT_PRODUCTS_CARD_GRID_CLASS}>
        {extensions.map((extension) => (
          <ExtensionCard
            key={extension.id}
            extension={extension}
            onOpen={() => onOpenExtension(extension)}
          />
        ))}
      </div>
    </div>
  );
}

function ExtensionCard({
  extension,
  onOpen,
}: {
  extension: ProjectExtensionSummary;
  onOpen: () => void;
}) {
  const status = getExtensionStatus(extension.status);
  const size = getExtensionSize(extension.size);
  const statusLabel = extension.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(extension.deliveryLifecycle)
    : status?.label;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className="bg-card border-border hover:border-accent/50 group flex h-full min-h-36 min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border p-4 transition-colors"
    >
      <div className="min-w-0 shrink-0">
        <div className="flex items-start gap-2">
          <Puzzle className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold">{extension.name}</h4>
            <p className="text-muted-foreground truncate text-xs">{extension.product.name}</p>
          </div>
        </div>
        {(size || status) && (
          <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-2 text-xs">
            {size && <span>{size.label}</span>}
            {status && !extension.deliveryLifecycle && <span>{status.label}</span>}
          </div>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1">
        {extension.assignee && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <User size={12} aria-hidden />
            <span className="truncate">
              {extension.assignee.firstName} {extension.assignee.lastName}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2">
        <div className="text-muted-foreground text-[10px]">{extension._count.tasks} tasks</div>
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          {statusLabel && (
            <StatusBadge
              label={statusLabel}
              variant={status?.variant ?? 'gray'}
              className="max-w-full min-w-0 shrink truncate"
              title={statusLabel}
            />
          )}
          <ArrowRight
            size={14}
            className="text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
