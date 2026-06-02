'use client';

import { Pencil, Trash2, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { credentialsApi } from '@/lib/api/credentials';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';

export function CredentialVaultTableUrlCell({
  cred,
  isArchivedList,
}: {
  cred: CredentialListItem;
  isArchivedList: boolean;
}) {
  if (cred.url && !isArchivedList) {
    return (
      <Button
        type="button"
        variant="link"
        className="text-accent h-auto gap-1 p-0 text-xs"
        onClick={() => {
          void (async () => {
            try {
              const { url } = await credentialsApi.recordUrlOpened(cred.id);
              window.open(url, '_blank', 'noopener,noreferrer');
            } catch {
              toast.error('Could not open URL');
            }
          })();
        }}
      >
        <ExternalLink size={10} />
        Open
      </Button>
    );
  }
  if (cred.url && isArchivedList) {
    return <span className="text-muted-foreground text-xs break-all">{cred.url}</span>;
  }
  return <>—</>;
}

export function CredentialVaultTableActionsCell({
  cred,
  isArchivedList,
  onOpenCredential,
  onRequestDelete,
  onRequestPurge,
  onRestored,
}: {
  cred: CredentialListItem;
  isArchivedList: boolean;
  onOpenCredential: (id: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string) => void;
  onRestored: () => void;
}) {
  if (isArchivedList) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <PermissionGate module="CREDENTIALS" action="EDIT">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() => {
              void (async () => {
                try {
                  await credentialsApi.restore(cred.id);
                  toast.success('Credential restored');
                  onRestored();
                } catch {
                  toast.error('Could not restore');
                }
              })();
            }}
          >
            <RotateCcw size={12} />
            Restore
          </Button>
        </PermissionGate>
        <PermissionGate module="CREDENTIALS" action="DELETE">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10 h-8"
            onClick={() => onRequestPurge(cred.id, cred.name)}
          >
            Erase
          </Button>
        </PermissionGate>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-0.5">
      <PermissionGate module="CREDENTIALS" action="EDIT">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Open credential"
          onClick={() => onOpenCredential(cred.id)}
        >
          <Pencil size={12} />
        </Button>
      </PermissionGate>
      <PermissionGate module="CREDENTIALS" action="DELETE">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Archive credential"
          className="text-destructive hover:text-destructive"
          onClick={() => onRequestDelete(cred.id, cred.name)}
        >
          <Trash2 size={12} />
        </Button>
      </PermissionGate>
    </div>
  );
}
