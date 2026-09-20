'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function NormsLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {t('refresh')}
      </Button>
    </div>
  );
}
