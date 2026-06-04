'use client';

import { ArrowRight, Puzzle, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import {
  formatDeliveryLifecycleLabel,
  getExtensionSize,
  getExtensionStatus,
} from '@/features/projects/constants/projects';
import {
  PROJECT_ENTITY_LIST_CLASS,
  PROJECT_ENTITY_LIST_ROW_CLASS,
  PROJECT_PRODUCTS_CARD_GRID_CLASS,
} from '@/features/projects/components/project-detail-layout.constants';
import type { ExtensionEntityViewModel } from '@/features/projects/utils/extension-entity-view-model';

interface ExtensionEntityViewsProps {
  extensions: ExtensionEntityViewModel[];
  viewMode: 'card' | 'list';
  onOpen?: (id: string) => void;
}

export function ExtensionEntityViews({ extensions, viewMode, onOpen }: ExtensionEntityViewsProps) {
  if (viewMode === 'list') {
    return (
      <div className={PROJECT_ENTITY_LIST_CLASS}>
        {extensions.map((extension) => (
          <ExtensionEntityListRow
            key={extension.id}
            extension={extension}
            onOpen={onOpen ? () => onOpen(extension.id) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={PROJECT_PRODUCTS_CARD_GRID_CLASS}>
      {extensions.map((extension) => (
        <ExtensionEntityCard
          key={extension.id}
          extension={extension}
          onOpen={onOpen ? () => onOpen(extension.id) : undefined}
        />
      ))}
    </div>
  );
}

export function ExtensionEntityListRow({
  extension,
  onOpen,
}: {
  extension: ExtensionEntityViewModel;
  onOpen?: () => void;
}) {
  const status = getExtensionStatus(extension.status);
  const size = getExtensionSize(extension.size);
  const statusLabel = extension.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(extension.deliveryLifecycle)
    : status?.label;
  const Wrapper = onOpen ? 'button' : 'div';

  return (
    <Wrapper
      type={onOpen ? 'button' : undefined}
      onClick={onOpen}
      className={
        onOpen ? PROJECT_ENTITY_LIST_ROW_CLASS : `${PROJECT_ENTITY_LIST_ROW_CLASS} cursor-default`
      }
    >
      <Puzzle className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{extension.name}</span>
          {size && <span className="text-muted-foreground text-xs">{size.label}</span>}
        </div>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          {extension.productName ? <span className="truncate">{extension.productName}</span> : null}
          {extension.assignee ? (
            <span className="inline-flex items-center gap-1">
              <User size={11} aria-hidden />
              {extension.assignee.firstName} {extension.assignee.lastName}
            </span>
          ) : null}
          {extension.taskCount != null ? <span>{extension.taskCount} tasks</span> : null}
          {extension.createdAt ? (
            <span>{new Date(extension.createdAt).toLocaleDateString()}</span>
          ) : null}
        </div>
      </div>
      {statusLabel ? (
        <StatusBadge label={statusLabel} variant={status?.variant ?? 'gray'} className="shrink-0" />
      ) : null}
    </Wrapper>
  );
}

export function ExtensionEntityCard({
  extension,
  onOpen,
}: {
  extension: ExtensionEntityViewModel;
  onOpen?: () => void;
}) {
  const status = getExtensionStatus(extension.status);
  const size = getExtensionSize(extension.size);
  const statusLabel = extension.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(extension.deliveryLifecycle)
    : status?.label;

  return (
    <div
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
      className={
        onOpen
          ? 'bg-card border-border hover:border-accent/50 group flex h-full min-h-36 min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border p-4 transition-colors'
          : 'bg-card border-border flex h-full min-h-36 min-w-0 flex-col overflow-hidden rounded-xl border p-4'
      }
    >
      <div className="min-w-0 shrink-0">
        <div className="flex items-start gap-2">
          <Puzzle className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold">{extension.name}</h4>
            {extension.productName ? (
              <p className="text-muted-foreground truncate text-xs">{extension.productName}</p>
            ) : null}
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
        {extension.assignee ? (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <User size={12} aria-hidden />
            <span className="truncate">
              {extension.assignee.firstName} {extension.assignee.lastName}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2">
        {extension.taskCount != null ? (
          <div className="text-muted-foreground text-[10px]">{extension.taskCount} tasks</div>
        ) : null}
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          {statusLabel ? (
            <StatusBadge
              label={statusLabel}
              variant={status?.variant ?? 'gray'}
              className="max-w-full min-w-0 shrink truncate"
              title={statusLabel}
            />
          ) : null}
          {onOpen ? (
            <ArrowRight
              size={14}
              className="text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
