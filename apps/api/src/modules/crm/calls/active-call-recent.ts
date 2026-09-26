import {
  conversationAnchor,
  conversationDurationSec,
  conversationPhase,
  groupCallConversations,
  normalizeCallLid,
} from './call-conversation';
import { mapCallDirection } from './call-response.map';
import type { ActiveCallScreenSnapshot } from './active-call-screen.map';

export type RecentConnection = {
  id: string;
  lid: string | null;
  calldirect: string | null;
  state: string | null;
  createdAt: Date;
  billsec: string | null;
};

type RecentCard = ActiveCallScreenSnapshot['recentCalls'][number];

export function pickRecentConversationGroups<T extends RecentConnection>(
  rows: readonly T[],
  limit: number,
): T[][] {
  return groupCallConversations(rows).slice(0, limit);
}

export function lidsOfGroups(groups: ReadonlyArray<readonly RecentConnection[]>): string[] {
  const lids = new Set<string>();
  for (const group of groups) {
    for (const row of group) {
      const lid = normalizeCallLid(row.lid);
      if (lid) lids.add(lid);
    }
  }
  return [...lids];
}

/** One card per picked conversation. Full LID legs correct the earliest visible id. */
export function buildRecentConversationCards(
  picked: ReadonlyArray<readonly RecentConnection[]>,
  lidLegs: readonly RecentConnection[],
): RecentCard[] {
  const byLid = indexByLid(lidLegs);
  const cards = picked.flatMap((group) => {
    const card = toRecentCard(membersForGroup(group, byLid));
    return card ? [card] : [];
  });
  return cards.sort(compareRecentDesc);
}

function membersForGroup(
  group: readonly RecentConnection[],
  byLid: ReadonlyMap<string, RecentConnection[]>,
): readonly RecentConnection[] {
  const lid = normalizeCallLid(group[0]?.lid);
  if (!lid) return group;
  return byLid.get(lid) ?? group;
}

function toRecentCard(members: readonly RecentConnection[]): RecentCard | null {
  const anchor = conversationAnchor(members);
  if (!anchor) return null;
  return {
    id: anchor.id,
    direction: mapCallDirection(anchor.calldirect ?? firstDirection(members)),
    phase: conversationPhase(members),
    createdAt: anchor.createdAt,
    durationSec: conversationDurationSec(members),
  };
}

function firstDirection(members: readonly RecentConnection[]): string | null {
  return members.find((member) => member.calldirect)?.calldirect ?? null;
}

function indexByLid(legs: readonly RecentConnection[]): Map<string, RecentConnection[]> {
  const byLid = new Map<string, RecentConnection[]>();
  for (const leg of legs) {
    const lid = normalizeCallLid(leg.lid);
    if (!lid) continue;
    const bucket = byLid.get(lid);
    if (bucket) bucket.push(leg);
    else byLid.set(lid, [leg]);
  }
  return byLid;
}

function compareRecentDesc(left: RecentCard, right: RecentCard): number {
  const delta = right.createdAt.getTime() - left.createdAt.getTime();
  if (delta !== 0) return delta;
  return right.id.localeCompare(left.id);
}
