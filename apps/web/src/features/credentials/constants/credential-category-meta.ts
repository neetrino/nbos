import type { StatusVariant } from '@/components/shared/StatusBadge';
import { CREDENTIAL_CATEGORIES } from '@/features/credentials/constants/credentials';

const CATEGORY_BADGE_VARIANTS: Record<string, StatusVariant> = {
  ADMIN: 'zinc',
  DOMAIN: 'blue',
  HOSTING: 'cyan',
  SERVICE: 'violet',
  APP: 'indigo',
  MAIL: 'cyan',
  API_KEY: 'amber',
  DATABASE: 'emerald',
  OTHER: 'gray',
};

const CATEGORY_ACCENT_BAR: Record<string, string> = {
  ADMIN: 'bg-slate-600',
  DOMAIN: 'bg-blue-500',
  HOSTING: 'bg-cyan-600',
  SERVICE: 'bg-violet-500',
  APP: 'bg-indigo-500',
  MAIL: 'bg-sky-500',
  API_KEY: 'bg-amber-500',
  DATABASE: 'bg-emerald-600',
  OTHER: 'bg-gray-400',
};

const DEFAULT_CATEGORY_ACCENT = CATEGORY_ACCENT_BAR.OTHER;

function categoryValueOrOther(category: string): string {
  const known = CREDENTIAL_CATEGORIES.some((item) => item.value === category);
  return known ? category : 'OTHER';
}

/** Tailwind `bg-*` for kanban column stage bar and card accent (single source). */
export function credentialCategoryAccentBarClass(category: string): string {
  return CATEGORY_ACCENT_BAR[categoryValueOrOther(category)] ?? DEFAULT_CATEGORY_ACCENT;
}

export interface CredentialCategoryMeta {
  label: string;
  badgeVariant: StatusVariant;
  accentBarClass: string;
}

/** Colored category label + accent for vault tiles (aligned with kanban column colors). */
export function getCredentialCategoryMeta(category: string): CredentialCategoryMeta {
  const entry =
    CREDENTIAL_CATEGORIES.find((item) => item.value === category) ??
    CREDENTIAL_CATEGORIES.find((item) => item.value === 'OTHER');
  const value = entry?.value ?? 'OTHER';
  return {
    label: entry?.label ?? 'Other',
    badgeVariant: CATEGORY_BADGE_VARIANTS[value] ?? 'gray',
    accentBarClass: credentialCategoryAccentBarClass(category),
  };
}
