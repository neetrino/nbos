'use client';

import type { ReactNode } from 'react';
import { ModuleHeroSlotProvider } from '@/components/shared/page-hero';
import { ProjectsHubHeaderContextLayout } from '@/features/projects/components/ProjectsHubHeaderContextLayout';

export default function ProjectsDirectoryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ProjectsHubHeaderContextLayout />
      <ModuleHeroSlotProvider
        linkToHeaderTab
        title="Project Hub"
        className="flex h-full min-h-0 flex-col gap-5"
      >
        {children}
      </ModuleHeroSlotProvider>
    </>
  );
}
