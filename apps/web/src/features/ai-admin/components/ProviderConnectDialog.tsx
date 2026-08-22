'use client';

import { useRef, useState } from 'react';
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
import { aiAdminApi, type AiProviderConnectionView } from '@/lib/api/ai-admin';
import {
  applyDraftValidationSuccess,
  canSaveValidatedDraft,
  type ProviderDraftSnapshot,
} from '../provider-draft-gate';
import {
  canDismissProviderDialog,
  isActiveRequestGeneration,
  shouldApplyProviderSaveSuccess,
  startRequestGeneration,
} from '../provider-request-generation';
import { draftValidateRequest } from '../select-provider';

export function ProviderConnectDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  mode?: 'create' | 'rotate';
  connectionId?: string;
  connectionProvider?: AiProviderConnectionView['provider'];
  connectionBaseUrl?: string | null;
}) {
  const rotate = props.mode === 'rotate';
  const [provider, setProvider] = useState<'OPENAI' | 'ANTHROPIC'>('OPENAI');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [validatedFingerprint, setValidatedFingerprint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const generationRef = useRef(0);
  const draftRef = useRef<ProviderDraftSnapshot>({ provider: 'OPENAI', apiKey: '', baseUrl: null });

  const currentDraft = (): ProviderDraftSnapshot =>
    draftValidateRequest({
      mode: rotate ? 'rotate' : 'create',
      selected: provider,
      apiKey,
      connectionProvider: props.connectionProvider,
      connectionBaseUrl: props.connectionBaseUrl,
    });
  draftRef.current = currentDraft();

  const reset = () => {
    generationRef.current = startRequestGeneration(generationRef.current);
    setProvider('OPENAI');
    setName('');
    setApiKey('');
    setValidatedFingerprint(null);
    setBusy(false);
  };

  const close = (open: boolean) => {
    if (!open && !canDismissProviderDialog(busy)) return;
    if (!open) reset();
    props.onOpenChange(open);
  };

  const validate = async () => {
    const generation = startRequestGeneration(generationRef.current);
    generationRef.current = generation;
    const requested = currentDraft();
    setBusy(true);
    try {
      const result =
        rotate && props.connectionId
          ? await aiAdminApi.validateReplacementProvider(props.connectionId, requested.apiKey)
          : await aiAdminApi.validateDraftProvider({
              provider: requested.provider,
              apiKey: requested.apiKey,
              baseUrl: requested.baseUrl ?? undefined,
            });
      if (!isActiveRequestGeneration(generation, generationRef.current)) return;
      const nextFingerprint = applyDraftValidationSuccess({
        requested,
        current: draftRef.current,
        ok: result.ok,
      });
      setValidatedFingerprint(nextFingerprint);
      if (!result.ok || nextFingerprint === null) {
        toast.error(
          nextFingerprint === null && result.ok
            ? 'Key changed after validate. Validate the current key before saving.'
            : (result.errorCode ?? 'Validation failed. The key was not stored.'),
        );
        return;
      }
      toast.success('Key validated. You can save it now.');
    } catch {
      if (!isActiveRequestGeneration(generation, generationRef.current)) return;
      setValidatedFingerprint(null);
      toast.error('Validation failed. The key was not stored.');
    } finally {
      if (isActiveRequestGeneration(generation, generationRef.current)) setBusy(false);
    }
  };

  const submit = async () => {
    if (!canSaveValidatedDraft({ validatedFingerprint, current: currentDraft() })) return;
    const generation = startRequestGeneration(generationRef.current);
    generationRef.current = generation;
    setBusy(true);
    try {
      if (rotate && props.connectionId) {
        await aiAdminApi.rotateProviderKey(props.connectionId, apiKey);
      } else {
        await aiAdminApi.createProvider({ provider, name: name.trim(), apiKey });
      }
      if (!shouldApplyProviderSaveSuccess(generation, generationRef.current)) return;
      reset();
      props.onCreated();
      props.onOpenChange(false);
      toast.success(
        rotate
          ? 'Provider key replaced. Prefix only is stored.'
          : 'Provider connected. Key is not shown again.',
      );
    } catch {
      if (!isActiveRequestGeneration(generation, generationRef.current)) return;
      toast.error('Provider save failed.');
    } finally {
      if (isActiveRequestGeneration(generation, generationRef.current)) setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rotate ? 'Replace provider key' : 'Connect internal provider'}</DialogTitle>
          <DialogDescription>
            Validate the key first. Nothing is stored until you save after a successful validate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {rotate ? (
            <p className="text-muted-foreground text-xs">
              Replacing the key for the {props.connectionProvider ?? 'stored'} connection
              {props.connectionBaseUrl ? ` at ${props.connectionBaseUrl}` : ''}. The provider type
              cannot change.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Select
                  value={provider}
                  disabled={busy}
                  onValueChange={(value) => {
                    if (value === 'OPENAI' || value === 'ANTHROPIC') {
                      setProvider(value);
                      setValidatedFingerprint(null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPENAI">OpenAI</SelectItem>
                    <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="provider-name">Connection name</Label>
                <Input
                  id="provider-name"
                  value={name}
                  disabled={busy}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="provider-key">API key</Label>
            <Input
              id="provider-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              disabled={busy}
              onChange={(event) => {
                setApiKey(event.target.value);
                setValidatedFingerprint(null);
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!apiKey.trim() || busy}
            onClick={() => void validate()}
          >
            Validate
          </Button>
          <Button
            type="button"
            disabled={
              !canSaveValidatedDraft({ validatedFingerprint, current: currentDraft() }) ||
              !apiKey.trim() ||
              (!rotate && !name.trim()) ||
              busy
            }
            onClick={() => void submit()}
          >
            {rotate ? 'Replace key' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
