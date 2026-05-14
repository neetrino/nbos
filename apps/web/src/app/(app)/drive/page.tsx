'use client';

import { Suspense } from 'react';
import { DriveWorkspace } from '@/features/drive/DriveWorkspace';

export default function DrivePage() {
  return (
    <Suspense fallback={null}>
      <DriveWorkspace />
    </Suspense>
  );
}
