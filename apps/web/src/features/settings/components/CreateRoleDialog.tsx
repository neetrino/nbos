'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateRoleDialog(props: {
  open: boolean;
  name: string;
  slug: string;
  level: number;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (name: string) => void;
  onSlugChange: (slug: string) => void;
  onLevelChange: (level: number) => void;
  onCreate: () => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="create-name">Name</Label>
            <Input
              id="create-name"
              value={props.name}
              onChange={(event) => props.onNameChange(event.target.value)}
              placeholder="e.g. Custom Manager"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-slug">Slug</Label>
            <Input
              id="create-slug"
              value={props.slug}
              onChange={(event) => props.onSlugChange(event.target.value)}
              placeholder="e.g. custom-manager"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-level">Level</Label>
            <Input
              id="create-level"
              type="number"
              value={props.level}
              onChange={(event) => props.onLevelChange(parseInt(event.target.value, 10) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={props.onCreate} disabled={props.saving}>
            {props.saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
