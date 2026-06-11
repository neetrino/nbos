'use client';

import { ExternalLink, Link2, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buildCredentialVaultHref } from '@/features/credentials/constants/credential-vault-deep-link';
import { cn } from '@/lib/utils';
import { credentialsApi } from '@/lib/api/credentials';

const CARD_ACTION_MENU_HOVER =
  'opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100';

interface CredentialVaultCardActionMenuProps {
  credentialId: string;
  credentialName: string;
  url: string | null;
  isFavorite: boolean;
  selectionEnabled: boolean;
  canArchive?: boolean;
  onSetFavorite?: (favorite: boolean) => void;
  onRequestArchive?: () => void;
}

export function CredentialVaultCardActionMenu({
  credentialId,
  credentialName,
  url,
  isFavorite,
  selectionEnabled,
  canArchive = false,
  onSetFavorite,
  onRequestArchive,
}: CredentialVaultCardActionMenuProps) {
  const hasUrl = Boolean(url?.trim());
  const showArchive = canArchive && Boolean(onRequestArchive);

  const handleOpenUrl = () => {
    void (async () => {
      try {
        const { url: openUrl } = await credentialsApi.recordUrlOpened(credentialId);
        window.open(openUrl, '_blank', 'noopener,noreferrer');
      } catch {
        toast.error('Could not open URL');
      }
    })();
  };

  const handleCopyLink = () => {
    void (async () => {
      try {
        const href = `${window.location.origin}${buildCredentialVaultHref(credentialId)}`;
        await navigator.clipboard.writeText(href);
        toast.success('Link copied');
      } catch {
        toast.error('Could not copy link');
      }
    })();
  };

  return (
    <div
      className={cn(
        'absolute top-1.5 z-10',
        selectionEnabled ? 'right-9' : 'right-1.5',
        CARD_ACTION_MENU_HOVER,
        isFavorite && 'opacity-100',
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              size="icon"
              variant="ghost"
              data-credential-vault-action
              className={cn(
                'size-7',
                isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground',
              )}
              aria-label={`Actions for ${credentialName}`}
              onClick={(event) => {
                event.stopPropagation();
                props.onClick?.(event);
              }}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          )}
        />
        <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
          {onSetFavorite ? (
            <DropdownMenuItem className="gap-2" onClick={() => onSetFavorite(!isFavorite)}>
              <Star className={cn('size-4', isFavorite ? 'fill-current text-amber-500' : null)} />
              {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </DropdownMenuItem>
          ) : null}
          {hasUrl ? (
            <DropdownMenuItem className="gap-2" onClick={handleOpenUrl}>
              <ExternalLink className="size-4" aria-hidden />
              Open URL
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem className="gap-2" onClick={handleCopyLink}>
            <Link2 className="size-4" aria-hidden />
            Copy link
          </DropdownMenuItem>
          {showArchive ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive gap-2"
                onClick={onRequestArchive}
              >
                <Trash2 className="size-4" aria-hidden />
                Archive
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
