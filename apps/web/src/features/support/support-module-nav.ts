import { FolderKanban, GitPullRequest } from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';
import type { SupportTranslator } from '@/features/support/support-message-keys';

export function getSupportModuleNav(translate?: SupportTranslator): PageHeroNavLinkItem[] {
  return [
    {
      href: '/support',
      label: translate ? translate('nav.tickets') : 'Tickets',
      icon: FolderKanban,
      exactMatch: true,
    },
    {
      href: '/support/change-control',
      label: translate ? translate('nav.changeControl') : 'Change Control',
      icon: GitPullRequest,
    },
  ];
}

export const SUPPORT_MODULE_NAV: PageHeroNavLinkItem[] = getSupportModuleNav();
