'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/finance/expenses', label: 'Board' },
  { href: '/finance/expenses/backlog', label: 'Backlog' },
  { href: '/finance/expenses/plans', label: 'Plans' },
] as const;

function isBoardSection(pathname: string): boolean {
  if (!pathname.startsWith('/finance/expenses')) return false;
  if (pathname.startsWith('/finance/expenses/backlog')) return false;
  if (pathname.startsWith('/finance/expenses/plans')) return false;
  return true;
}

export function ExpenseFinanceSubNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-4 flex flex-wrap gap-2" aria-label="Expense views">
      {LINKS.map((link) => {
        const active =
          link.href === '/finance/expenses'
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
