'use client';

import { ArrowRight, Puzzle, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { ProjectExtensionSummary } from '@/lib/api/projects';
import {
  formatDeliveryLifecycleLabel,
  getExtensionSize,
  getExtensionStatus,
} from '@/features/projects/constants/projects';
import {
  PROJECT_ENTITY_LIST_CLASS,
  PROJECT_PRODUCTS_CARD_GRID_CLASS,
  PROJECT_SECTION_TITLE_CLASS,
  type ProjectDetailViewMode,
} from './project-detail-layout.constants';

interface ProjectExtensionsSectionProps {
  extensions: ProjectExtensionSummary[];
  viewMode: ProjectDetailViewMode;
  onOpenExtension: (extension: ProjectExtensionSummary) => void;
}

export function ProjectExtensionsSection({
  extensions,
  viewMode,
  onOpenExtension,
}: ProjectExtensionsSectionProps) {
  if (extensions.length === 0) return null;

  return (
    <div className="min-w-0 space-y-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <h2 className={PROJECT_SECTION_TITLE_CLASS}>Extensions</h2>
        <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {extensions.length}
        </span>
      </div>

      {viewMode === 'list' ? (
        <div className={PROJECT_ENTITY_LIST_CLASS}>
          {extensions.map((extension) => (
            <ExtensionListRow
              key={extension.id}
              extension={extension}
              onOpen={() => onOpenExtension(extension)}
            />
          ))}
        </div>
      ) : (
        <div className={PROJECT_PRODUCTS_CARD_GRID_CLASS}>
          {extensions.map((extension) => (
            <ExtensionCard
              key={extension.id}
              extension={extension}
              onOpen={() => onOpenExtension(extension)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExtensionListRow({
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
    <button
      type="button"
      onClick={onOpen}
      className="hover:bg-secondary/50 group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
    >
      <Puzzle className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{extension.name}</span>
          {size && <span className="text-muted-foreground text-xs">{size.label}</span>}
        </div>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span className="truncate">{extension.product.name}</span>
          {extension.assignee && (
            <span className="inline-flex items-center gap-1">
              <User size={11} aria-hidden />
              {extension.assignee.firstName} {extension.assignee.lastName}
            </span>
          )}
          <span>{extension._count.tasks} tasks</span>
        </div>
      </div>
      {statusLabel && (
        <StatusBadge label={statusLabel} variant={status?.variant ?? 'gray'} className="shrink-0" />
      )}
      <ArrowRight
        size={14}
        className="text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
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
