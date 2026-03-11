'use client';

import { useState } from 'react';
import {
  Search,
  Upload,
  FolderKanban,
  FileText,
  Image,
  FileCode,
  FileSpreadsheet,
  File,
  LayoutGrid,
  List,
  ChevronRight,
  HardDrive,
  FolderOpen,
  MoreHorizontal,
  Download,
} from 'lucide-react';

type FileType = 'document' | 'image' | 'code' | 'spreadsheet' | 'other';

interface DriveFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  updatedAt: string;
  folder: string;
}

interface ProjectFolder {
  id: string;
  name: string;
  fileCount: number;
}

const FILE_TYPE_CONFIG: Record<FileType, { icon: typeof File; className: string }> = {
  document: { icon: FileText, className: 'bg-blue-500/10 text-blue-600' },
  image: { icon: Image, className: 'bg-pink-500/10 text-pink-600' },
  code: { icon: FileCode, className: 'bg-emerald-500/10 text-emerald-600' },
  spreadsheet: { icon: FileSpreadsheet, className: 'bg-green-500/10 text-green-600' },
  other: { icon: File, className: 'bg-gray-500/10 text-gray-500' },
};

const MOCK_FOLDERS: ProjectFolder[] = [
  { id: 'all', name: 'All Files', fileCount: 12 },
  { id: 'nbos', name: 'NBOS Platform', fileCount: 6 },
  { id: 'portal', name: 'Client Portal', fileCount: 4 },
  { id: 'mobile', name: 'Mobile App', fileCount: 2 },
];

const MOCK_FILES: DriveFile[] = [
  {
    id: '1',
    name: 'Technical Brief.pdf',
    type: 'document',
    size: '2.4 MB',
    updatedAt: '2026-03-10T14:30:00Z',
    folder: 'nbos',
  },
  {
    id: '2',
    name: 'architecture-diagram.png',
    type: 'image',
    size: '845 KB',
    updatedAt: '2026-03-10T11:00:00Z',
    folder: 'nbos',
  },
  {
    id: '3',
    name: 'database-schema.sql',
    type: 'code',
    size: '12 KB',
    updatedAt: '2026-03-09T16:20:00Z',
    folder: 'nbos',
  },
  {
    id: '4',
    name: 'budget-q1-2026.xlsx',
    type: 'spreadsheet',
    size: '156 KB',
    updatedAt: '2026-03-09T09:45:00Z',
    folder: 'nbos',
  },
  {
    id: '5',
    name: 'API Documentation.pdf',
    type: 'document',
    size: '1.8 MB',
    updatedAt: '2026-03-08T14:10:00Z',
    folder: 'nbos',
  },
  {
    id: '6',
    name: 'env.example',
    type: 'code',
    size: '1.2 KB',
    updatedAt: '2026-03-08T10:30:00Z',
    folder: 'nbos',
  },
  {
    id: '7',
    name: 'client-onboarding.pdf',
    type: 'document',
    size: '3.1 MB',
    updatedAt: '2026-03-07T15:00:00Z',
    folder: 'portal',
  },
  {
    id: '8',
    name: 'portal-mockup.png',
    type: 'image',
    size: '1.2 MB',
    updatedAt: '2026-03-07T11:30:00Z',
    folder: 'portal',
  },
  {
    id: '9',
    name: 'styles-guide.css',
    type: 'code',
    size: '8 KB',
    updatedAt: '2026-03-06T09:00:00Z',
    folder: 'portal',
  },
  {
    id: '10',
    name: 'pricing-tiers.xlsx',
    type: 'spreadsheet',
    size: '92 KB',
    updatedAt: '2026-03-05T16:45:00Z',
    folder: 'portal',
  },
  {
    id: '11',
    name: 'app-icon.png',
    type: 'image',
    size: '340 KB',
    updatedAt: '2026-03-04T10:20:00Z',
    folder: 'mobile',
  },
  {
    id: '12',
    name: 'release-notes.md',
    type: 'document',
    size: '5 KB',
    updatedAt: '2026-03-03T14:00:00Z',
    folder: 'mobile',
  },
];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function FileGridCard({ file }: { file: DriveFile }) {
  const typeCfg = FILE_TYPE_CONFIG[file.type];
  const TypeIcon = typeCfg.icon;

  return (
    <div className="group border-border bg-card rounded-xl border p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2.5 ${typeCfg.className}`}>
          <TypeIcon size={20} />
        </div>
        <button className="hover:bg-secondary rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <MoreHorizontal size={14} className="text-muted-foreground" />
        </button>
      </div>
      <h4 className="text-foreground mt-3 truncate text-sm font-medium" title={file.name}>
        {file.name}
      </h4>
      <div className="text-muted-foreground mt-2 flex items-center justify-between text-[10px]">
        <span>{file.size}</span>
        <span>{formatRelativeTime(file.updatedAt)}</span>
      </div>
    </div>
  );
}

