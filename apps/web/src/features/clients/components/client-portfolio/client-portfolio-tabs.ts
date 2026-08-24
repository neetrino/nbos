'use client';

import {
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Headphones,
  LayoutGrid,
  MessageCircle,
  Phone,
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
export type ClientDetailTabId = 'general' | 'calls' | ClientEmbeddedPortfolioTabId;
export type ClientSheetPanelTabId = Exclude<ClientDetailTabId, 'general'>;

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

export const CONTACT_DETAIL_CALLS_TAB: ClientDetailTabDefinition = {
  id: 'calls',
  label: 'Calls',
  icon: Phone,
};

export const DETAIL_TABS_LOADING_MASK: PortfolioAccessMask = {
  finance: true,
  subscriptions: true,
  support: true,
  communication: true,
  files: true,
  financeAmounts: true,
};

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

function withContactCallsTab(
  tabs: ReadonlyArray<ClientDetailTabDefinition>,
): ClientDetailTabDefinition[] {
  const withoutMessengerHistory = tabs.filter((tab) => tab.id !== 'communication');
  const filesIndex = withoutMessengerHistory.findIndex((tab) => tab.id === 'files');
  if (filesIndex === -1) return [...withoutMessengerHistory, CONTACT_DETAIL_CALLS_TAB];
  return [
    ...withoutMessengerHistory.slice(0, filesIndex),
    CONTACT_DETAIL_CALLS_TAB,
    ...withoutMessengerHistory.slice(filesIndex),
  ];
}

export function detailTabsForMask(
  mask: PortfolioAccessMask,
  variant: 'contact' | 'company',
): ReadonlyArray<ClientDetailTabDefinition> {
  const portfolioTabs: ClientDetailTabDefinition[] = portfolioTabsForMask(mask, false).map(
    (tab) => ({
      id: tab.id as ClientEmbeddedPortfolioTabId,
      label: tab.label,
      icon: tab.icon,
    }),
  );
  if (variant === 'contact') {
    return [CLIENT_DETAIL_GENERAL_TAB, ...withContactCallsTab(portfolioTabs)];
  }
  return [CLIENT_DETAIL_GENERAL_TAB, ...portfolioTabs];
}
