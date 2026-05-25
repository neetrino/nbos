'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-errors';
import { bonusesApi } from '@/lib/api/bonus';

export function BonusPoolAutoReleaseButton({
  poolKey,
  disabled,
  onComplete,
}: {
  poolKey: string;
  disabled?: boolean;
  onComplete: () => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const result = await bonusesApi.triggerProductPoolAutoRelease(poolKey);
      if (result.releasesCreated) {
        setMessage(`Created AUTO releases across ${result.ordersProcessed} order(s). Refreshing…`);
        await onComplete();
      } else {
        setMessage(
          'No new AUTO releases — product may not be DONE, funding exhausted, or delivery bonuses already released.',
        );
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Auto release failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || submitting}
        onClick={() => void handleClick()}
      >
        {submitting ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
        Run delivery AUTO release
      </Button>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      {message ? <p className="text-muted-foreground text-xs">{message}</p> : null}
    </div>
  );
}
