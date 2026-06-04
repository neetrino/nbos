'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { credentialsApi } from '@/lib/api/credentials';
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
