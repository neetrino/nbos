'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MyCompanyPlaceholder } from '@/features/my-company/components/MyCompanyPlaceholder';

export default function RolesSeatsPage() {
  const t = useTranslations('hr');
  return (
    <MyCompanyPlaceholder
      title={t('rolesSeats.title')}
      description={t('rolesSeats.description')}
      icon={ShieldCheck}
    />
  );
}
