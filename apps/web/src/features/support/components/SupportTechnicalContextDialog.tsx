'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TechnicalProductProfileResponse } from '@/lib/api/technical';
import type { SupportTicket } from '@/lib/api/support';

export interface SupportTechnicalContextDialogProps {
  ticket: SupportTicket | null;
  profile: TechnicalProductProfileResponse | null;
  profileLoading: boolean;
  assetId: string;
  environmentId: string;
  onAssetIdChange: (value: string) => void;
  onEnvironmentIdChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

export function SupportTechnicalContextDialog({
  ticket,
  profile,
  profileLoading,
  assetId,
  environmentId,
  onAssetIdChange,
  onEnvironmentIdChange,
  onClose,
  onSave,
  saving,
}: SupportTechnicalContextDialogProps) {
  return (
    <Dialog
      open={Boolean(ticket)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Technical context</DialogTitle>
          <DialogDescription>
            Link this incident to a Technical Asset and/or Environment registered for the same
            product (Projects → Product → Technical).
          </DialogDescription>
        </DialogHeader>
        {!ticket?.productId ? (
          <p className="text-muted-foreground text-sm">
            This ticket has no product context. Set a product on the ticket before linking assets or
            environments.
          </p>
        ) : profileLoading ? (
          <p className="text-muted-foreground text-sm">Loading technical profile…</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="support-tech-asset">Asset</Label>
              <select
                id="support-tech-asset"
                className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                value={assetId}
                onChange={(event) => onAssetIdChange(event.target.value)}
              >
                <option value="">None</option>
                {profile?.assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.type} — {asset.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="support-tech-env">Environment</Label>
              <select
                id="support-tech-env"
                className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
                value={environmentId}
                onChange={(event) => onEnvironmentIdChange(event.target.value)}
              >
                <option value="">None</option>
                {profile?.environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.kind} — {env.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!ticket?.productId || saving || profileLoading}
            onClick={() => void onSave()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
