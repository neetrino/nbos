'use client';

import { ClipboardList } from 'lucide-react';
import { MyCompanyPlaceholder } from '@/features/my-company/components/MyCompanyPlaceholder';

export default function SopPage() {
  return (
    <MyCompanyPlaceholder
      title="SOP & Templates"
      description="SOP documents, process templates, process runs, review dates, and operational ownership."
      icon={ClipboardList}
    />
  );
}
