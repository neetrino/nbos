'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CredentialFolder } from '@/lib/api/credentials';

interface CredentialFolderBreadcrumbProps {
  path: CredentialFolder[];
  onNavigate: (folderId: string | null) => void;
}

export function CredentialFolderBreadcrumb({ path, onNavigate }: CredentialFolderBreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <nav aria-label="Folder path" className="flex flex-wrap items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
        onClick={() => onNavigate(null)}
      >
        Folders
      </Button>
      {path.map((folder, index) => {
        const isLast = index === path.length - 1;
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
                onClick={() => onNavigate(folder.id)}
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
