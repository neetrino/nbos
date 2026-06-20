'use client';

import { useRef } from 'react';
import { FilePlus, FolderOpen, FolderPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentListItem } from '@/lib/api/documents';
import type { DriveFolder } from '@/lib/api/drive';
import {
  DRIVE_LIBRARIES,
  SYSTEM_LIBRARY_KEYS,
  type DriveLibraryKey,
  type DriveLibraryOption,
} from '@/features/drive/drive-options';
import {
  CollapsibleRow,
  DocList,
  useTouchDoubleTap,
  type RenameState,
} from './documents-sidebar-nodes';
import { EntityList, type EntityRowState } from './documents-sidebar-entities';
import { canCreateDocumentInLibrary } from './documents-library-create-rules';

// Library children: all system keys except 'all'
export const LIBRARY_CATEGORIES: DriveLibraryOption[] = DRIVE_LIBRARIES.filter(
  (lib) => SYSTEM_LIBRARY_KEYS.includes(lib.key as DriveLibraryKey) && lib.key !== 'all',
);

/** Returns true for library categories that surface CRM entity cards (Deals, Projects, …). */
export function categoryHasEntityLayer(key: string): boolean {
  const opt = LIBRARY_CATEGORIES.find((l) => l.key === key);
  return (opt?.entityTypes?.length ?? 0) > 0;
}

export interface LibraryFolderState {
  folder: DriveFolder;
  docs: DocumentListItem[];
  docsLoaded: boolean;
  open: boolean;
}

export interface CategoryState {
  key: string;
  /** Entity cards for entity-type libraries (deals, projects, …). */
  entityRows: EntityRowState[];
  entitiesLoaded: boolean;
  /** Flat docs for non-entity libraries. */
  docs: DocumentListItem[];
  docsLoaded: boolean;
  /** DriveFolder records scoped to this library category. */
  libraryFolders: LibraryFolderState[];
  libraryFoldersLoaded: boolean;
  open: boolean;
}

export interface FolderState {
  folder: DriveFolder;
  docs: DocumentListItem[];
  docsLoaded: boolean;
  open: boolean;
}

export type DriveSpaceKey = 'COMPANY' | 'PERSONAL';

export interface SpaceState {
  key: DriveSpaceKey;
  open: boolean;
  folders: FolderState[];
  foldersLoaded: boolean;
}

export function buildFolderStates(folders: DriveFolder[]): FolderState[] {
  return folders
    .filter((f) => f.parentId === null)
    .map((f) => ({ folder: f, docs: [], docsLoaded: false, open: false }));
}

