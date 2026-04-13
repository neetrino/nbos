'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { projectsApi } from '@/lib/api/projects';
import { driveApi, type DriveFileEntry } from '@/lib/api/drive';

type FileType = 'document' | 'image' | 'code' | 'spreadsheet' | 'other';

interface ProjectFolder {
  id: string;
  name: string;
  code: string;
  fileCount?: number;
}

const FILE_TYPE_CONFIG: Record<FileType, { icon: typeof File; className: string }> = {
  document: { icon: FileText, className: 'bg-blue-500/10 text-blue-600' },
  image: { icon: Image, className: 'bg-pink-500/10 text-pink-600' },
  code: { icon: FileCode, className: 'bg-emerald-500/10 text-emerald-600' },
  spreadsheet: { icon: FileSpreadsheet, className: 'bg-green-500/10 text-green-600' },
  other: { icon: File, className: 'bg-gray-500/10 text-gray-500' },
};

function getFileType(name: string): FileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const doc = ['pdf', 'doc', 'docx'];
  const img = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
  const code = ['ts', 'tsx', 'js', 'jsx', 'sql', 'md', 'json', 'css', 'html'];
  const sheet = ['xlsx', 'xls', 'csv'];
  if (doc.includes(ext)) return 'document';
  if (img.includes(ext)) return 'image';
  if (code.includes(ext)) return 'code';
  if (sheet.includes(ext)) return 'spreadsheet';
  return 'other';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number((bytes / Math.pow(k, i)).toFixed(i > 1 ? 1 : 0))} ${sizes[i]}`;
}

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return '—';
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

function FileGridCard({
  file,
  onDownload,
}: {
  file: DriveFileEntry;
  onDownload: (file: DriveFileEntry) => void;
}) {
  const type = file.isFolder ? 'other' : getFileType(file.name);
  const typeCfg = FILE_TYPE_CONFIG[type];
  const TypeIcon = typeCfg.icon;

  return (
    <div className="group border-border bg-card rounded-xl border p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2.5 ${typeCfg.className}`}>
          <TypeIcon size={20} />
        </div>
        {!file.isFolder && (
          <button
            onClick={() => onDownload(file)}
            className="hover:bg-secondary rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100"
            title="Download"
          >
            <MoreHorizontal size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>
      <h4 className="text-foreground mt-3 truncate text-sm font-medium" title={file.name}>
        {file.name}
      </h4>
      <div className="text-muted-foreground mt-2 flex items-center justify-between text-[10px]">
        <span>{file.isFolder ? '—' : formatSize(file.size)}</span>
        <span>{formatRelativeTime(file.lastModified)}</span>
      </div>
    </div>
  );
}

function FileListRow({
  file,
  onDownload,
}: {
  file: DriveFileEntry;
  onDownload: (file: DriveFileEntry) => void;
}) {
  const type = file.isFolder ? 'other' : getFileType(file.name);
  const typeCfg = FILE_TYPE_CONFIG[type];
  const TypeIcon = typeCfg.icon;

  return (
    <div className="group border-border bg-card flex items-center gap-4 rounded-xl border px-4 py-3 transition-all hover:shadow-sm">
      <div className={`rounded-lg p-2 ${typeCfg.className}`}>
        <TypeIcon size={16} />
      </div>
      <h4 className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">{file.name}</h4>
      <span className="text-muted-foreground w-20 text-right text-xs">
        {file.isFolder ? '—' : formatSize(file.size)}
      </span>
      <span className="text-muted-foreground w-24 text-right text-xs">
        {formatRelativeTime(file.lastModified)}
      </span>
      {!file.isFolder && (
        <button
          onClick={() => onDownload(file)}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
          title="Download"
        >
          <Download size={14} />
        </button>
      )}
    </div>
  );
}

export default function DrivePage() {
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [files, setFiles] = useState<DriveFileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const { items } = await projectsApi.getAll({ pageSize: 100 });
      setFolders([
        { id: 'all', name: 'All Files', code: 'all' },
        ...items.map((p) => ({ id: p.id, name: p.name, code: p.code })),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    }
  }, []);

  const loadFiles = useCallback(async (projectId: string) => {
    if (projectId === 'all') {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await driveApi.listFiles(projectId);
      setFiles(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (activeFolder) loadFiles(activeFolder);
  }, [activeFolder, loadFiles]);

  const activeFolderData = folders.find((f) => f.id === activeFolder);

  const filtered = files.filter((file) => {
    const matchesSearch = !search || file.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleDownload = async (file: DriveFileEntry) => {
    if (file.isFolder || activeFolder === 'all') return;
    try {
      const { downloadUrl } = await driveApi.getDownloadUrl(activeFolder, file.key);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeFolder === 'all') return;
    setUploading(true);
    setError(null);
    try {
      const { uploadUrl } = await driveApi.getUploadUrl(
        activeFolder,
        file.name,
        file.type || 'application/octet-stream',
      );
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      await loadFiles(activeFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar — Project Folders */}
      <div className="border-border bg-card hidden w-60 shrink-0 rounded-2xl border p-4 md:block">
        <div className="mb-4 flex items-center gap-2">
          <HardDrive size={16} className="text-muted-foreground" />
          <h2 className="text-foreground text-sm font-semibold">Drive</h2>
        </div>

        <nav className="space-y-1">
          {folders.map((folder) => {
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
                {folder.fileCount != null && (
                  <span className="bg-secondary text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                    {folder.fileCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-6">
          <label className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-sm transition-colors">
            <input
              type="file"
              className="hidden"
              disabled={activeFolder === 'all' || uploading}
              onChange={handleUpload}
            />
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Uploading…' : 'Upload files'}
          </label>
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-5">
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">
              {activeFolderData?.name ?? 'Drive'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {loading ? 'Loading…' : `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`}
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
            <label className="bg-primary text-primary-foreground hover:bg-primary/90 flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
              <input
                type="file"
                className="hidden"
                disabled={activeFolder === 'all' || uploading}
                onChange={handleUpload}
              />
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-muted-foreground animate-spin" />
          </div>
        ) : activeFolder === 'all' ? (
          <div className="border-border rounded-2xl border border-dashed py-20 text-center">
            <FolderOpen size={48} className="text-muted-foreground/30 mx-auto" />
            <h3 className="text-foreground mt-4 text-lg font-semibold">Select a project</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose a project in the sidebar to view and upload files (stored in Cloudflare R2).
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-border rounded-2xl border border-dashed py-20 text-center">
            <FolderOpen size={48} className="text-muted-foreground/30 mx-auto" />
            <h3 className="text-foreground mt-4 text-lg font-semibold">No files yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload your first file to get started (files are stored in R2 Drive).
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((file) => (
              <FileGridCard key={file.key} file={file} onDownload={handleDownload} />
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
              <FileListRow key={file.key} file={file} onDownload={handleDownload} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
