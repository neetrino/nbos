'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, FilePlus, FileText, FolderOpen, FolderPlus, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { documentsApi, type DocumentListItem, type DocumentSection } from '@/lib/api/documents';
import { usePermission } from '@/lib/permissions';

const NATIVE_TYPE = 'NATIVE';
const DOCS_PER_SECTION = 20;

interface SectionEntry {
  section: DocumentSection;
  docs: DocumentListItem[];
  docsLoaded: boolean;
  open: boolean;
}

export function DocumentsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermission();
  const [sections, setSections] = useState<SectionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder creation
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderSaving, setFolderSaving] = useState(false);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Inline document creation
  const [creatingDocInSection, setCreatingDocInSection] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [docSaving, setDocSaving] = useState(false);
  const newDocInputRef = useRef<HTMLInputElement>(null);

  const canAdd = can('ADD', 'DOCUMENTS');
  const canManageSections = can('MANAGE_SECTIONS', 'DOCUMENTS');

  const activeSectionId = pathname.startsWith('/documents/sections/')
    ? pathname.split('/')[3]
    : undefined;
  const activeDocId =
    pathname.startsWith('/documents/') && !pathname.startsWith('/documents/sections/')
      ? (() => {
          const parts = pathname.split('/');
          return parts[2] && parts[2] !== 'sections' ? parts[2] : undefined;
        })()
      : undefined;

  // The section where the current doc lives — used for the header "new doc" button.
  const currentSectionId = useMemo(() => {
    if (activeSectionId) return activeSectionId;
    if (activeDocId) {
      const entry = sections.find((e) => e.docs.some((d) => d.id === activeDocId));
      if (entry) return entry.section.id;
    }
    return sections[0]?.section.id ?? null;
  }, [activeSectionId, activeDocId, sections]);

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const secs = await documentsApi.listSections();
      setSections(
        secs.map((s) => ({
          section: s,
          docs: [],
          docsLoaded: false,
          open: s.id === activeSectionId,
        })),
      );
    } catch {
      // non-fatal: sidebar degrades gracefully
    } finally {
      setLoading(false);
    }
  }, [activeSectionId]);

  useEffect(() => {
    void loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (creatingFolder) setTimeout(() => newFolderInputRef.current?.focus(), 50);
  }, [creatingFolder]);

  useEffect(() => {
    if (creatingDocInSection) setTimeout(() => newDocInputRef.current?.focus(), 50);
  }, [creatingDocInSection]);

  const toggleSection = async (idx: number) => {
    setSections((prev) =>
      prev.map((entry, i) => (i === idx ? { ...entry, open: !entry.open } : entry)),
    );
    const entry = sections[idx];
    if (!entry || entry.docsLoaded) return;
    try {
      const docs = await documentsApi.listDocuments({
        sectionId: entry.section.id,
        includeArchived: false,
      });
      const nativeDocs = docs
        .filter((d) => !d.type || d.type === NATIVE_TYPE)
        .slice(0, DOCS_PER_SECTION);
      setSections((prev) =>
        prev.map((e, i) => (i === idx ? { ...e, docs: nativeDocs, docsLoaded: true } : e)),
      );
    } catch {
      // ignore: docs under section won't show until retry
    }
  };

  /** Open a section and begin inline doc creation inside it. */
  const startDocCreation = (sectionId: string) => {
    setSections((prev) => prev.map((e) => (e.section.id === sectionId ? { ...e, open: true } : e)));
    setCreatingDocInSection(sectionId);
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      setCreatingFolder(false);
      setNewFolderName('');
      return;
    }
    setFolderSaving(true);
    try {
      const section = await documentsApi.createDocumentSection({ name });
      setSections((prev) => [...prev, { section, docs: [], docsLoaded: false, open: false }]);
      setCreatingFolder(false);
      setNewFolderName('');
    } catch {
      // keep input open on error so user can retry
    } finally {
      setFolderSaving(false);
    }
  };

  const handleCreateDoc = async (sectionId: string) => {
    const title = newDocTitle.trim();
    if (!title) {
      setCreatingDocInSection(null);
      setNewDocTitle('');
      return;
    }
    setDocSaving(true);
    try {
      const created = await documentsApi.createDocument({ title, sectionId });
      const newItem: DocumentListItem = {
        id: created.id,
        title: created.title,
        slug: created.slug,
        status: created.status,
        type: created.type,
        updatedAt: created.updatedAt,
        section: created.section,
        createdById: created.createdById,
      };
      setSections((prev) =>
        prev.map((e) => (e.section.id === sectionId ? { ...e, docs: [newItem, ...e.docs] } : e)),
      );
      setCreatingDocInSection(null);
      setNewDocTitle('');
      router.push(`/documents/${created.id}`);
    } catch {
      // keep input open on error so user can retry
    } finally {
      setDocSaving(false);
    }
  };

  return (
    <aside className="border-border bg-background relative z-[44] flex h-full w-52 shrink-0 flex-col overflow-y-auto border-r">
      {/* Header */}
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
          {canAdd ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="New document"
              className="size-6 shrink-0"
              disabled={!currentSectionId}
              onClick={() => currentSectionId && startDocCreation(currentSectionId)}
            >
              <FilePlus size={13} aria-hidden />
            </Button>
          ) : null}
          {canManageSections ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="New folder"
              className="size-6 shrink-0"
              onClick={() => setCreatingFolder(true)}
            >
              <FolderPlus size={13} aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Inline new-folder input */}
      {creatingFolder ? (
        <div className="border-border border-b px-2 py-1.5">
          <Input
            ref={newFolderInputRef}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name…"
            className="h-6 px-2 text-xs"
            disabled={folderSaving}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreateFolder();
              if (e.key === 'Escape') {
                setCreatingFolder(false);
                setNewFolderName('');
              }
            }}
            onBlur={() => void handleCreateFolder()}
          />
        </div>
      ) : null}

      {/* Sections tree */}
      <nav className="flex-1 overflow-y-auto px-1 py-1">
        {loading ? (
          <div className="space-y-1 px-2 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded" />
            ))}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {sections.map((entry, idx) => (
              <li key={entry.section.id}>
                <Collapsible open={entry.open}>
                  <div className="group flex items-center">
                    <CollapsibleTrigger
                      aria-label={entry.open ? 'Collapse folder' : 'Expand folder'}
                      onClick={() => void toggleSection(idx)}
                      className="text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded transition-colors"
                    >
                      <ChevronRight
                        size={12}
                        className={cn('transition-transform', entry.open && 'rotate-90')}
                      />
                    </CollapsibleTrigger>

                    <button
                      type="button"
                      onClick={() => void toggleSection(idx)}
                      className={cn(
                        'flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-sm transition-colors',
                        activeSectionId === entry.section.id
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                      )}
                    >
                      <FolderOpen size={14} aria-hidden className="shrink-0" />
                      <span className="truncate">{entry.section.name}</span>
                    </button>

                    {/* Per-section new-doc button, visible on row hover */}
                    {canAdd ? (
                      <button
                        type="button"
                        onClick={() => startDocCreation(entry.section.id)}
                        aria-label={`New document in ${entry.section.name}`}
                        className="text-muted-foreground hover:text-foreground mr-1 flex size-4 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <FilePlus size={11} aria-hidden />
                      </button>
                    ) : null}
                  </div>

                  <CollapsibleContent>
                    {/* Inline new-doc input — appears at top of the section */}
                    {creatingDocInSection === entry.section.id ? (
                      <div className="mt-0.5 ml-5">
                        <Input
                          ref={newDocInputRef}
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="Document name…"
                          className="h-6 px-2 text-xs"
                          disabled={docSaving}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleCreateDoc(entry.section.id);
                            if (e.key === 'Escape') {
                              setCreatingDocInSection(null);
                              setNewDocTitle('');
                            }
                          }}
                          onBlur={() => void handleCreateDoc(entry.section.id)}
                        />
                      </div>
                    ) : null}

                    {entry.docsLoaded ? (
                      <ul className="mt-0.5 ml-5 space-y-0.5">
                        {entry.docs.length === 0 ? (
                          <li className="text-muted-foreground px-2 py-0.5 text-xs">
                            No documents
                          </li>
                        ) : (
                          entry.docs.map((doc) => (
                            <li key={doc.id}>
                              <Link
                                href={`/documents/${doc.id}`}
                                className={cn(
                                  'flex items-center gap-1.5 rounded px-2 py-0.5 text-xs transition-colors',
                                  activeDocId === doc.id
                                    ? 'bg-accent text-accent-foreground font-medium'
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                )}
                              >
                                <FileText size={11} aria-hidden className="shrink-0 opacity-70" />
                                <span className="truncate">{doc.title}</span>
                              </Link>
                            </li>
                          ))
                        )}
                      </ul>
                    ) : (
                      <div className="mt-0.5 ml-5 space-y-0.5">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-4 w-full rounded" />
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
