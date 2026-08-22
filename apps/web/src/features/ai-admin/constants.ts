import {
  Activity,
  Bot,
  Cable,
  Cpu,
  LayoutDashboard,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';

export const AI_ADMIN_BASE_PATH = '/settings/ai-agents';

export const AI_ADMIN_NAV: PageHeroNavLinkItem[] = [
  { href: AI_ADMIN_BASE_PATH, label: 'Overview', icon: LayoutDashboard, exactMatch: true },
  { href: `${AI_ADMIN_BASE_PATH}/external-agents`, label: 'External Agents', icon: Bot },
  { href: `${AI_ADMIN_BASE_PATH}/providers`, label: 'Providers', icon: Cable },
  { href: `${AI_ADMIN_BASE_PATH}/models`, label: 'Models', icon: Cpu },
  { href: `${AI_ADMIN_BASE_PATH}/policies`, label: 'Model Policies', icon: Route },
  { href: `${AI_ADMIN_BASE_PATH}/internal-agents`, label: 'Internal Agents', icon: Users },
  { href: `${AI_ADMIN_BASE_PATH}/usage`, label: 'Usage', icon: Sparkles },
  { href: `${AI_ADMIN_BASE_PATH}/approvals`, label: 'Approvals', icon: ShieldCheck },
  { href: `${AI_ADMIN_BASE_PATH}/audit`, label: 'Audit', icon: Activity },
];

export const AI_ADMIN_POLICY_MODES = ['FIXED', 'PRIMARY_FALLBACK'] as const;

export const AI_ADMIN_ID_PREFIX_LENGTH = 8;
export const AI_ADMIN_WORKSPACE_PICKER_PAGE_SIZE = 100;
export const AI_ADMIN_ACTIVITY_PAGE_SIZE = 40;

export type AiAdminPolicyMode = (typeof AI_ADMIN_POLICY_MODES)[number];
