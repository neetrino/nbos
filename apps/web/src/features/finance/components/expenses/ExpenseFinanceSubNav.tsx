'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  EXPENSE_BACKLOG_LIST_PATH,
  EXPENSE_CLOSED_LIST_PATH,
  EXPENSE_LIST_PATH,
} from '@/features/finance/constants/project-expenses-drilldown';
import { cn } from '@/lib/utils';

/** Active expense cards only; plans live on `/finance/expenses/plans` (Finance top tab). */
const LINKS = [
  { href: EXPENSE_LIST_PATH, labelKey: 'nav.active' },
  { href: EXPENSE_BACKLOG_LIST_PATH, labelKey: 'nav.backlog' },
  { href: EXPENSE_CLOSED_LIST_PATH, labelKey: 'nav.closed' },
] as const;

function isBoardSection(pathname: string): boolean {
  if (!pathname.startsWith('/finance/expenses')) return false;
  if (pathname.startsWith(EXPENSE_BACKLOG_LIST_PATH)) return false;
  if (pathname.startsWith(EXPENSE_CLOSED_LIST_PATH)) return false;
  if (pathname.startsWith('/finance/expenses/plans')) return false;
  return true;
}

export function ExpenseFinanceSubNav() {
  const pathname = usePathname();
  const t = useTranslations('expenses');

  return (
    <nav className="flex flex-wrap gap-1.5" aria-label={t('nav.scopeAria')}>
      {LINKS.map((link) => {
        const active =
          link.href === EXPENSE_LIST_PATH
            ? isBoardSection(pathname)
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
            )}
          >
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
