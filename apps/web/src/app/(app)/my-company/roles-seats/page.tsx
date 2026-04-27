'use client';

import { ShieldCheck } from 'lucide-react';
import { MyCompanyPlaceholder } from '@/features/my-company/components/MyCompanyPlaceholder';

export default function RolesSeatsPage() {
  return (
    <MyCompanyPlaceholder
      title="Roles & Seats"
      description="Business seats, accountabilities, vacancies, assignments, and default permission role mapping."
      icon={ShieldCheck}
    />
  );
}
