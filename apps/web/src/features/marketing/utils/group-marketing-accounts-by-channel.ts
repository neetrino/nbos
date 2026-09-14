import type { MarketingAccount, MarketingCrmWhereOption } from '@/lib/api/marketing';

export interface MarketingAccountChannelGroup {
  channel: string;
  accounts: MarketingAccount[];
}

/** Prefer CRM Where order so Settings groups match the CRM pick list. */
export function resolveMarketingChannelOrder(whereRows: MarketingCrmWhereOption[]): string[] {
  return [...whereRows]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map((row) => row.channel);
}

export function groupMarketingAccountsByChannel(
  accounts: MarketingAccount[],
  channelOrder: string[],
): MarketingAccountChannelGroup[] {
  const groups = new Map<string, MarketingAccount[]>();
  for (const channel of channelOrder) {
    groups.set(channel, []);
  }
  for (const account of accounts) {
    const existing = groups.get(account.channel);
    if (existing) {
      existing.push(account);
      continue;
    }
    groups.set(account.channel, [account]);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length > 0)
    .map(([channel, list]) => ({ channel, accounts: list }));
}
