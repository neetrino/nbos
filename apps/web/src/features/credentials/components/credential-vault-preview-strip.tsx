'use client';

import { AtSign, Braces, KeyRound, Lock, Shield, Terminal } from 'lucide-react';
import {
  ApplePlatformIcon,
  GooglePlayPlatformIcon,
} from '@/features/credentials/components/credential-app-store-platform-icons';
import { CredentialVaultSecretPill } from '@/features/credentials/components/credential-vault-secret-pills';
import {
  buildCredentialVaultPreview,
  partitionVaultPreviewItems,
  type VaultPreviewIconKey,
  type VaultPreviewItem,
} from '@/features/credentials/utils/credential-vault-preview';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';
import { cn } from '@/lib/utils';

const PASSWORD_MASK = '••••••';

const VAULT_PREVIEW_PILL_ICON_CLASS = 'size-3.5 shrink-0';
const VAULT_PREVIEW_INFO_ICON_CLASS = 'text-muted-foreground size-6 shrink-0';
const VAULT_PREVIEW_INFO_LABEL_CLASS =
  'text-muted-foreground text-sm leading-tight font-medium tracking-tight';

interface VaultPreviewIconProps {
  icon: VaultPreviewIconKey;
  className?: string;
  size?: 'pill' | 'badge';
}

function VaultPreviewIcon({ icon, className, size = 'pill' }: VaultPreviewIconProps) {
  const shared = cn(
    size === 'badge' ? VAULT_PREVIEW_INFO_ICON_CLASS : VAULT_PREVIEW_PILL_ICON_CLASS,
    className,
  );
  const lucideSize = size === 'badge' ? 22 : 14;
  switch (icon) {
    case 'apple':
      return <ApplePlatformIcon className={shared} />;
    case 'google':
      return <GooglePlayPlatformIcon className={shared} />;
    case 'lock':
      return <Lock size={lucideSize} strokeWidth={2} className={shared} />;
    case 'key':
      return <KeyRound size={lucideSize} strokeWidth={2} className={shared} />;
    case 'terminal':
      return <Terminal size={lucideSize} strokeWidth={2} className={shared} />;
    case 'braces':
      return <Braces size={lucideSize} strokeWidth={2} className={shared} />;
    case 'shield':
      return <Shield size={lucideSize} strokeWidth={2} className={shared} />;
    default:
      return <AtSign size={lucideSize} strokeWidth={2} className={shared} />;
  }
}

export function CredentialVaultInfoPreview({
  icon,
  label,
}: {
  icon: VaultPreviewIconKey;
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 px-1 py-1">
      <VaultPreviewIcon icon={icon} size="badge" />
      <span className={VAULT_PREVIEW_INFO_LABEL_CLASS}>{label}</span>
    </div>
  );
}

export interface CredentialVaultPreviewStripProps {
  credential: CredentialListItem;
  secretFlashCredentialId?: string | null;
  onCopyText?: (text: string) => void;
  onCopySecret?: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
  /** When false, fields are display-only (copy actions live on card hover bar). */
  interactive?: boolean;
  /** When set, only render the item at this index (for table columns). */
  itemIndex?: number;
  className?: string;
}

const VAULT_PREVIEW_STATIC_ROW_CLASS =
  'flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left';

function VaultPreviewStaticRow({
  icon,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={VAULT_PREVIEW_STATIC_ROW_CLASS}>
      <span className="text-muted-foreground shrink-0" aria-hidden>
        {icon}
      </span>
      <span
        className={cn(
          'text-foreground min-w-0 flex-1 truncate text-[11px] leading-tight',
          mono && 'font-mono',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function renderPreviewItem(
  item: VaultPreviewItem,
  credential: CredentialListItem,
  secretFlashCredentialId: string | null | undefined,
  interactive: boolean,
  onCopyText?: (text: string) => void,
  onCopySecret?: (credentialId: string, criticality: string, field: CredentialSecretField) => void,
) {
  if (item.type === 'info') {
    return <CredentialVaultInfoPreview icon={item.icon} label={item.label} />;
  }

  if (item.type === 'copy-text') {
    if (!interactive) {
      return (
        <VaultPreviewStaticRow icon={<VaultPreviewIcon icon={item.icon} />} value={item.value} />
      );
    }
    if (!onCopyText) return null;
    return (
      <CredentialVaultSecretPill
        icon={<VaultPreviewIcon icon={item.icon} />}
        value={item.value}
        copyLabel={item.copyLabel}
        onCopy={() => onCopyText(item.value)}
      />
    );
  }

  if (!interactive) {
    return (
      <VaultPreviewStaticRow
        icon={<VaultPreviewIcon icon={item.icon} />}
        value={PASSWORD_MASK}
        mono
      />
    );
  }

  if (!onCopySecret) return null;

  return (
    <CredentialVaultSecretPill
      icon={<VaultPreviewIcon icon={item.icon} />}
      value={PASSWORD_MASK}
      copyLabel={item.copyLabel}
      copied={secretFlashCredentialId === credential.id}
      mono
      onCopy={() => onCopySecret(credential.id, credential.criticality, item.secret)}
    />
  );
}

function topSectionIsCenteredBadge(top: VaultPreviewItem[]): boolean {
  return top.length > 0 && top.every((item) => item.type === 'info');
}

export function CredentialVaultPreviewStrip({
  credential,
  secretFlashCredentialId,
  onCopyText,
  onCopySecret,
  interactive = true,
  itemIndex,
  className,
}: CredentialVaultPreviewStripProps) {
  const model = buildCredentialVaultPreview(credential);

  if (itemIndex !== undefined) {
    const item = model.items[itemIndex];
    if (!item) return null;
    return (
      <div className={className}>
        {renderPreviewItem(
          item,
          credential,
          secretFlashCredentialId,
          interactive,
          onCopyText,
          onCopySecret,
        )}
      </div>
    );
  }

  if (model.items.length === 0) return null;

  if (model.infoOnly) {
    const item = model.items[0];
    if (item?.type !== 'info') return null;
    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center', className)}>
        <CredentialVaultInfoPreview icon={item.icon} label={item.label} />
      </div>
    );
  }

  const { top, bottom } = partitionVaultPreviewItems(model.items);
  const centeredTop = topSectionIsCenteredBadge(top);

  return (
    <div className={cn('flex min-h-[52px] flex-1 flex-col gap-1', className)}>
      {top.length > 0 ? (
        <div
          className={cn(
            'flex flex-col gap-1',
            centeredTop && 'flex flex-1 items-center justify-center',
          )}
        >
          {top.map((item, index) => (
            <div key={`top-${item.type}-${index}`}>
              {renderPreviewItem(
                item,
                credential,
                secretFlashCredentialId,
                interactive,
                onCopyText,
                onCopySecret,
              )}
            </div>
          ))}
        </div>
      ) : null}
      {bottom.length > 0 ? (
        <div className="mt-auto flex flex-col gap-1">
          {bottom.map((item, index) => (
            <div key={`bottom-${item.type}-${index}`}>
              {renderPreviewItem(
                item,
                credential,
                secretFlashCredentialId,
                interactive,
                onCopyText,
                onCopySecret,
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
