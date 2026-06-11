'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CredentialFolder } from '@/lib/api/credentials';

interface CredentialVaultFoldersNavProps {
  rootLabel: string;
  project?: { id: string; name: string } | null;
  folderPath: CredentialFolder[];
  onNavigateRoot: () => void;
  onNavigateProject?: (projectId: string) => void;
  onNavigateFolder: (folderId: string) => void;
}

export function CredentialVaultFoldersNav({
  rootLabel,
  project,
  folderPath,
  onNavigateRoot,
  onNavigateProject,
  onNavigateFolder,
}: CredentialVaultFoldersNavProps) {
  if (!project && folderPath.length === 0) return null;

  return (
    <nav aria-label="Folder path" className="flex flex-wrap items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
        onClick={onNavigateRoot}
      >
        {rootLabel}
      </Button>
      {project ? (
        <span className="flex items-center gap-0.5">
          <ChevronRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          {folderPath.length === 0 ? (
            <span className="text-foreground px-2 text-xs font-medium">{project.name}</span>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-7 max-w-48 px-2 text-xs"
              onClick={() => onNavigateProject?.(project.id)}
            >
              <span className="truncate">{project.name}</span>
            </Button>
          )}
        </span>
      ) : null}
      {folderPath.map((folder, index) => {
        const isLast = index === folderPath.length - 1;
        return (
          <span key={folder.id} className="flex items-center gap-0.5">
            <ChevronRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
            {isLast ? (
              <span className="text-foreground px-2 text-xs font-medium">{folder.name}</span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-7 max-w-40 px-2 text-xs"
                onClick={() => onNavigateFolder(folder.id)}
              >
                <span className="truncate">{folder.name}</span>
              </Button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
