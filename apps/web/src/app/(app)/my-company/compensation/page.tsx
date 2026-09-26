'use client';

import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { SalaryDirectoryPage } from '@/features/my-company/compensation/salary-directory-page';

export default function CompensationPage() {
  return (
    <Suspense fallback={<LoadingState variant="cards" count={6} />}>
      <SalaryDirectoryPage />
    </Suspense>
  );
}
