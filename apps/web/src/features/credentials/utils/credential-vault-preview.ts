import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';
import { formatCredentialTypeLabel } from '@/features/credentials/utils/credential-type-display';

export type VaultPreviewIconKey =
  | 'at-sign'
  | 'lock'
  | 'key'
  | 'terminal'
  | 'braces'
  | 'shield'
  | 'apple'
  | 'google';

export type VaultPreviewItem =
  | { type: 'info'; icon: VaultPreviewIconKey; label: string }
  | { type: 'copy-text'; icon: VaultPreviewIconKey; value: string; copyLabel: string }
  | {
      type: 'copy-secret';
      icon: VaultPreviewIconKey;
      secret: CredentialSecretField;
      copyLabel: string;
    };

export function partitionVaultPreviewItems(items: VaultPreviewItem[]): {
  top: VaultPreviewItem[];
  bottom: VaultPreviewItem[];
} {
  return {
    top: items.filter((item) => item.type !== 'copy-secret'),
    bottom: items.filter((item) => item.type === 'copy-secret'),
  };
}

export interface VaultPreviewModel {
  /** Centered icon + label when there are no quick-copy actions. */
  infoOnly: boolean;
  items: VaultPreviewItem[];
}

const LOGIN_PASSWORD_TYPES = new Set([
  'LOGIN_PASSWORD',
  'DATABASE',
  'DOMAIN_REGISTRAR',
  'HOSTING_SERVER',
  'MAIL_SMTP',
]);

function appStoreIcon(platform: CredentialListItem['appStorePlatform']): VaultPreviewIconKey {
  return platform === 'GOOGLE' ? 'google' : 'apple';
}

function loginPasswordPreview(credential: CredentialListItem): VaultPreviewModel {
  const items: VaultPreviewItem[] = [];
  const login = credential.login?.trim();

  if (login) {
    items.push({
      type: 'copy-text',
      icon: 'at-sign',
      value: login,
      copyLabel: 'Copy login',
    });
  }
  if (credential.secretsPresent?.password) {
    items.push({
      type: 'copy-secret',
      icon: 'lock',
      secret: 'password',
      copyLabel: 'Copy password',
    });
  }

  if (items.length === 0) {
    return {
      infoOnly: true,
      items: [
        { type: 'info', icon: 'key', label: formatCredentialTypeLabel(credential.credentialType) },
      ],
    };
  }

  return { infoOnly: false, items };
}

/** Type-aware vault card / table preview without extra API fields. */
export function buildCredentialVaultPreview(credential: CredentialListItem): VaultPreviewModel {
  const { credentialType, login, secretsPresent: sp } = credential;

  switch (credentialType) {
    case 'ENV_BUNDLE':
      return { infoOnly: true, items: [{ type: 'info', icon: 'braces', label: 'ENV' }] };

    case 'RECOVERY_CODES':
      return {
        infoOnly: true,
        items: [{ type: 'info', icon: 'shield', label: 'Recovery codes' }],
      };

    case 'SSH_PRIVATE_KEY': {
      const username = login?.trim();
      const hasKey = Boolean(sp?.password);
      if (username && hasKey) {
        return {
          infoOnly: false,
          items: [
            {
              type: 'copy-text',
              icon: 'at-sign',
              value: username,
              copyLabel: 'Copy username',
            },
            {
              type: 'copy-secret',
              icon: 'lock',
              secret: 'password',
              copyLabel: 'Copy private key',
            },
          ],
        };
      }
      return { infoOnly: true, items: [{ type: 'info', icon: 'terminal', label: 'SSH' }] };
    }

    case 'API_KEY':
      if (sp?.apiKey) {
        return {
          infoOnly: false,
          items: [
            { type: 'info', icon: 'key', label: 'API key' },
            {
              type: 'copy-secret',
              icon: 'key',
              secret: 'apiKey',
              copyLabel: 'Copy API key',
            },
          ],
        };
      }
      return { infoOnly: true, items: [{ type: 'info', icon: 'key', label: 'API key' }] };

    case 'APP_STORE_ACCOUNT': {
      const platformIcon = appStoreIcon(credential.appStorePlatform);
      const account = login?.trim();
      const items: VaultPreviewItem[] = [];

      if (account) {
        items.push({
          type: 'copy-text',
          icon: platformIcon,
          value: account,
          copyLabel: 'Copy account',
        });
      }
      if (sp?.password) {
        items.push({
          type: 'copy-secret',
          icon: 'lock',
          secret: 'password',
          copyLabel: 'Copy password',
        });
      }
      if (items.length === 0) {
        return {
          infoOnly: true,
          items: [{ type: 'info', icon: platformIcon, label: 'App Store' }],
        };
      }
      return { infoOnly: false, items };
    }

    default:
      if (LOGIN_PASSWORD_TYPES.has(credentialType)) {
        return loginPasswordPreview(credential);
      }
      return loginPasswordPreview(credential);
  }
}
