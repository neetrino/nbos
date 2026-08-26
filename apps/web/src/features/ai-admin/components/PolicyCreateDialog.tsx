'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { aiAdminApi, type AiModelView } from '@/lib/api/ai-admin';
import { AI_ADMIN_POLICY_MODES, type AiAdminPolicyMode } from '../constants';
import { applySelectValue } from '../select-value';
import { ModelSelect } from './PolicyModelSelect';

export function PolicyCreateDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligible: AiModelView[];
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<AiAdminPolicyMode>('FIXED');
  const [primaryId, setPrimaryId] = useState('');
  const [fallbackId, setFallbackId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setMode('FIXED');
    setPrimaryId('');
    setFallbackId('');
  };

  const submit = async () => {
    const candidates =
      mode === 'FIXED'
        ? [{ modelId: primaryId, role: 'PRIMARY' as const, priority: 0 }]
        : [
            { modelId: primaryId, role: 'PRIMARY' as const, priority: 0 },
            { modelId: fallbackId, role: 'FALLBACK' as const, priority: 10 },
          ];
    setSubmitting(true);
    try {
      await aiAdminApi.createPolicy({ name: name.trim(), mode, candidates });
      reset();
      props.onCreated();
      props.onOpenChange(false);
    } catch {
      toast.error('Policy create failed. Use only ACTIVE models.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) reset();
        props.onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create policy</DialogTitle>
          <DialogDescription>
            FIXED uses one model. PRIMARY_FALLBACK tries a fallback when the primary is unavailable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="policy-name">Name</Label>
              <Input
                id="policy-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Select
                value={mode}
                onValueChange={(value) =>
                  applySelectValue(value, (next) => setMode(next as AiAdminPolicyMode))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_ADMIN_POLICY_MODES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ModelSelect
              label="Primary model"
              value={primaryId}
              onChange={setPrimaryId}
              models={props.eligible}
            />
            {mode === 'PRIMARY_FALLBACK' ? (
              <ModelSelect
                label="Fallback model"
                value={fallbackId}
                onChange={setFallbackId}
                models={props.eligible}
              />
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              !name.trim() || !primaryId || (mode === 'PRIMARY_FALLBACK' && !fallbackId) || submitting
            }
            onClick={() => void submit()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
