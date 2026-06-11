import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  AtSign,
  Boxes,
  Building2,
  Database,
  Folder,
  FolderKanban,
  Globe,
  Key,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  OctagonAlert,
  Server,
  Settings,
  Shield,
  Signal,
  Smartphone,
  Tag,
  User,
  Users,
} from 'lucide-react';
import type { CredentialFormField } from '@/features/credentials/credential-field-config';
import type { StatusVariant } from '@/components/shared/StatusBadge';
import { getCredentialCategoryMeta } from '@/features/credentials/constants/credential-category-meta';
import {
  formatCredentialAccessLabel,
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

export interface CredentialVaultMetaBadge {
  key: string;
  label: string;
  variant: StatusVariant;
  icon: LucideIcon;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  ADMIN: Settings,
  DOMAIN: Globe,
  HOSTING: Server,
  SERVICE: Boxes,
  APP: Smartphone,
  MAIL: Mail,
  API_KEY: KeyRound,
  DATABASE: Database,
  OTHER: Tag,
};

const CRITICALITY_ICONS: Record<string, LucideIcon> = {
  LOW: Signal,
  MEDIUM: Signal,
  HIGH: AlertTriangle,
  CRITICAL: OctagonAlert,
};

const CRITICALITY_ACCENT_BAR: Record<string, string> = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-amber-500',
  CRITICAL: 'bg-red-600',
};

const ACCESS_ICONS: Record<string, LucideIcon> = {
  SECRET: Lock,
  PROJECT_TEAM: FolderKanban,
  DEPARTMENT: Users,
  ALL: Building2,
  PERSONAL: User,
};

export const CREDENTIAL_VAULT_CARD_BADGE_CLASS =
  'h-4 shrink-0 gap-0.5 px-1.5 py-0 text-[10px] leading-none';

export function credentialCategoryIcon(category: string): LucideIcon {
  const key = category in CATEGORY_ICONS ? category : 'OTHER';
  return CATEGORY_ICONS[key] ?? Tag;
}

export function credentialAccessIcon(accessLevel: string): LucideIcon {
  return ACCESS_ICONS[accessLevel] ?? Shield;
}

export function credentialCriticalityIcon(criticality: string): LucideIcon {
  return CRITICALITY_ICONS[criticality] ?? AlertTriangle;
}

/** Left card stripe — criticality indicator on vault cards. */
export function credentialCriticalityAccentBarClass(criticality: string): string {
  return CRITICALITY_ACCENT_BAR[criticality] ?? CRITICALITY_ACCENT_BAR.LOW;
}

const CREDENTIAL_TYPE_ICONS: Record<string, LucideIcon> = {
  LOGIN_PASSWORD: KeyRound,
  API_KEY: KeyRound,
  DATABASE: Database,
  SSH_PRIVATE_KEY: Server,
  ENV_BUNDLE: KeyRound,
  DOMAIN_REGISTRAR: Globe,
  HOSTING_SERVER: Server,
  APP_STORE_ACCOUNT: Smartphone,
  MAIL_SMTP: Mail,
  RECOVERY_CODES: Shield,
};

export function credentialTypeIcon(credentialType: string): LucideIcon {
  return CREDENTIAL_TYPE_ICONS[credentialType] ?? KeyRound;
}

const FORM_FIELD_ICONS: Partial<Record<CredentialFormField, LucideIcon>> = {
  url: Globe,
  login: AtSign,
  password: Lock,
  passphrase: Lock,
  apiKey: Key,
  envData: Key,
};

/** Sheet form field labels (URL, login, password, …). */
export function credentialFormFieldIcon(field: CredentialFormField): LucideIcon {
  return FORM_FIELD_ICONS[field] ?? Globe;
}

export const CREDENTIAL_FOLDER_ICON = Folder;

export const CREDENTIAL_COMMENT_ICON = MessageSquare;

export function resolvePrimaryCredentialFolder(credential: CredentialListItem) {
  return credential.folders?.find((folder) => folder.isPrimary) ?? credential.folders?.[0] ?? null;
}

export function buildCredentialVaultCardMetaBadges(
  credential: CredentialListItem,
  options?: { includeCriticality?: boolean },
): CredentialVaultMetaBadge[] {
  const includeCriticality = options?.includeCriticality ?? true;
  const category = getCredentialCategoryMeta(credential.category);
  const criticality = getCredentialCriticality(credential.criticality);
  const access = getAccessLevel(credential.accessLevel);
  const primaryFolder = resolvePrimaryCredentialFolder(credential);

  const items: CredentialVaultMetaBadge[] = [
    {
      key: 'category',
      label: category.label,
      variant: category.badgeVariant,
      icon: credentialCategoryIcon(credential.category),
    },
  ];

  if (includeCriticality && criticality) {
    items.push({
      key: 'criticality',
      label: criticality.label,
      variant: criticality.variant,
      icon: credentialCriticalityIcon(credential.criticality),
    });
  }

  items.push({
    key: 'access',
    label: access?.label ?? formatCredentialAccessLabel(credential.accessLevel),
    variant: access?.variant ?? 'gray',
    icon: credentialAccessIcon(credential.accessLevel),
  });

  if (primaryFolder) {
    items.push({
      key: 'folder',
      label: primaryFolder.name,
      variant: 'amber',
      icon: CREDENTIAL_FOLDER_ICON,
    });
  }

  return items;
}
