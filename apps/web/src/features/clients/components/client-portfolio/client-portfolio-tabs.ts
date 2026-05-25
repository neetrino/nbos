'use client';

import {
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Headphones,
  LayoutGrid,
  MessageCircle,
  Receipt,
  Repeat,
  type LucideIcon,
} from 'lucide-react';
import type { PortfolioAccessMask } from '@/lib/api/client-portfolio';

export type ClientPortfolioTabId =
  | 'overview'
  | 'projects'
  | 'finance'
  | 'subscriptions'
  | 'support'
  | 'communication'
  | 'files';

export type ClientEmbeddedPortfolioTabId = Exclude<ClientPortfolioTabId, 'overview'>;
export type ClientDetailTabId = 'general' | ClientEmbeddedPortfolioTabId;

export interface ClientPortfolioTabDefinition {
  id: ClientPortfolioTabId;
  label: string;
  icon: LucideIcon;
}

export interface ClientDetailTabDefinition {
  id: ClientDetailTabId;
  label: string;
  icon: LucideIcon;
}

export const CLIENT_PORTFOLIO_TABS: ReadonlyArray<ClientPortfolioTabDefinition> = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'finance', label: 'Finance', icon: Receipt },
  { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'communication', label: 'Communication', icon: MessageCircle },
  { id: 'files', label: 'Files', icon: FileText },
];

export const CLIENT_DETAIL_GENERAL_TAB: ClientDetailTabDefinition = {
  id: 'general',
  label: 'General',
  icon: BriefcaseBusiness,
};

export const CLIENT_DETAIL_PORTFOLIO_TABS: ReadonlyArray<ClientDetailTabDefinition> =
  CLIENT_PORTFOLIO_TABS.filter(
    (tab): tab is ClientPortfolioTabDefinition & { id: ClientEmbeddedPortfolioTabId } =>
      tab.id !== 'overview',
  );

export function portfolioTabsForMask(
  mask: PortfolioAccessMask,
  includeOverview: boolean,
): ReadonlyArray<ClientPortfolioTabDefinition> {
  return CLIENT_PORTFOLIO_TABS.filter((tab) => {
    if (tab.id === 'overview') return includeOverview;
    if (tab.id === 'projects') return true;
    if (tab.id === 'finance') return mask.finance;
    if (tab.id === 'subscriptions') return mask.subscriptions;
    if (tab.id === 'support') return mask.support;
    if (tab.id === 'communication') return mask.communication;
    if (tab.id === 'files') return mask.files;
    return true;
  });
}

export function detailTabsForMask(
  mask: PortfolioAccessMask,
): ReadonlyArray<ClientDetailTabDefinition> {
  return [
    CLIENT_DETAIL_GENERAL_TAB,
    ...portfolioTabsForMask(mask, false).map((tab) => ({
      id: tab.id as ClientEmbeddedPortfolioTabId,
      label: tab.label,
      icon: tab.icon,
    })),
  ];
}
