'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { driveApi, type DriveFolder } from '@/lib/api/drive';
import { cn } from '@/lib/utils';
import { buildFolderTree, type FolderTreeNode } from './drive-folder-tree';

const TREE_DEPTH_PADDING = ['pl-0', 'pl-2.5', 'pl-5', 'pl-8', 'pl-11', 'pl-[3.25rem]'] as const;

export function DriveSpaceFolderTree({
  space,
  activeFolderId,
  onSelectFolderPath,
}: {
  space: 'COMPANY' | 'PERSONAL';
  activeFolderId: string | null;
  onSelectFolderPath: (pathFromRoot: DriveFolder[]) => void;
}) {
  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driveApi.listFolderTree({ space });
      const built = buildFolderTree(res.folders);
      setTree(built);
      setExpanded(new Set(built.map((n) => n.id)));
    } finally {
      setLoading(false);
    }
  }, [space]);

  useEffect(() => {
    void load();
  }, [load]);

  const ancestorIds = useMemo(
    () => collectAncestorIds(tree, activeFolderId),
    [tree, activeFolderId],
  );

  useEffect(() => {
    if (activeFolderId === null) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of ancestorIds) next.add(id);
      return next;
    });
  }, [activeFolderId, ancestorIds]);

  return (
    <div className="max-h-[min(360px,48vh)] overflow-y-auto py-0.5 pr-0.5">
      {loading ? (
        <p className="text-muted-foreground px-1 py-2 text-xs">Loading…</p>
      ) : tree.length === 0 ? (
        <p className="text-muted-foreground px-1 py-2 text-xs">No folders yet</p>
      ) : (
        <ul className="space-y-0.5">
          {tree.map((node) => (
            <TreeBranch
              key={node.id}
              rootNodes={tree}
              node={node}
              depth={0}
              expanded={expanded}
              activeFolderId={activeFolderId}
              onToggle={(id) => {
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
              onSelectFolderPath={onSelectFolderPath}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function stripChildren(n: FolderTreeNode): DriveFolder {
  const { children, ...rest } = n;
  void children;
  return rest;
}

function buildPath(nodes: FolderTreeNode[], targetId: string): DriveFolder[] | null {
  const walk = (list: FolderTreeNode[], prefix: DriveFolder[]): DriveFolder[] | null => {
    for (const raw of list) {
      const n = stripChildren(raw);
      if (raw.id === targetId) return [...prefix, n];
      const got = walk(raw.children, [...prefix, n]);
      if (got) return got;
    }
    return null;
  };
  return walk(nodes, []);
}

function collectAncestorIds(nodes: FolderTreeNode[], targetId: string | null): Set<string> {
  const out = new Set<string>();
  if (!targetId) return out;
  const walk = (list: FolderTreeNode[], ancestors: string[]): boolean => {
    for (const n of list) {
      if (n.id === targetId) {
        for (const a of ancestors) out.add(a);
        return true;
      }
      if (n.children.length > 0 && walk(n.children, [...ancestors, n.id])) return true;
    }
    return false;
  };
  walk(nodes, []);
  return out;
}

function TreeBranch({
  rootNodes,
  node,
  depth,
  expanded,
  activeFolderId,
  onToggle,
  onSelectFolderPath,
}: {
  rootNodes: FolderTreeNode[];
  node: FolderTreeNode;
  depth: number;
  expanded: ReadonlySet<string>;
  activeFolderId: string | null;
  onToggle: (id: string) => void;
  onSelectFolderPath: (pathFromRoot: DriveFolder[]) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const isActive = activeFolderId === node.id;

  return (
    <li>
      <div
        className={cn(
          'flex min-h-8 items-center gap-0.5 rounded-lg',
          isActive && 'bg-primary/12 ring-primary/20 ring-1',
          TREE_DEPTH_PADDING[Math.min(depth, TREE_DEPTH_PADDING.length - 1)],
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={isOpen}
            className="text-muted-foreground hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
            onClick={() => onToggle(node.id)}
          >
            <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
          </button>
        ) : (
          <span className="size-7 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => {
            const path = buildPath(rootNodes, node.id);
            if (path) onSelectFolderPath(path);
          }}
          className="hover:bg-muted/70 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left"
        >
          <Folder className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="truncate text-xs font-medium">{node.name}</span>
        </button>
      </div>
      {hasChildren && isOpen && (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              rootNodes={rootNodes}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              activeFolderId={activeFolderId}
              onToggle={onToggle}
              onSelectFolderPath={onSelectFolderPath}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
