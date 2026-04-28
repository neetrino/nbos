import { permanentRedirect } from 'next/navigation';

/**
 * Legacy path: canonical expenses UI lives under Finance (`/finance/expenses`).
 * Avoids maintaining a duplicate screen with mock financial figures.
 */
export default function LegacyExpensesRedirectPage() {
  permanentRedirect('/finance/expenses');
}
