'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Old create URL opens the new-template sheet on the list. */
export default function NewChecklistTemplateLegacyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-company/checklist-templates?create=1');
  }, [router]);

  return null;
}
