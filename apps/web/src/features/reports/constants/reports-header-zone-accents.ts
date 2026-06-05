import type { HeaderNavAccent } from '@/components/layout/header-context/header-context-types';
import type { ReportsSectionId } from '@/lib/navigation/module-last-visit/reports-visit-config';

export const REPORTS_HEADER_ZONE_ACCENTS: Record<ReportsSectionId, HeaderNavAccent> = {
  finance: {
    activeBar: 'bg-emerald-500',
    activeShell:
      'border-emerald-200/90 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100',
    activeRowBorder: 'border-emerald-400/80',
    inactiveBar: 'bg-emerald-500/45 group-hover:bg-emerald-500/70',
    inactiveHover: 'hover:text-emerald-800/90 dark:hover:text-emerald-300/90',
  },
  growth: {
    activeBar: 'bg-sky-500',
    activeShell:
      'border-sky-200/90 bg-sky-50/95 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-100',
    activeRowBorder: 'border-sky-400/80',
    inactiveBar: 'bg-sky-500/45 group-hover:bg-sky-500/70',
    inactiveHover: 'hover:text-sky-800/90 dark:hover:text-sky-300/90',
  },
  delivery: {
    activeBar: 'bg-amber-500',
    activeShell:
      'border-amber-200/90 bg-amber-50/95 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100',
    activeRowBorder: 'border-amber-400/80',
    inactiveBar: 'bg-amber-500/45 group-hover:bg-amber-500/70',
    inactiveHover: 'hover:text-amber-900/90 dark:hover:text-amber-300/90',
  },
  center: {
    activeBar: 'bg-violet-500',
    activeShell:
      'border-violet-200/90 bg-violet-50/95 text-violet-900 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-100',
    activeRowBorder: 'border-violet-400/80',
    inactiveBar: 'bg-violet-500/45 group-hover:bg-violet-500/70',
    inactiveHover: 'hover:text-violet-800/90 dark:hover:text-violet-300/90',
  },
};
