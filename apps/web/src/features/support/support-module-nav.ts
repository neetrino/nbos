import { FolderKanban, GitPullRequest } from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';

export const SUPPORT_MODULE_NAV: PageHeroNavLinkItem[] = [
  {
    href: '/support',
    label: 'Tickets',
    icon: FolderKanban,
    exactMatch: true,
  },
  {
    href: '/support/change-control',
    label: 'Change Control',
    icon: GitPullRequest,
  },
];