function FileListRow({ file }: { file: DriveFile }) {
  const typeCfg = FILE_TYPE_CONFIG[file.type];
  const TypeIcon = typeCfg.icon;

  return (
    <div className="group border-border bg-card flex items-center gap-4 rounded-xl border px-4 py-3 transition-all hover:shadow-sm">
      <div className={`rounded-lg p-2 ${typeCfg.className}`}>
        <TypeIcon size={16} />
      </div>
      <h4 className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">{file.name}</h4>
      <span className="text-muted-foreground w-20 text-right text-xs">{file.size}</span>
      <span className="text-muted-foreground w-24 text-right text-xs">
        {formatRelativeTime(file.updatedAt)}
      </span>
      <button className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Download size={14} />
      </button>
    </div>
  );
}

export default function DrivePage() {
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const activeFolderData = MOCK_FOLDERS.find((f) => f.id === activeFolder);

  const filtered = MOCK_FILES.filter((file) => {
    const matchesSearch = !search || file.name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = activeFolder === 'all' || file.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar — Project Folders */}
      <div className="border-border bg-card hidden w-60 shrink-0 rounded-2xl border p-4 md:block">
        <div className="mb-4 flex items-center gap-2">
          <HardDrive size={16} className="text-muted-foreground" />
          <h2 className="text-foreground text-sm font-semibold">Drive</h2>
        </div>

        <nav className="space-y-1">
          {MOCK_FOLDERS.map((folder) => {
            const isActive = folder.id === activeFolder;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                {folder.id === 'all' ? <FolderOpen size={16} /> : <FolderKanban size={16} />}
                <span className="flex-1 truncate text-left">{folder.name}</span>
                <span className="bg-secondary text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  {folder.fileCount}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6">
          <button className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-sm transition-colors">
            <Upload size={16} />
            Upload files
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-5">
        {/* Breadcrumb */}
        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          <button
            onClick={() => setActiveFolder('all')}
            className="hover:text-foreground transition-colors"
          >
            Drive
          </button>
          {activeFolder !== 'all' && activeFolderData && (
            <>
              <ChevronRight size={14} />
              <span className="text-foreground font-medium">{activeFolderData.name}</span>
            </>
          )}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">
              {activeFolderData?.name ?? 'Drive'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtered.length} file{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="border-border flex rounded-xl border">
              <button
                onClick={() => setView('grid')}
                className={`rounded-l-xl p-2.5 ${view === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`rounded-r-xl p-2.5 ${view === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
              >
                <List size={16} />
              </button>
            </div>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
              <Upload size={16} />
              Upload
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>

        {/* Files */}
        {filtered.length === 0 ? (
          <div className="border-border rounded-2xl border border-dashed py-20 text-center">
            <FolderOpen size={48} className="text-muted-foreground/30 mx-auto" />
            <h3 className="text-foreground mt-4 text-lg font-semibold">No files yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload your first file to get started
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((file) => (
              <FileGridCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-muted-foreground hidden items-center gap-4 px-4 text-[10px] font-medium tracking-wider uppercase md:flex">
              <span className="w-8" />
              <span className="min-w-0 flex-1">Name</span>
              <span className="w-20 text-right">Size</span>
              <span className="w-24 text-right">Modified</span>
              <span className="w-8" />
            </div>
            {filtered.map((file) => (
              <FileListRow key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
