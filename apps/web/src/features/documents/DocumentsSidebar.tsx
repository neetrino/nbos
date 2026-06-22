'use client';

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  CircleUserRound,
  FilePlus,
  FolderPlus,
  LayoutGrid,
  Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { documentsApi, type DocumentListItem } from '@/lib/api/documents';
import { driveApi } from '@/lib/api/drive';
import { usePermission } from '@/lib/permissions';
import { NATIVE_TYPE, DOCS_PER_LOCATION, type RenameState } from './documents-sidebar-nodes';
import { CreateDocumentDialog } from './CreateDocumentDialog';
import {
  LIBRARY_CATEGORIES,
  LibrarySection,
  DriveSpaceSection,
  buildFolderStates,
  categoryHasEntityLayer,
  type CategoryState,
  type LibraryFolderState,
  type SpaceState,
  type DriveSpaceKey,
} from './documents-sidebar-spaces';
import type { EntityRowState } from './documents-sidebar-entities';
import {
  canCreateDocumentInLibrary,
  canCreateFolderInLibrary,
} from './documents-library-create-rules';

type SelectedLocation =
  | { kind: 'library-category'; key: string }
  | { kind: 'library-entity'; key: string; entityType: string; entityId: string; label: string }
  | { kind: 'library-folder'; key: string; folderId: string }
  | { kind: 'drive-folder'; folderId: string; space: DriveSpaceKey }
  | null;

function initCategoryState(): CategoryState[] {
  return LIBRARY_CATEGORIES.map((lib) => ({
    key: lib.key,
    entityRows: [],
    entitiesLoaded: false,
    docs: [],
    docsLoaded: false,
    libraryFolders: [],
    libraryFoldersLoaded: false,
    open: false,
  }));
}

type DocumentsSidebarProps = {
  style?: CSSProperties;
};

