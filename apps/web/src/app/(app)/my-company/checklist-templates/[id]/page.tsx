'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Old builder URLs open the same template inside the list sheet. */
export default function ChecklistTemplateLegacyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!params.id) return;
    router.replace(`/my-company/checklist-templates?template=${params.id}`);
  }, [params.id, router]);

  return null;
}
