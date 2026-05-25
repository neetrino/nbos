'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoadingState } from '@/components/shared';
import { PARTNER_OPEN_QUERY } from '@/features/partners/constants/partner-open-query';

export default function PartnerLegacyRoutePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!id) {
      router.replace('/partners');
      return;
    }
    router.replace(`/partners?${PARTNER_OPEN_QUERY}=${encodeURIComponent(id)}`);
  }, [id, router]);

  return (
    <div className="flex h-full flex-col gap-5">
      <LoadingState count={3} />
    </div>
  );
}