export function DocumentsSidebar({ style }: DocumentsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermission();
  const canAdd = can('ADD', 'DOCUMENTS');
  const canDriveAdd = can('ADD', 'DRIVE');

  const activeDocId = (() => {
    if (!pathname.startsWith('/documents/')) return undefined;
    const seg = pathname.split('/')[2];
    return seg && seg !== 'sections' ? seg : undefined;
  })();

  const [categories, setCategories] = useState<CategoryState[]>(initCategoryState);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [activeLibraryCategoryKey, setActiveLibraryCategoryKey] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<SpaceState[]>([
    { key: 'COMPANY', open: false, folders: [], foldersLoaded: false },
    { key: 'PERSONAL', open: false, folders: [], foldersLoaded: false },
  ]);
  const [selected, setSelected] = useState<SelectedLocation>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // ── New folder (Company/Personal inline input) ───────────────
  const [creatingFolderSpace, setCreatingFolderSpace] = useState<DriveSpaceKey | null>(null);
  const [creatingFolderParentId, setCreatingFolderParentId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderSaving, setFolderSaving] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // ── New library folder (same inline input but scoped to a library key) ───
  const [creatingLibraryFolderKey, setCreatingLibraryFolderKey] = useState<string | null>(null);

  // ── Rename state ─────────────────────────────────────────────
  const [renamingFolder, setRenamingFolder] = useState<RenameState | null>(null);

  useEffect(() => {
    if (creatingFolderSpace || creatingLibraryFolderKey) {
      setTimeout(() => folderInputRef.current?.focus(), 50);
    }
  }, [creatingFolderSpace, creatingLibraryFolderKey]);

  // ── Library category docs (non-entity libraries only) ────────
  const loadCategoryDocs = useCallback(async (key: string) => {
    try {
      const docs = await documentsApi.listDocuments({ type: 'NATIVE', libraryKey: key });
      const native = docs.filter((d) => d.type === NATIVE_TYPE).slice(0, DOCS_PER_LOCATION);
      setCategories((prev) =>
        prev.map((c) => (c.key === key ? { ...c, docs: native, docsLoaded: true } : c)),
      );
    } catch {
      setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, docsLoaded: true } : c)));
    }
  }, []);

  // ── Library folders ───────────────────────────────────────────
  const loadLibraryFolders = useCallback(async (key: string) => {
    try {
      const res = await driveApi.listFolderTree({ libraryKey: key });
      const folderStates: LibraryFolderState[] = res.folders.map((f) => ({
        folder: f,
        docs: [],
        docsLoaded: false,
        open: false,
      }));
      setCategories((prev) =>
        prev.map((c) =>
          c.key === key ? { ...c, libraryFolders: folderStates, libraryFoldersLoaded: true } : c,
        ),
      );
    } catch {
      setCategories((prev) =>
        prev.map((c) => (c.key === key ? { ...c, libraryFoldersLoaded: true } : c)),
      );
    }
  }, []);

  // ── Library entity rows ───────────────────────────────────────
  const loadCategoryEntities = useCallback(async (key: string) => {
    try {
      const { items } = await driveApi.listLibraryEntities(key);
      const rows: EntityRowState[] = items.map((item) => ({
        id: item.id,
        entityType: item.entityType,
        label: item.label,
        code: item.code,
        docs: [],
        docsLoaded: false,
        open: false,
      }));
      setCategories((prev) =>
        prev.map((c) => (c.key === key ? { ...c, entityRows: rows, entitiesLoaded: true } : c)),
      );
    } catch {
      setCategories((prev) =>
        prev.map((c) => (c.key === key ? { ...c, entitiesLoaded: true } : c)),
      );
    }
  }, []);

  // ── Docs under a specific entity ─────────────────────────────
  const loadEntityDocs = useCallback(
    async (categoryKey: string, entityType: string, entityId: string) => {
      try {
        const docs = await documentsApi.listDocuments({
          type: 'NATIVE',
          libraryKey: categoryKey,
          entityType,
          entityId,
        });
        const native = docs
          .filter((d): d is DocumentListItem => d.type === NATIVE_TYPE)
          .slice(0, DOCS_PER_LOCATION);
        setCategories((prev) =>
          prev.map((c) => {
            if (c.key !== categoryKey) return c;
            return {
              ...c,
              entityRows: c.entityRows.map((e) =>
                e.id === entityId ? { ...e, docs: native, docsLoaded: true } : e,
              ),
            };
          }),
        );
      } catch {
        setCategories((prev) =>
          prev.map((c) => {
            if (c.key !== categoryKey) return c;
            return {
              ...c,
              entityRows: c.entityRows.map((e) =>
                e.id === entityId ? { ...e, docsLoaded: true } : e,
              ),
            };
          }),
        );
      }
    },
    [],
  );

  // ── Docs under a library folder ──────────────────────────────
  const loadLibraryFolderDocs = useCallback(async (categoryKey: string, folderId: string) => {
    try {
      const docs = await documentsApi.listDocuments({ type: 'NATIVE', driveFolderId: folderId });
      const native = docs
        .filter((d): d is DocumentListItem => d.type === NATIVE_TYPE)
        .slice(0, DOCS_PER_LOCATION);
      setCategories((prev) =>
        prev.map((c) => {
          if (c.key !== categoryKey) return c;
          return {
            ...c,
            libraryFolders: c.libraryFolders.map((lf) =>
              lf.folder.id === folderId ? { ...lf, docs: native, docsLoaded: true } : lf,
            ),
          };
        }),
      );
    } catch {
      setCategories((prev) =>
        prev.map((c) => {
          if (c.key !== categoryKey) return c;
          return {
            ...c,
            libraryFolders: c.libraryFolders.map((lf) =>
              lf.folder.id === folderId ? { ...lf, docsLoaded: true } : lf,
            ),
          };
        }),
      );
    }
  }, []);

  const toggleCategory = useCallback(
    (key: string) => {
      const cat = categories.find((c) => c.key === key);
      const isOpening = !cat?.open;
      const isClosingEntityCategory = cat?.open === true && categoryHasEntityLayer(key);
      if (isOpening) {
        setActiveLibraryCategoryKey(key);
        if (categoryHasEntityLayer(key) && !cat?.entitiesLoaded) void loadCategoryEntities(key);
        else if (!categoryHasEntityLayer(key) && !cat?.docsLoaded) void loadCategoryDocs(key);
        if (!cat?.libraryFoldersLoaded) void loadLibraryFolders(key);
      }
      setCategories((prev) =>
        prev.map((item) => (item.key === key ? { ...item, open: !item.open } : item)),
      );
      if (isClosingEntityCategory) {
        setSelected((sel) => (sel?.kind === 'library-entity' && sel.key === key ? null : sel));
      } else if (!categoryHasEntityLayer(key)) {
        setSelected({ kind: 'library-category', key });
      }
    },
    [categories, loadCategoryEntities, loadCategoryDocs, loadLibraryFolders],
  );

  const toggleLibraryOpen = useCallback(() => {
    const isClosing = libraryOpen;
    setLibraryOpen((v) => !v);
    if (isClosing) {
      setSelected((sel) =>
        sel?.kind === 'library-category' ||
        sel?.kind === 'library-entity' ||
        sel?.kind === 'library-folder'
          ? null
          : sel,
      );
    }
  }, [libraryOpen]);

  const toggleEntity = useCallback(
    (categoryKey: string, entityId: string) => {
      setActiveLibraryCategoryKey(categoryKey);
      setCategories((prev) => {
        const cat = prev.find((c) => c.key === categoryKey);
        const entity = cat?.entityRows.find((e) => e.id === entityId);
        if (entity) {
          setSelected({
            kind: 'library-entity',
            key: categoryKey,
            entityType: entity.entityType,
            entityId: entity.id,
            label: entity.label,
          });
          if (!entity.docsLoaded) {
            void loadEntityDocs(categoryKey, entity.entityType, entity.id);
          }
        }
        return prev.map((c) => {
          if (c.key !== categoryKey) return c;
          return {
            ...c,
            entityRows: c.entityRows.map((e) => (e.id === entityId ? { ...e, open: !e.open } : e)),
          };
        });
      });
    },
    [loadEntityDocs],
  );

  const toggleLibraryFolder = useCallback(
    (categoryKey: string, folderId: string) => {
      setSelected({ kind: 'library-folder', key: categoryKey, folderId });
      setCategories((prev) =>
        prev.map((c) => {
          if (c.key !== categoryKey) return c;
          const lf = c.libraryFolders.find((f) => f.folder.id === folderId);
          if (lf && !lf.docsLoaded) {
            void loadLibraryFolderDocs(categoryKey, folderId);
          }
          return {
            ...c,
            libraryFolders: c.libraryFolders.map((f) =>
              f.folder.id === folderId ? { ...f, open: !f.open } : f,
            ),
          };
        }),
      );
    },
    [loadLibraryFolderDocs],
  );

  // ── Drive space folders ───────────────────────────────────────
  const loadSpaceFolders = useCallback(async (spaceKey: DriveSpaceKey) => {
    try {
      const res = await driveApi.listFolderTree({ space: spaceKey });
      setSpaces((prev) =>
        prev.map((s) =>
          s.key === spaceKey
            ? { ...s, folders: buildFolderStates(res.folders), foldersLoaded: true }
            : s,
        ),
      );
    } catch {
      setSpaces((prev) =>
        prev.map((s) => (s.key === spaceKey ? { ...s, foldersLoaded: true } : s)),
      );
    }
  }, []);

  const toggleSpace = useCallback(
    (spaceKey: DriveSpaceKey) => {
      const isClosing = spaces.find((s) => s.key === spaceKey)?.open === true;
      setSpaces((prev) => {
        const sp = prev.find((s) => s.key === spaceKey);
        if (sp && !sp.foldersLoaded) void loadSpaceFolders(spaceKey);
        return prev.map((s) => (s.key === spaceKey ? { ...s, open: !s.open } : s));
      });
      if (isClosing) {
        setSelected((sel) => (sel?.kind === 'drive-folder' && sel.space === spaceKey ? null : sel));
      }
    },
    [loadSpaceFolders, spaces],
  );

  const loadFolderDocs = useCallback(async (folderId: string, spaceKey: DriveSpaceKey) => {
    try {
      const docs = await documentsApi.listDocuments({ type: 'NATIVE', driveFolderId: folderId });
      const native = docs
        .filter((d): d is DocumentListItem => d.type === NATIVE_TYPE)
        .slice(0, DOCS_PER_LOCATION);
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.key !== spaceKey) return s;
          return {
            ...s,
            folders: s.folders.map((f) =>
              f.folder.id === folderId ? { ...f, docs: native, docsLoaded: true } : f,
            ),
          };
        }),
      );
    } catch {
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.key !== spaceKey) return s;
          return {
            ...s,
            folders: s.folders.map((f) =>
              f.folder.id === folderId ? { ...f, docsLoaded: true } : f,
            ),
          };
        }),
      );
    }
  }, []);

  const toggleFolder = useCallback(
    (folderId: string, spaceKey: DriveSpaceKey) => {
      setSelected({ kind: 'drive-folder', folderId, space: spaceKey });
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.key !== spaceKey) return s;
          const fs = s.folders.find((f) => f.folder.id === folderId);
          if (fs && !fs.docsLoaded) void loadFolderDocs(folderId, spaceKey);
          return {
            ...s,
            folders: s.folders.map((f) => (f.folder.id === folderId ? { ...f, open: !f.open } : f)),
          };
        }),
      );
    },
    [loadFolderDocs],
  );

  // ── Create folder (Company/Personal) ─────────────────────────
  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name || !creatingFolderSpace) {
      setCreatingFolderSpace(null);
      setNewFolderName('');
      return;
    }
    setFolderSaving(true);
    try {
      await driveApi.createFolder({
        name,
        space: creatingFolderSpace,
        parentId: creatingFolderParentId ?? undefined,
      });
      await loadSpaceFolders(creatingFolderSpace);
    } catch {
      setFolderSaving(false);
      return;
    }
    setCreatingFolderSpace(null);
    setNewFolderName('');
    setCreatingFolderParentId(null);
    setFolderSaving(false);
  };

  const startCreateFolder = (space: DriveSpaceKey, parentId: string | null = null) => {
    setCreatingLibraryFolderKey(null);
    setCreatingFolderSpace(space);
    setCreatingFolderParentId(parentId);
    setNewFolderName('');
  };

  // ── Create library folder ─────────────────────────────────────
  const handleCreateLibraryFolder = async () => {
    const name = newFolderName.trim();
    // Capture key before any await to avoid stale closure.
    const key = creatingLibraryFolderKey;
    if (!name || !key) {
      setCreatingLibraryFolderKey(null);
      setNewFolderName('');
      return;
    }
    setFolderSaving(true);
    try {
      const folder = await driveApi.createFolder({ name, libraryKey: key });
      // Add directly to state — createFolder already returns the created folder,
      // so no second round-trip needed. Avoids catch-swallowed refresh bugs.
      setCategories((prev) =>
        prev.map((c) => {
          if (c.key !== key) return c;
          if (c.libraryFolders.some((lf) => lf.folder.id === folder.id)) return c;
          return {
            ...c,
            libraryFolders: [
              ...c.libraryFolders,
              { folder, docs: [], docsLoaded: false, open: false },
            ],
            libraryFoldersLoaded: true,
          };
        }),
      );
    } catch {
      setFolderSaving(false);
      return;
    }
    setCreatingLibraryFolderKey(null);
    setNewFolderName('');
    setFolderSaving(false);
  };

  const startCreateLibraryFolder = (categoryKey: string) => {
    setCreatingFolderSpace(null);
    setCreatingLibraryFolderKey(categoryKey);
    setNewFolderName('');
  };

  // ── Rename folder ─────────────────────────────────────────────
  const handleRenameStart = useCallback((folderId: string, currentName: string) => {
    setRenamingFolder({ folderId, value: currentName, saving: false });
  }, []);

  const handleRenameChange = useCallback((value: string) => {
    setRenamingFolder((prev) => (prev ? { ...prev, value } : null));
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renamingFolder) return;
    const name = renamingFolder.value.trim();
    if (!name) {
      setRenamingFolder(null);
      return;
    }
    setRenamingFolder((prev) => (prev ? { ...prev, saving: true } : null));
    try {
      await driveApi.renameFolder(renamingFolder.folderId, { name });
      // Refresh: reload whichever section contains the renamed folder
      const folderId = renamingFolder.folderId;
      setRenamingFolder(null);
      // Reload library folders in all open categories
      setCategories((prev) =>
        prev.map((c) => {
          if (!c.libraryFolders.some((lf) => lf.folder.id === folderId)) return c;
          return {
            ...c,
            libraryFolders: c.libraryFolders.map((lf) =>
              lf.folder.id === folderId ? { ...lf, folder: { ...lf.folder, name } } : lf,
            ),
          };
        }),
      );
      // Reload drive space folders for matching folder
      setSpaces((prev) =>
        prev.map((s) => ({
          ...s,
          folders: s.folders.map((f) =>
            f.folder.id === folderId ? { ...f, folder: { ...f.folder, name } } : f,
          ),
        })),
      );
    } catch {
      setRenamingFolder((prev) => (prev ? { ...prev, saving: false } : null));
    }
  }, [renamingFolder]);

  const handleRenameCancel = useCallback(() => {
    setRenamingFolder(null);
  }, []);

  const handleDocumentCreated = useCallback(
    (id: string) => {
      router.push(`/documents/${id}`);
      if (!selected) return;
      if (selected.kind === 'library-entity') {
        void loadEntityDocs(selected.key, selected.entityType, selected.entityId);
      } else if (selected.kind === 'library-category') {
        void loadCategoryDocs(selected.key);
      } else if (selected.kind === 'library-folder') {
        void loadLibraryFolderDocs(selected.key, selected.folderId);
      } else if (selected.kind === 'drive-folder') {
        void loadFolderDocs(selected.folderId, selected.space);
      }
    },
    [selected, loadEntityDocs, loadCategoryDocs, loadLibraryFolderDocs, loadFolderDocs, router],
  );

  // True only when the selected item is actually inside an expanded/visible branch.
  const isSelectedVisible = (() => {
    if (!selected) return false;
    if (selected.kind === 'drive-folder') {
      return spaces.find((s) => s.key === selected.space)?.open === true;
    }
    if (selected.kind === 'library-entity') {
      if (!libraryOpen) return false;
      return categories.find((c) => c.key === selected.key)?.open === true;
    }
    if (selected.kind === 'library-folder') {
      if (!libraryOpen) return false;
      return categories.find((c) => c.key === selected.key)?.open === true;
    }
    return false;
  })();

  // Header FilePlus rules:
  // • library-entity under a folder-only category → no FilePlus
  // • library-entity under Support → FilePlus allowed
  // • library-folder → FilePlus allowed (documents inside folders are always allowed)
  // • drive-folder → keep existing behaviour
  const canShowFilePlus = (() => {
    if (!canAdd || !isSelectedVisible) return false;
    if (selected?.kind === 'drive-folder') return true;
    if (selected?.kind === 'library-folder') return true;
    if (selected?.kind === 'library-entity') {
      return canCreateDocumentInLibrary(selected.key);
    }
    return false;
  })();

  // Header FolderPlus: only show when the active category is actually open,
  // so the newly created folder is immediately visible to the user.
  const canShowFolderPlus =
    canDriveAdd &&
    libraryOpen &&
    !!activeLibraryCategoryKey &&
    canCreateFolderInLibrary(activeLibraryCategoryKey) &&
    (categories.find((c) => c.key === activeLibraryCategoryKey)?.open ?? false);

  const selectedLibraryKey = selected?.kind === 'library-category' ? selected.key : null;
  const activeEntityId = selected?.kind === 'library-entity' ? selected.entityId : null;
  const selectedLibraryFolderId = selected?.kind === 'library-folder' ? selected.folderId : null;
  const selectedFolderBySpace = (spaceKey: DriveSpaceKey) =>
    selected?.kind === 'drive-folder' && selected.space === spaceKey ? selected.folderId : null;

  const showFolderInput = creatingFolderSpace !== null || creatingLibraryFolderKey !== null;

  return (
    <>
      <aside
        style={style}
        className="bg-background relative z-[44] flex h-full shrink-0 flex-col overflow-y-auto"
      >
        <div className="border-border flex items-center justify-between border-b px-3 py-2">
          <Link
            href="/documents"
            className={cn(
              'flex items-center gap-1.5 text-sm font-semibold transition-colors',
              pathname === '/documents'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid size={15} aria-hidden />
            Documents
          </Link>
          <div className="flex items-center gap-0.5">
            {canShowFolderPlus ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="New folder"
                className="size-6 shrink-0"
                onClick={() => startCreateLibraryFolder(activeLibraryCategoryKey!)}
              >
                <FolderPlus size={13} aria-hidden />
              </Button>
            ) : null}
            {canShowFilePlus ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="New document"
                className="size-6 shrink-0"
                onClick={() => setCreateDialogOpen(true)}
              >
                <FilePlus size={13} aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>

        {showFolderInput ? (
          <div className="border-border border-b px-2 py-1.5">
            <Input
              ref={folderInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name…"
              className="h-6 px-2 text-xs"
              disabled={folderSaving}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void (creatingFolderSpace ? handleCreateFolder() : handleCreateLibraryFolder());
                }
                if (e.key === 'Escape') {
                  setCreatingFolderSpace(null);
                  setCreatingLibraryFolderKey(null);
                  setNewFolderName('');
                }
              }}
              onBlur={() => {
                void (creatingFolderSpace ? handleCreateFolder() : handleCreateLibraryFolder());
              }}
            />
          </div>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-1 py-1">
          <ul className="space-y-0.5">
            <li>
              <LibrarySection
                open={libraryOpen}
                libraryIcon={<Library size={14} aria-hidden className="shrink-0" />}
                categories={categories}
                activeDocId={activeDocId}
                selectedKey={selectedLibraryKey}
                activeEntityId={activeEntityId}
                selectedLibraryFolderId={selectedLibraryFolderId}
                canAdd={canAdd}
                canDriveAdd={canDriveAdd}
                renamingFolder={renamingFolder}
                onToggleRoot={toggleLibraryOpen}
                onToggleCategory={toggleCategory}
                onToggleEntity={toggleEntity}
                onToggleLibraryFolder={toggleLibraryFolder}
                onNewDoc={() => setCreateDialogOpen(true)}
                onRenameStart={handleRenameStart}
                onRenameChange={handleRenameChange}
                onRenameSubmit={() => {
                  void handleRenameSubmit();
                }}
                onRenameCancel={handleRenameCancel}
              />
            </li>
            {spaces.map((space) => (
              <li key={space.key}>
                <DriveSpaceSection
                  space={space}
                  spaceIcon={
                    space.key === 'COMPANY' ? (
                      <Building2 size={14} aria-hidden className="shrink-0" />
                    ) : (
                      <CircleUserRound size={14} aria-hidden className="shrink-0" />
                    )
                  }
                  label={space.key === 'COMPANY' ? 'Company' : 'Personal'}
                  activeDocId={activeDocId}
                  selectedFolderId={selectedFolderBySpace(space.key)}
                  canAdd={canAdd}
                  canDriveAdd={canDriveAdd}
                  renamingFolder={renamingFolder}
                  onToggleRoot={() => toggleSpace(space.key)}
                  onToggleFolder={(folderId) => toggleFolder(folderId, space.key)}
                  onNewDoc={() => setCreateDialogOpen(true)}
                  onNewFolder={(parentId) => startCreateFolder(space.key, parentId)}
                  onRenameStart={handleRenameStart}
                  onRenameChange={handleRenameChange}
                  onRenameSubmit={() => {
                    void handleRenameSubmit();
                  }}
                  onRenameCancel={handleRenameCancel}
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {createDialogOpen && selected ? (
        <CreateDocumentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          location={selected}
          onCreated={handleDocumentCreated}
        />
      ) : null}
    </>
  );
}
