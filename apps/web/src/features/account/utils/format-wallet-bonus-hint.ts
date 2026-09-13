import type {
  WalletBonusExplanation,
  WalletBonusHintKey,
} from '@/features/finance/utils/wallet-bonus-entry-explanation';

export function formatWalletBonusHint(
  explanation: WalletBonusExplanation | null,
  t: (key: WalletBonusHintKey, values?: { amount?: string; month?: string }) => string,
): string | null {
  if (!explanation) return null;
  if (explanation.source === 'raw') return explanation.text;
  return t(explanation.key, explanation.values);
}
