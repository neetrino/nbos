'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { documentsApi } from '@/lib/api/documents';
import { Button } from '@/components/ui/button';

interface DocumentFavoriteButtonProps {
  documentId: string;
  isFavorite: boolean;
  onToggled?: (nowFavorite: boolean) => void;
  className?: string;
}

export function DocumentFavoriteButton({
  documentId,
  isFavorite,
  onToggled,
  className,
}: DocumentFavoriteButtonProps) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const current = optimistic ?? isFavorite;

  const handleToggle = async () => {
    if (loading) return;
    const next = !current;
    setOptimistic(next);
    setLoading(true);
    try {
      if (next) {
        await documentsApi.favoriteDocument(documentId);
      } else {
        await documentsApi.unfavoriteDocument(documentId);
      }
      onToggled?.(next);
    } catch {
      setOptimistic(current);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={current ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={current}
      disabled={loading}
      onClick={() => void handleToggle()}
      className={cn('size-8 shrink-0', className)}
    >
      <Star
        size={16}
        aria-hidden
        className={cn(
          'transition-colors',
          current ? 'fill-amber-400 stroke-amber-400' : 'stroke-muted-foreground',
        )}
      />
    </Button>
  );
}
