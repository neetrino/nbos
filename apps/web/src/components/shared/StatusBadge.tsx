'use client';

import { cn } from '@/lib/utils';

type StatusVariant =
  | 'default'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'emerald'
  | 'amber'
  | 'orange'
  | 'red'
  | 'cyan'
  | 'pink'
  | 'teal'
  | 'green'
  | 'gray'
  | 'violet'
  | 'fuchsia';

const VARIANT_STYLES: Record<StatusVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
};

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  dot?: boolean;
  dotColor?: string;
  className?: string;
}

export function StatusBadge({
  label,
  variant = 'default',
  dot,
  dotColor,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor ?? 'bg-current')} />}
      {label}
    </span>
  );
}

export { type StatusVariant };
