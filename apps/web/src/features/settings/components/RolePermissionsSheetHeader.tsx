'use client';

import { Save, Search, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RolePermissionsSheetHeader(props: {
  roleName: string;
  isSystem: boolean;
  saving: boolean;
  canSave: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="border-border flex shrink-0 items-center gap-3 border-b px-5 py-3">
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
          <Shield size={15} aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-foreground text-sm font-semibold">Permissions</h2>
          <p className="text-muted-foreground truncate text-xs">{props.roleName}</p>
        </div>
        {props.isSystem ? <Badge variant="secondary">System</Badge> : null}
      </div>
      <div className="relative min-w-0 flex-1">
        <Search
          size={15}
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={props.query}
          placeholder="Search modules"
          className="h-9 pl-9"
          onChange={(event) => props.onQueryChange(event.target.value)}
        />
      </div>
      <Button size="sm" onClick={props.onSave} disabled={props.saving || !props.canSave}>
        <Save size={16} aria-hidden />
        {props.saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
