import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { applySelectValue } from '../select-value';

export function AiAdminWorkspaceGrantControls(props: {
  workspaceId: string;
  workspaces: Array<{ id: string; name: string }>;
  grantDisabled: boolean;
  onWorkspaceId: (value: string) => void;
  onGrant: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Select
        value={props.workspaceId}
        onValueChange={(value) => applySelectValue(value, props.onWorkspaceId)}
      >
        <SelectTrigger size="sm" className="min-w-0 flex-1">
          <SelectValue placeholder="Select Work Space" />
        </SelectTrigger>
        <SelectContent>
          {props.workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              {workspace.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" size="sm" disabled={props.grantDisabled} onClick={props.onGrant}>
        Grant
      </Button>
    </div>
  );
}
