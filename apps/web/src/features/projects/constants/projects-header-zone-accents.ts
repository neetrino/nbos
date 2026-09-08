import type { HeaderNavAccent } from '@/components/layout/header-context/header-context-types';
import type { ProjectHubSectionId } from '@/lib/navigation/module-last-visit/project-hub-module-last-visit';

export const PROJECT_HUB_HEADER_ZONE_ACCENTS: Record<ProjectHubSectionId, HeaderNavAccent> = {
  projects: {
    activeBar: 'bg-violet-500',
    activeShell:
      'border-violet-200/90 bg-violet-50/95 text-violet-900 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-100',
    activeRowBorder: 'border-violet-400/80',
    inactiveBar: 'bg-violet-500/45 group-hover:bg-violet-500/70',
    inactiveHover: 'hover:text-violet-800/90 dark:hover:text-violet-300/90',
  },
  products: {
    activeBar: 'bg-sky-500',
    activeShell:
      'border-sky-200/90 bg-sky-50/95 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-100',
    activeRowBorder: 'border-sky-400/80',
    inactiveBar: 'bg-sky-500/45 group-hover:bg-sky-500/70',
    inactiveHover: 'hover:text-sky-800/90 dark:hover:text-sky-300/90',
  },
};
