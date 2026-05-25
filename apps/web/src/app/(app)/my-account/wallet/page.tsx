import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { EmployeeWalletPage } from '@/features/account/components/EmployeeWalletPage';

export default function MyAccountWalletPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EmployeeWalletPage />
    </Suspense>
  );
}
