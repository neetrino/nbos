'use client';

import { useEffect, useMemo, useState } from 'react';
import { GitMerge } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  leadsApi,
  type Lead,
  type LeadDuplicateCandidate,
  type LeadMergeFieldChoices,
} from '@/lib/api/leads';
import { getApiErrorMessage } from '@/lib/api-errors';
import { LEAD_MERGE_ALLOWED_STATUS_OVERRIDES } from '@nbos/shared';
import { getLeadStage } from '../constants/leadPipeline';
import {
  buildLeadMergeConflicts,
  defaultFieldChoices,
  mergePreviewLines,
  suggestedMergeStatus,
} from './lead-merge-wizard';

type WizardStep = 'search' | 'survivor' | 'conflicts' | 'preview';

interface LeadMergeDialogProps {
  open: boolean;
  currentLead: Lead;
  preselectedAbsorbedId?: string | null;
  onOpenChange: (open: boolean) => void;
  onMerged: (survivor: Lead) => void;
}

export function LeadMergeDialog({
  open,
  currentLead,
  preselectedAbsorbedId,
  onOpenChange,
  onMerged,
}: LeadMergeDialogProps) {
  const [step, setStep] = useState<WizardStep>('search');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<LeadDuplicateCandidate[]>([]);
  const [other, setOther] = useState<Lead | null>(null);
  const [currentIsSurvivor, setCurrentIsSurvivor] = useState(true);
  const [choices, setChoices] = useState<LeadMergeFieldChoices>({});
  const [status, setStatus] = useState('NEW');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const survivor = currentIsSurvivor ? currentLead : other;
  const absorbed = currentIsSurvivor ? other : currentLead;
  const conflicts = useMemo(
    () => (survivor && absorbed ? buildLeadMergeConflicts(survivor, absorbed) : []),
    [survivor, absorbed],
  );

  useEffect(() => {
    if (!open) return;
    setStep(preselectedAbsorbedId ? 'survivor' : 'search');
    setQuery('');
    setHits([]);
    setOther(null);
    setCurrentIsSurvivor(true);
    setChoices({});
    setError(null);
    if (!preselectedAbsorbedId) return;
    void leadsApi
      .getById(preselectedAbsorbedId)
      .then(setOther)
      .catch(() => {
        setError('Could not load the other Lead.');
      });
  }, [open, preselectedAbsorbedId]);

  useEffect(() => {
    if (!survivor || !absorbed) return;
    setStatus(suggestedMergeStatus(survivor, absorbed));
    setChoices(defaultFieldChoices(survivor, absorbed, conflicts));
  }, [survivor, absorbed, conflicts]);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const result = await leadsApi.findDuplicates({ q, excludeId: currentLead.id });
      setHits(result.leads);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not search Leads.'));
    } finally {
      setLoading(false);
    }
  };

  const pickOther = async (id: string) => {
    setLoading(true);
    try {
      setOther(await leadsApi.getById(id));
      setStep('survivor');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not open that Lead.'));
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!survivor || !absorbed) return;
    setLoading(true);
    setError(null);
    try {
      const merged = await leadsApi.merge(survivor.id, {
        absorbedId: absorbed.id,
        fieldChoices: choices,
        status,
      });
      onMerged(merged);
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Merge was blocked.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge size={16} aria-hidden />
            Merge Leads
          </DialogTitle>
        </DialogHeader>

        {step === 'search' ? (
          <div className="space-y-3">
            <Label htmlFor="lead-merge-search">Find the other Lead</Label>
            <div className="flex gap-2">
              <Input
                id="lead-merge-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Code, name, phone, email…"
              />
              <Button type="button" onClick={() => void search()} disabled={loading}>
                Search
              </Button>
            </div>
            <ul className="max-h-56 space-y-1 overflow-auto">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    className="hover:bg-muted w-full rounded-md px-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={hit.hasOpenDeal}
                    onClick={() => void pickOther(hit.id)}
                  >
                    <span className="font-medium">{hit.code}</span>
                    {hit.name ? ` · ${hit.name}` : ''}
                    <span className="text-muted-foreground block text-xs">
                      {hit.contactName}
                      {hit.hasOpenDeal ? ' · has Deal (cannot merge)' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 'survivor' && other ? (
          <div className="space-y-3 text-sm">
            <p>Which card should remain on the board?</p>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="survivor"
                checked={currentIsSurvivor}
                onChange={() => setCurrentIsSurvivor(true)}
              />
              <span>
                Keep {currentLead.code} — absorb {other.code}
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="survivor"
                checked={!currentIsSurvivor}
                onChange={() => setCurrentIsSurvivor(false)}
              />
              <span>
                Keep {other.code} — absorb {currentLead.code}
              </span>
            </label>
          </div>
        ) : null}

        {step === 'conflicts' && survivor && absorbed ? (
          <div className="max-h-72 space-y-3 overflow-auto text-sm">
            {conflicts.length === 0 ? (
              <p className="text-muted-foreground">
                No conflicting fields. Empty values will fill from the other card.
              </p>
            ) : (
              conflicts.map((row) => (
                <fieldset key={row.key} className="space-y-1">
                  <legend className="font-medium">{row.label}</legend>
                  <label className="flex gap-2">
                    <input
                      type="radio"
                      name={row.key}
                      checked={(choices[row.key] ?? 'survivor') === 'survivor'}
                      onChange={() => setChoices((prev) => ({ ...prev, [row.key]: 'survivor' }))}
                    />
                    <span>
                      Keep {survivor.code}: {row.survivorValue}
                    </span>
                  </label>
                  <label className="flex gap-2">
                    <input
                      type="radio"
                      name={row.key}
                      checked={choices[row.key] === 'absorbed'}
                      onChange={() => setChoices((prev) => ({ ...prev, [row.key]: 'absorbed' }))}
                    />
                    <span>
                      Use {absorbed.code}: {row.absorbedValue}
                    </span>
                  </label>
                </fieldset>
              ))
            )}
            <div className="space-y-1">
              <Label htmlFor="lead-merge-status">Survivor stage</Label>
              <select
                id="lead-merge-status"
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {LEAD_MERGE_ALLOWED_STATUS_OVERRIDES.map((key) => (
                  <option key={key} value={key}>
                    {getLeadStage(key)?.label ?? key}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {step === 'preview' && survivor && absorbed ? (
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            {mergePreviewLines(survivor, absorbed, status).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <DialogFooter>
          {step !== 'search' ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setStep(
                  step === 'preview' ? 'conflicts' : step === 'conflicts' ? 'survivor' : 'search',
                )
              }
            >
              Back
            </Button>
          ) : null}
          {step === 'survivor' ? (
            <Button type="button" disabled={!other} onClick={() => setStep('conflicts')}>
              Next
            </Button>
          ) : null}
          {step === 'conflicts' ? (
            <Button type="button" onClick={() => setStep('preview')}>
              Preview
            </Button>
          ) : null}
          {step === 'preview' ? (
            <Button type="button" disabled={loading} onClick={() => void confirm()}>
              {loading ? 'Merging…' : 'Confirm merge'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
