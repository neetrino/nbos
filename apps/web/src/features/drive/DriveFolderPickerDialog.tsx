'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { driveApi, type DriveFolder } from '@/lib/api/drive';
import { cn } from '@/lib/utils';
import type { DriveEntityFolderScope } from './drive-entity-folder-scope';
import { buildFolderTree, type FolderTreeNode } from './drive-folder-tree';

export function DriveFolderPickerDialog({
  open,
  onOpenChange,
  space,
  entityScope,
  title,
  description,
  confirmLabel,
  excludeFolderIds,
  initialSelectedFolderId,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: 'COMPANY' | 'PERSONAL';
  /** When set, lists folders for a Library entity scoped tree (space is COMPANY). */
  entityScope?: DriveEntityFolderScope | null;
  title: string;
  description: string;
  confirmLabel: string;
  excludeFolderIds?: ReadonlySet<string>;
  initialSelectedFolderId?: string | null;
  onConfirm: (folderId: string) => void | Promise<void>;
}) {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const excluded = useMemo(() => excludeFolderIds ?? new Set<string>(), [excludeFolderIds]);

  const loadTree = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = entityScope
        ? await driveApi.listFolderTree({
            space: 'COMPANY',
            scopeEntityType: entityScope.scopeEntityType,
            scopeEntityId: entityScope.scopeEntityId,
          })
        : await driveApi.listFolderTree({ space });
      setFolders(res.folders);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, [entityScope, space]);

  useEffect(() => {
    if (!open) return;
    void loadTree();
  }, [open, loadTree]);

  useEffect(() => {
    if (!open) return;
    const initial = initialSelectedFolderId;
    if (initial && !excluded.has(initial)) {
      setSelectedId(initial);
    } else {
      setSelectedId(null);
    }
  }, [open, initialSelectedFolderId, excluded]);

  useEffect(() => {
    if (!open) return;
    const roots = folders.filter((f) => f.parentId === null).map((f) => f.id);
    setExpanded(new Set(roots));
  }, [open, folders]);

  const tree = useMemo(() => buildFolderTree(folders), [folders]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canConfirm = Boolean(selectedId && !excluded.has(selectedId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-border/60 border-b px-5 py-4 sm:px-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="px-5 py-3 sm:px-6">
          {loading ? (
            <div className="text-muted-foreground flex justify-center py-10">
              <Loader2 className="size-7 animate-spin" />
            </div>
          ) : loadError ? (
            <p className="text-destructive text-sm">{loadError}</p>
          ) : folders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No folders yet. Create a folder first.</p>
          ) : (
            <ScrollArea className="max-h-[min(360px,50vh)] pr-3">
              <ul className="space-y-0.5 pb-1">
                {tree.map((node) => (
                  <FolderTreeBranch
                    key={node.id}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    excluded={excluded}
                    selectedId={selectedId}
                    onToggleExpand={toggleExpanded}
                    onSelect={(id) => setSelectedId(id)}
                  />
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
        <DialogFooter className="border-border/60 border-t px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canConfirm || confirmBusy}
            onClick={async () => {
              if (!selectedId) return;
              setConfirmBusy(true);
              try {
                await Promise.resolve(onConfirm(selectedId));
                onOpenChange(false);
              } catch {
                // Parent shows toast; keep dialog open.
              } finally {
                setConfirmBusy(false);
              }
            }}
          >
            {confirmBusy ? <Loader2 className="size-4 animate-spin" /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FolderTreeBranch({
  node,
  depth,
  expanded,
  excluded,
  selectedId,
  onToggleExpand,
  onSelect,
}: {
  node: FolderTreeNode;
  depth: number;
  expanded: ReadonlySet<string>;
  excluded: ReadonlySet<string>;
  selectedId: string | null;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const disabled = excluded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <li>
      <div
        className={cn(
          'flex min-h-9 items-center gap-0.5 rounded-lg',
          isSelected && !disabled && 'bg-primary/10 ring-primary/25 ring-1',
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => onToggleExpand(node.id)}
            className="text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-md"
          >
            <ChevronRight className={cn('size-4 transition-transform', isOpen && 'rotate-90')} />
          </button>
        ) : (
          <span className="size-8 shrink-0" />
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) onSelect(node.id);
          }}
          className={cn(
            'hover:bg-muted/80 flex min-w-0 flex-1 items-center rounded-md px-2 py-1.5 text-left text-sm',
            disabled && 'text-muted-foreground cursor-not-allowed opacity-50',
          )}
        >
          <span className="truncate font-medium">{node.name}</span>
        </button>
      </div>
      {hasChildren && isOpen && (
        <ul className="border-border/40 ml-2 border-l pl-1">
          {node.children.map((child) => (
            <FolderTreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              excluded={excluded}
              selectedId={selectedId}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
