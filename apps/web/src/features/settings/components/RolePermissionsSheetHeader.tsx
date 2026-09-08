'use client';

import { Save, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function RolePermissionsSheetHeader(props: {
  roleName: string;
  isSystem: boolean;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
}) {
  return (
    <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-5 py-3">
      <div className="min-w-0">
        <h2 className="text-foreground flex items-center gap-2 text-base font-semibold">
          <Shield size={16} aria-hidden />
          Permissions — {props.roleName}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Change VIEW / EDIT / ADD / DELETE, then Save.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {props.isSystem ? <Badge variant="secondary">System</Badge> : null}
        <Button size="sm" onClick={props.onSave} disabled={props.saving || !props.canSave}>
          <Save size={16} aria-hidden />
          {props.saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
