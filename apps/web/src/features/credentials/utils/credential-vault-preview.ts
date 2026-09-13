import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';
import { credentialTypeMessageKey } from '@/features/credentials/constants/credentials';

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
  | { type: 'info'; icon: VaultPreviewIconKey; labelKey: string }
  | { type: 'copy-text'; icon: VaultPreviewIconKey; value: string; copyLabelKey: string }
  | {
      type: 'copy-secret';
      icon: VaultPreviewIconKey;
      secret: CredentialSecretField;
      copyLabelKey: string;
    };

export function partitionVaultPreviewItems(items: VaultPreviewItem[]): {
  top: VaultPreviewItem[];
  bottom: VaultPreviewItem[];
} {
  return {
    /** Badge/info rows stay above; login + secrets stay together as one cluster. */
    top: items.filter((item) => item.type === 'info'),
    bottom: items.filter((item) => item.type !== 'info'),
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

function typeInfoLabelKey(credentialType: string): string {
  return credentialTypeMessageKey(credentialType) ?? `types.${credentialType}`;
}

function loginPasswordPreview(credential: CredentialListItem): VaultPreviewModel {
  const items: VaultPreviewItem[] = [];
  const login = credential.login?.trim();

  if (login) {
    items.push({
      type: 'copy-text',
      icon: 'at-sign',
      value: login,
      copyLabelKey: 'tiles.copyLogin',
    });
  }
  if (credential.secretsPresent?.password) {
    items.push({
      type: 'copy-secret',
      icon: 'lock',
      secret: 'password',
      copyLabelKey: 'tiles.copyPassword',
    });
  }

  if (items.length === 0) {
    return {
      infoOnly: true,
      items: [{ type: 'info', icon: 'key', labelKey: typeInfoLabelKey(credential.credentialType) }],
    };
  }

  return { infoOnly: false, items };
}

/** Type-aware vault card / table preview without extra API fields. */
export function buildCredentialVaultPreview(credential: CredentialListItem): VaultPreviewModel {
  const { credentialType, login, secretsPresent: sp } = credential;

  switch (credentialType) {
    case 'ENV_BUNDLE':
      return {
        infoOnly: true,
        items: [{ type: 'info', icon: 'braces', labelKey: 'tiles.infoEnv' }],
      };

    case 'RECOVERY_CODES':
      return {
        infoOnly: true,
        items: [{ type: 'info', icon: 'shield', labelKey: 'types.RECOVERY_CODES' }],
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
              copyLabelKey: 'tiles.copyUsername',
            },
            {
              type: 'copy-secret',
              icon: 'lock',
              secret: 'password',
              copyLabelKey: 'tiles.copyPrivateKey',
            },
          ],
        };
      }
      return {
        infoOnly: true,
        items: [{ type: 'info', icon: 'terminal', labelKey: 'tiles.infoSsh' }],
      };
    }

    case 'API_KEY':
      if (sp?.apiKey) {
        return {
          infoOnly: false,
          items: [
            { type: 'info', icon: 'key', labelKey: 'tiles.infoApiKey' },
            {
              type: 'copy-secret',
              icon: 'key',
              secret: 'apiKey',
              copyLabelKey: 'tiles.copyApiKey',
            },
          ],
        };
      }
      return {
        infoOnly: true,
        items: [{ type: 'info', icon: 'key', labelKey: 'tiles.infoApiKey' }],
      };

    case 'APP_STORE_ACCOUNT': {
      const platformIcon = appStoreIcon(credential.appStorePlatform);
      const account = login?.trim();
      const items: VaultPreviewItem[] = [];

      if (account) {
        items.push({
          type: 'copy-text',
          icon: platformIcon,
          value: account,
          copyLabelKey: 'tiles.copyAccount',
        });
      }
      if (sp?.password) {
        items.push({
          type: 'copy-secret',
          icon: 'lock',
          secret: 'password',
          copyLabelKey: 'tiles.copyPassword',
        });
      }
      if (items.length === 0) {
        return {
          infoOnly: true,
          items: [{ type: 'info', icon: platformIcon, labelKey: 'tiles.infoAppStore' }],
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
