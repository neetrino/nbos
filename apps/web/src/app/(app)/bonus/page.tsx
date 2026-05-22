import { redirect } from 'next/navigation';
import { FINANCE_BONUS_BOARD_PATH } from '@/features/finance/constants/bonus-board-url';

function legacyBonusRedirectTarget(query: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      q.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        q.append(key, item);
      }
    }
  }
  const suffix = q.toString();
  return suffix ? `${FINANCE_BONUS_BOARD_PATH}?${suffix}` : FINANCE_BONUS_BOARD_PATH;
}

/** Legacy `/bonus` → canonical `/finance/bonuses` (query preserved). */
export default async function BonusLegacyRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  redirect(legacyBonusRedirectTarget(query));
}