// ── Library section ──────────────────────────────────────────
interface LibrarySectionProps {
  open: boolean;
  libraryIcon: React.ReactNode;
  categories: CategoryState[];
  activeDocId: string | undefined;
  selectedKey: string | null;
  activeEntityId: string | null;
  selectedLibraryFolderId: string | null;
  canAdd: boolean;
  canDriveAdd: boolean;
  renamingFolder: RenameState | null;
  onToggleRoot: () => void;
  onToggleCategory: (key: string) => void;
  onToggleEntity: (categoryKey: string, entityId: string) => void;
  onToggleLibraryFolder: (categoryKey: string, folderId: string) => void;
  onNewDoc: () => void;
  onRenameStart: (folderId: string, currentName: string) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

export function LibrarySection({
  open,
  libraryIcon,
  categories,
  activeDocId,
  selectedKey,
  activeEntityId,
  selectedLibraryFolderId,
  canAdd,
  canDriveAdd,
  renamingFolder,
  onToggleRoot,
  onToggleCategory,
  onToggleEntity,
  onToggleLibraryFolder,
  onNewDoc,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: LibrarySectionProps) {
  return (
    <CollapsibleRow label="Library" icon={libraryIcon} open={open} onToggle={onToggleRoot}>
      <ul className="space-y-0.5">
        {categories.map((cat) => {
          const option = LIBRARY_CATEGORIES.find((l) => l.key === cat.key)!;
          const Icon = option.icon;
          const isEntityLib = categoryHasEntityLayer(cat.key);
          const docAllowed = canAdd && canCreateDocumentInLibrary(cat.key);
          const isCatSelected = !isEntityLib && selectedKey === cat.key;

          return (
            <li key={cat.key}>
              <CollapsibleRow
                label={option.title}
                icon={<Icon size={13} aria-hidden className="shrink-0" />}
                open={cat.open}
                onToggle={() => onToggleCategory(cat.key)}
                active={isCatSelected}
                actions={
                  !isEntityLib && isCatSelected && docAllowed ? (
                    <button
                      type="button"
                      aria-label={`New document in ${option.title}`}
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
                {isEntityLib ? (
                  <EntityList
                    entities={cat.entityRows}
                    entitiesLoaded={cat.entitiesLoaded}
                    activeDocId={activeDocId}
                    activeEntityId={activeEntityId}
                    canAdd={canAdd}
                    canAddDoc={docAllowed}
                    onToggleEntity={(entityId) => onToggleEntity(cat.key, entityId)}
                    onNewDoc={onNewDoc}
                  />
                ) : (
                  <DocList docs={cat.docs} docsLoaded={cat.docsLoaded} activeDocId={activeDocId} />
                )}

                {/* Library-scoped DriveFolder list */}
                {cat.libraryFoldersLoaded && cat.libraryFolders.length > 0 ? (
                  <ul className="mt-0.5 space-y-0.5">
                    {cat.libraryFolders.map((lf) => (
                      <LibraryFolderRow
                        key={lf.folder.id}
                        folderState={lf}
                        activeDocId={activeDocId}
                        isSelected={selectedLibraryFolderId === lf.folder.id}
                        canAdd={canAdd && docAllowed}
                        renamingFolder={renamingFolder}
                        onToggle={() => onToggleLibraryFolder(cat.key, lf.folder.id)}
                        onRenameStart={onRenameStart}
                        onRenameChange={onRenameChange}
                        onRenameSubmit={onRenameSubmit}
                        onRenameCancel={onRenameCancel}
                        onNewDoc={onNewDoc}
                      />
                    ))}
                  </ul>
                ) : null}
              </CollapsibleRow>
            </li>
          );
        })}
      </ul>
    </CollapsibleRow>
  );
}

// ── Library folder row ────────────────────────────────────────
interface LibraryFolderRowProps {
  folderState: LibraryFolderState;
  activeDocId: string | undefined;
  isSelected: boolean;
  canAdd: boolean;
  renamingFolder: RenameState | null;
  onToggle: () => void;
  onRenameStart: (folderId: string, currentName: string) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onNewDoc: () => void;
}

function LibraryFolderRow({
  folderState,
  activeDocId,
  isSelected,
  canAdd,
  renamingFolder,
  onToggle,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onNewDoc,
}: LibraryFolderRowProps) {
  const { folder } = folderState;
  const isRenaming = renamingFolder?.folderId === folder.id;
  const touchProps = useTouchDoubleTap(() => onRenameStart(folder.id, folder.name));

  return (
    <li {...touchProps}>
      <CollapsibleRow
        label={folder.name}
        icon={<FolderOpen size={13} aria-hidden className="shrink-0" />}
        open={folderState.open}
        onToggle={onToggle}
        active={isSelected}
        indent
        onLabelDoubleClick={() => onRenameStart(folder.id, folder.name)}
        renameState={isRenaming ? renamingFolder : null}
        onRenameChange={onRenameChange}
        onRenameSubmit={onRenameSubmit}
        onRenameCancel={onRenameCancel}
        actions={
          isSelected && canAdd && !isRenaming ? (
            <button
              type="button"
              aria-label={`New document in ${folder.name}`}
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
        <DocList
          docs={folderState.docs}
          docsLoaded={folderState.docsLoaded}
          activeDocId={activeDocId}
        />
      </CollapsibleRow>
    </li>
  );
}

// ── Drive space section ───────────────────────────────────────
interface DriveSpaceSectionProps {
  space: SpaceState;
  spaceIcon: React.ReactNode;
  label: string;
  activeDocId: string | undefined;
  selectedFolderId: string | null;
  canAdd: boolean;
  canDriveAdd: boolean;
  renamingFolder: RenameState | null;
  onToggleRoot: () => void;
  onToggleFolder: (folderId: string) => void;
  onNewDoc: () => void;
  onNewFolder: (parentId: string | null) => void;
  onRenameStart: (folderId: string, currentName: string) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

export function DriveSpaceSection({
  space,
  spaceIcon,
  label,
  activeDocId,
  selectedFolderId,
  canAdd,
  canDriveAdd,
  renamingFolder,
  onToggleRoot,
  onToggleFolder,
  onNewDoc,
  onNewFolder,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: DriveSpaceSectionProps) {
  return (
    <CollapsibleRow
      label={label}
      icon={spaceIcon}
      open={space.open}
      onToggle={onToggleRoot}
      actions={
        canDriveAdd && space.open ? (
          <button
            type="button"
            aria-label={`New folder in ${label}`}
            className="text-muted-foreground hover:text-foreground flex size-4 items-center justify-center rounded"
            onClick={(e) => {
              e.stopPropagation();
              onNewFolder(null);
            }}
          >
            <FolderPlus size={11} aria-hidden />
          </button>
        ) : null
      }
    >
      {!space.foldersLoaded ? (
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full rounded" />
          ))}
        </div>
      ) : space.folders.length === 0 ? (
        <p className="text-muted-foreground px-2 py-0.5 text-xs">No folders</p>
      ) : (
        <ul className="space-y-0.5">
          {space.folders.map((fs) => (
            <DriveFolderRow
              key={fs.folder.id}
              folderState={fs}
              activeDocId={activeDocId}
              isSelected={selectedFolderId === fs.folder.id}
              canAdd={canAdd}
              canDriveAdd={canDriveAdd}
              renamingFolder={renamingFolder}
              onToggle={() => onToggleFolder(fs.folder.id)}
              onNewFolder={() => onNewFolder(fs.folder.id)}
              onNewDoc={onNewDoc}
              onRenameStart={onRenameStart}
              onRenameChange={onRenameChange}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
            />
          ))}
        </ul>
      )}
    </CollapsibleRow>
  );
}

// ── Drive folder row (Company / Personal) ─────────────────────
interface DriveFolderRowProps {
  folderState: FolderState;
  activeDocId: string | undefined;
  isSelected: boolean;
  canAdd: boolean;
  canDriveAdd: boolean;
  renamingFolder: RenameState | null;
  onToggle: () => void;
  onNewFolder: () => void;
  onNewDoc: () => void;
  onRenameStart: (folderId: string, currentName: string) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

function DriveFolderRow({
  folderState,
  activeDocId,
  isSelected,
  canAdd,
  canDriveAdd,
  renamingFolder,
  onToggle,
  onNewFolder,
  onNewDoc,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: DriveFolderRowProps) {
  const { folder } = folderState;
  const isRenaming = renamingFolder?.folderId === folder.id;
  const touchProps = useTouchDoubleTap(() => onRenameStart(folder.id, folder.name));

  return (
    <li {...touchProps}>
      <CollapsibleRow
        label={folder.name}
        icon={<FolderOpen size={13} aria-hidden className="shrink-0" />}
        open={folderState.open}
        onToggle={onToggle}
        active={isSelected}
        onLabelDoubleClick={() => onRenameStart(folder.id, folder.name)}
        renameState={isRenaming ? renamingFolder : null}
        onRenameChange={onRenameChange}
        onRenameSubmit={onRenameSubmit}
        onRenameCancel={onRenameCancel}
        actions={
          isSelected && !isRenaming ? (
            <>
              {canDriveAdd ? (
                <button
                  type="button"
                  aria-label={`New folder inside ${folder.name}`}
                  className="text-muted-foreground hover:text-foreground flex size-4 items-center justify-center rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewFolder();
                  }}
                >
                  <FolderPlus size={11} aria-hidden />
                </button>
              ) : null}
              {canAdd ? (
                <button
                  type="button"
                  aria-label={`New document in ${folder.name}`}
                  className="text-muted-foreground hover:text-foreground flex size-4 items-center justify-center rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewDoc();
                  }}
                >
                  <FilePlus size={11} aria-hidden />
                </button>
              ) : null}
            </>
          ) : null
        }
      >
        <DocList
          docs={folderState.docs}
          docsLoaded={folderState.docsLoaded}
          activeDocId={activeDocId}
        />
      </CollapsibleRow>
    </li>
  );
}
