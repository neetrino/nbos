import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PartnerOrdersDrilldownBannerProps {
  onClear: () => void;
}

export function PartnerOrdersDrilldownBanner({ onClear }: PartnerOrdersDrilldownBannerProps) {
  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground max-w-prose">
        Showing orders linked to this partner (server filter).
      </p>
      <Button variant="outline" size="sm" type="button" onClick={onClear}>
        <X size={14} className="mr-1" />
        Clear partner filter
      </Button>
    </div>
  );
}
