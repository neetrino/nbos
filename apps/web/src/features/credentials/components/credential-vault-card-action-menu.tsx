'use client';

import { MoreHorizontal, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const CARD_ACTION_MENU_HOVER =
  'opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100';

interface CredentialVaultCardActionMenuProps {
  isFavorite: boolean;
  credentialName: string;
  selectionEnabled: boolean;
  onSetFavorite: (favorite: boolean) => void;
}

export function CredentialVaultCardActionMenu({
  isFavorite,
  credentialName,
  selectionEnabled,
  onSetFavorite,
}: CredentialVaultCardActionMenuProps) {
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
          <DropdownMenuItem className="gap-2" onClick={() => onSetFavorite(!isFavorite)}>
            <Star className={cn('size-4', isFavorite ? 'fill-current text-amber-500' : null)} />
            {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
