'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingState } from '@/components/shared';

function LegacyTeamRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(query ? `/my-company/team?${query}` : '/my-company/team');
  }, [router, searchParams]);

  return <LoadingState />;
}

export default function LegacyTeamRedirectPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LegacyTeamRedirectContent />
    </Suspense>
  );
}
