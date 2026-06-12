'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  buildCredentialFolderTree,
  credentialFolderPathLabel,
  type CredentialFolderTreeNode,
} from '@/features/credentials/utils/credential-folder-tree';
import type { CredentialFolder } from '@/lib/api/credentials';

const TREE_DEPTH_PADDING = ['pl-0', 'pl-2.5', 'pl-5', 'pl-8', 'pl-11', 'pl-[3.25rem]'] as const;

export interface CredentialFolderTreePickerProps {
  folders: CredentialFolder[];
  value: string | null;
  onChange: (folderId: string | null) => void;
  disabled?: boolean;
  id?: string;
}

export function CredentialFolderTreePicker({
  folders,
  value,
  onChange,
  disabled = false,
  id,
}: CredentialFolderTreePickerProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [lastExpandedValue, setLastExpandedValue] = useState<string | null>(value);
  const tree = useMemo(() => buildCredentialFolderTree(folders), [folders]);
  const label = credentialFolderPathLabel(folders, value);

  const expandAncestors = (folderId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of collectAncestorIds(tree, folderId)) next.add(id);
      return next;
    });
  };

  if (!open && value !== lastExpandedValue) {
    setLastExpandedValue(value);
    if (value) expandAncestors(value);
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && value) expandAncestors(value);
    setOpen(nextOpen);
  };

  const selectFolder = (folderId: string | null) => {
    onChange(folderId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          'border-input bg-background hover:bg-accent/40 flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          open && 'border-ring ring-ring/30 ring-2',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <span className={cn('min-w-0 truncate', !value && 'text-muted-foreground')}>{label}</span>
        <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-70" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-2" align="start">
        <button
          type="button"
          className={cn(
            'hover:bg-muted/70 flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs',
            !value && 'bg-primary/12 ring-primary/20 ring-1',
          )}
          onClick={() => selectFolder(null)}
        >
          No folder
        </button>
        <div className="mt-1 max-h-[min(280px,42vh)] overflow-y-auto py-0.5">
          {tree.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1.5 text-xs">No folders yet</p>
          ) : (
            <ul className="space-y-0.5">
              {tree.map((node) => (
                <TreeBranch
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  selectedId={value}
                  onToggle={(folderId) => {
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(folderId)) next.delete(folderId);
                      else next.add(folderId);
                      return next;
                    });
                  }}
                  onSelect={selectFolder}
                />
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function collectAncestorIds(nodes: CredentialFolderTreeNode[], targetId: string): Set<string> {
  const out = new Set<string>();
  const walk = (list: CredentialFolderTreeNode[], ancestors: string[]): boolean => {
    for (const node of list) {
      if (node.id === targetId) {
        for (const id of ancestors) out.add(id);
        return true;
      }
      if (node.children.length > 0 && walk(node.children, [...ancestors, node.id])) return true;
    }
    return false;
  };
  walk(nodes, []);
  return out;
}

function TreeBranch({
  node,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: {
  node: CredentialFolderTreeNode;
  depth: number;
  expanded: ReadonlySet<string>;
  selectedId: string | null;
  onToggle: (folderId: string) => void;
  onSelect: (folderId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const isRoot = depth === 0;

  return (
    <li>
      <div
        className={cn(
          'flex min-h-8 items-center gap-0.5 rounded-lg',
          isSelected && 'bg-primary/12 ring-primary/20 ring-1',
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
          onClick={() => onSelect(node.id)}
          className="hover:bg-muted/70 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left"
        >
          <Folder
            className={cn(
              'size-3.5 shrink-0',
              isRoot ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground',
            )}
            aria-hidden
          />
          <span className="truncate text-xs font-medium">{node.name}</span>
        </button>
      </div>
      {hasChildren && isOpen ? (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
