'use client';

import type { ReactNode } from 'react';
import { ProjectsHubVisitLayout } from '@/features/projects/components/ProjectsHubVisitLayout';

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ProjectsHubVisitLayout />
      {children}
    </>
  );
}
