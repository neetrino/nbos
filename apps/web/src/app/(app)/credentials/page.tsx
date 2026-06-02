'use client';

import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { CredentialsVaultPage } from '@/features/credentials/components/credentials-vault-page';

export default function CredentialsPage() {
  return (
    <Suspense fallback={<LoadingState variant="list" count={4} />}>
      <CredentialsVaultPage />
    </Suspense>
  );
}
