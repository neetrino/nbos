'use client';

import { BadgeDollarSign } from 'lucide-react';
import { MyCompanyPlaceholder } from '@/features/my-company/components/MyCompanyPlaceholder';

export default function CompensationPage() {
  return (
    <MyCompanyPlaceholder
      title="Compensation"
      description="Versioned compensation profiles, bonus policies, KPI policy links, overrides, and audit."
      icon={BadgeDollarSign}
    />
  );
}
