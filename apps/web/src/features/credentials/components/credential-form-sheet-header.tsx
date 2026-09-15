'use client';

import { useTranslations } from 'next-intl';
import { RotateCcw, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { DetailSheetSettingsMenu, StatusBadge } from '@/components/shared';
import {
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import {
  CredentialAccessIcon,
  CredentialCriticalityIcon,
} from '@/features/credentials/components/credential-meta-icon';
import { cn } from '@/lib/utils';
import { CredentialBrandMark } from '@/features/credentials/components/credential-brand-mark';
import { CredentialFormSheetNameField } from '@/features/credentials/components/credential-form-sheet-name-field';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';

const TITLE_CLUSTER_MAX_CLASS = 'max-w-[calc(100%-5.5rem)]';
const ACCESS_SCOPE_BADGE_CLASS = 'h-5 shrink-0 self-center px-1.5 py-0 text-[10px] leading-none';

export interface CredentialFormSheetHeaderProps {
  isCreate: boolean;
  credentialId: string | null;
  name: string;
  onNameChange: (value: string) => void;
  url?: string | null;
  providerName?: string | null;
  login?: string | null;
  category?: string | null;
  credentialType?: string | null;
  accessLevel: string;
  criticality: string;
  showSettings: boolean;
  onToggleSettings: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onRequestMoveToTrash?: (id: string, name: string) => void;
  isTrashView?: boolean;
  onRestore?: (id: string) => void | Promise<void>;
  resetKey: string;
}

export function CredentialFormSheetHeader({
  isCreate,
  credentialId,
  name,
  onNameChange,
  url,
  providerName,
  login,
  category,
  credentialType,
  accessLevel,
  criticality,
  showSettings,
  onToggleSettings,
  isFavorite = false,
  onToggleFavorite,
  onRequestMoveToTrash,
  isTrashView = false,
  onRestore,
  resetKey,
}: CredentialFormSheetHeaderProps) {
  const t = useTranslations('credentials');
  const isMobileViewport = useIsMobileViewport();
  const accessMeta = getAccessLevel(accessLevel);
  const critMeta = getCredentialCriticality(criticality);

  const favoriteButton =
    !isCreate && onToggleFavorite ? (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          'text-muted-foreground hover:text-foreground shrink-0',
          isFavorite && 'text-amber-500 hover:text-amber-600',
        )}
        aria-label={isFavorite ? t('tiles.removeFavorite') : t('tiles.addFavorite')}
        title={isFavorite ? t('tiles.removeFavorite') : t('tiles.addFavorite')}
        onClick={onToggleFavorite}
      >
        <Star className={cn('size-4', isFavorite && 'fill-current')} aria-hidden />
      </Button>
    ) : null;

  const settingsMenu =
    !isCreate && credentialId ? (
      <DetailSheetSettingsMenu>
        <DropdownMenuItem onClick={onToggleSettings}>
          {showSettings ? 'Hide advanced settings' : 'Advanced settings'}
        </DropdownMenuItem>
        {isTrashView && onRestore ? (
          <DropdownMenuItem onClick={() => void onRestore(credentialId)}>
            <RotateCcw className="mr-2 size-4" />
            Restore
          </DropdownMenuItem>
        ) : null}
        {!isTrashView && onRequestMoveToTrash ? (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onRequestMoveToTrash(credentialId, name)}
          >
            <Trash2 className="mr-2 size-4" />
            Move to Trash
          </DropdownMenuItem>
        ) : null}
      </DetailSheetSettingsMenu>
    ) : null;

  const titleCluster = (
    <div
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5',
        !isMobileViewport && TITLE_CLUSTER_MAX_CLASS,
        'min-w-0 flex-1',
      )}
    >
      <CredentialBrandMark
        url={url}
        provider={providerName}
        name={name}
        login={login}
        category={category}
        credentialType={credentialType}
        className="size-5 shrink-0"
      />
      <CredentialFormSheetNameField
        isCreate={isCreate}
        name={name}
        onNameChange={onNameChange}
        resetKey={resetKey}
      />

      {accessMeta ? (
        <StatusBadge
          label={accessMeta.label}
          variant={accessMeta.variant}
          className={ACCESS_SCOPE_BADGE_CLASS}
          icon={
            <CredentialAccessIcon
              accessLevel={accessLevel}
              className="size-2.5 shrink-0 opacity-90"
              aria-hidden
            />
          }
        />
      ) : null}

      {critMeta && !isCreate ? (
        <StatusBadge
          label={critMeta.label}
          variant={critMeta.variant}
          className={ACCESS_SCOPE_BADGE_CLASS}
          icon={
            <CredentialCriticalityIcon
              criticality={criticality}
              className="size-2.5 shrink-0 opacity-90"
              aria-hidden
            />
          }
        />
      ) : null}
    </div>
  );

  if (isMobileViewport) {
    return (
      <div className={cn('border-border border-b', DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS)}>
        <div className={DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS}>
          {favoriteButton}
          {settingsMenu}
        </div>
        <div className={DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS}>
          <div className="flex min-w-0 items-center gap-2.5">{titleCluster}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2.5">
          {titleCluster}
          {favoriteButton ? <div className="ml-auto shrink-0">{favoriteButton}</div> : null}
        </div>
      </div>
      {settingsMenu}
    </div>
  );
}
