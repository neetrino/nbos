'use client';

import { Target } from 'lucide-react';
import { MyCompanyPlaceholder } from '@/features/my-company/components/MyCompanyPlaceholder';

export default function KpiPage() {
  return (
    <MyCompanyPlaceholder
      title="KPI / Scorecard"
      description="Company, department, seat, and employee KPI policies with scorecard views."
      icon={Target}
    />
  );
}
