'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useHeaderContext } from '@/components/layout/header-context';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import {
  workSpacesDirectoryHeaderContent,
  type WorkSpaceDirectoryTab,
} from './work-spaces-directory-tab';

/** CRM-style mobile header pills for Standalone / Product on `/work-spaces`. */
export function WorkSpacesDirectoryHeaderNav({ tab }: { tab: WorkSpaceDirectoryTab }) {
  const t = useTranslations('workSpaces');
  const isMobileViewport = useIsMobileViewport();
  const content = useMemo(
    () =>
      isMobileViewport
        ? workSpacesDirectoryHeaderContent(tab, {
            standalone: t('tabStandaloneShort'),
            product: t('tabProductShort'),
            ariaLabel: t('typeAria'),
          })
        : null,
    [isMobileViewport, t, tab],
  );
  useHeaderContext(content);
  return null;
}
