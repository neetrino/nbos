import { redirect } from 'next/navigation';

/** Bonus pools merged into Unit Economics — legacy URL kept for bookmarks. */
export default function BonusPoolsPage() {
  redirect('/finance/unit-economics');
}
