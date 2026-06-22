'use client';

import { FilePlus, Folder } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentListItem } from '@/lib/api/documents';
import { CollapsibleRow, DocList } from './documents-sidebar-nodes';

export interface EntityRowState {
  id: string;
  entityType: string;
  label: string;
  code?: string;
  docs: DocumentListItem[];
  docsLoaded: boolean;
  open: boolean;
}

interface EntityNodeRowProps {
  entity: EntityRowState;
  activeDocId: string | undefined;
  isActive: boolean;
  canAddDoc: boolean;
  onToggle: () => void;
  onNewDoc: () => void;
}

function EntityNodeRow({
  entity,
  activeDocId,
  isActive,
  canAddDoc,
  onToggle,
  onNewDoc,
}: EntityNodeRowProps) {
  return (
    <CollapsibleRow
      label={entity.label}
      icon={<Folder size={13} aria-hidden className="shrink-0 opacity-70" />}
      open={entity.open}
      onToggle={onToggle}
      active={isActive}
      indent
      actions={
        canAddDoc && isActive ? (
          <button
            type="button"
            aria-label={`New document in ${entity.label}`}
            className="text-muted-foreground hover:text-foreground flex size-4 items-center justify-center rounded"
            onClick={(e) => {
              e.stopPropagation();
              onNewDoc();
            }}
          >
            <FilePlus size={11} aria-hidden />
          </button>
        ) : null
      }
    >
      <DocList docs={entity.docs} docsLoaded={entity.docsLoaded} activeDocId={activeDocId} />
    </CollapsibleRow>
  );
}

export interface EntityListProps {
  entities: EntityRowState[];
  entitiesLoaded: boolean;
  activeDocId: string | undefined;
  activeEntityId: string | null;
  /** Permission: user has ADD on DOCUMENTS. */
  canAdd: boolean;
  /** When false, FilePlus is hidden even if canAdd is true (folder-only library categories). */
  canAddDoc?: boolean;
  onToggleEntity: (entityId: string) => void;
  onNewDoc: () => void;
}

export function EntityList({
  entities,
  entitiesLoaded,
  activeDocId,
  activeEntityId,
  canAdd,
  canAddDoc,
  onToggleEntity,
  onNewDoc,
}: EntityListProps) {
  const allowDocCreate = canAdd && (canAddDoc ?? true);

  if (!entitiesLoaded) {
    return (
      <div className="mt-0.5 space-y-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full rounded" />
        ))}
      </div>
    );
  }
  if (entities.length === 0) {
    return <p className="text-muted-foreground px-2 py-0.5 text-xs">No items</p>;
  }
  return (
    <ul className="space-y-0.5">
      {entities.map((entity) => (
        <li key={`${entity.entityType}:${entity.id}`}>
          <EntityNodeRow
            entity={entity}
            activeDocId={activeDocId}
            isActive={activeEntityId === entity.id}
            canAddDoc={allowDocCreate}
            onToggle={() => onToggleEntity(entity.id)}
            onNewDoc={onNewDoc}
          />
        </li>
      ))}
    </ul>
  );
}
