import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Boxes,
  Building2,
  Database,
  Folder,
  FolderKanban,
  Globe,
  KeyRound,
  Lock,
  Mail,
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

const ACCESS_ICONS: Record<string, LucideIcon> = {
  SECRET: Lock,
  PROJECT_TEAM: FolderKanban,
  DEPARTMENT: Users,
  ALL: Building2,
  PERSONAL: User,
};

export const CREDENTIAL_VAULT_CARD_BADGE_CLASS =
  'h-4 shrink-0 gap-0.5 px-1.5 py-0 text-[10px] leading-none';

export function resolvePrimaryCredentialFolder(credential: CredentialListItem) {
  return credential.folders?.find((folder) => folder.isPrimary) ?? credential.folders?.[0] ?? null;
}

export function buildCredentialVaultCardMetaBadges(
  credential: CredentialListItem,
): CredentialVaultMetaBadge[] {
  const category = getCredentialCategoryMeta(credential.category);
  const criticality = getCredentialCriticality(credential.criticality);
  const access = getAccessLevel(credential.accessLevel);
  const primaryFolder = resolvePrimaryCredentialFolder(credential);
  const categoryKey = credential.category in CATEGORY_ICONS ? credential.category : 'OTHER';

  const items: CredentialVaultMetaBadge[] = [
    {
      key: 'category',
      label: category.label,
      variant: category.badgeVariant,
      icon: CATEGORY_ICONS[categoryKey] ?? Tag,
    },
  ];

  if (criticality) {
    items.push({
      key: 'criticality',
      label: criticality.label,
      variant: criticality.variant,
      icon: CRITICALITY_ICONS[credential.criticality] ?? AlertTriangle,
    });
  }

  items.push({
    key: 'access',
    label: access?.label ?? formatCredentialAccessLabel(credential.accessLevel),
    variant: access?.variant ?? 'gray',
    icon: ACCESS_ICONS[credential.accessLevel] ?? Shield,
  });

  if (primaryFolder) {
    items.push({
      key: 'folder',
      label: primaryFolder.name,
      variant: 'amber',
      icon: Folder,
    });
  }

  return items;
}
