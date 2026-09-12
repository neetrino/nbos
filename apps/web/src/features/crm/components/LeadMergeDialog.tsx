'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { leadsApi, type Lead, type LeadMergeFieldChoices } from '@/lib/api/leads';
import { getApiErrorMessage } from '@/lib/api-errors';
import { LEAD_MERGE_ALLOWED_STATUS_OVERRIDES } from '@nbos/shared';
import {
  buildLeadMergeConflicts,
  defaultFieldChoices,
  filterRecentLeadMergeHits,
  getLeadMergeCandidateSubtitle,
  getLeadMergeCandidateTitle,
  getLeadMergeEntityLabel,
  isLeadMergePickBlocked,
  suggestedMergeStatus,
  type LeadMergeSearchHit,
} from './lead-merge-wizard';
import { translateLeadStageLabel } from '../i18n/crm-copy';
import { translateLeadMergeFieldLabels } from '../i18n/merge-field-labels';

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
  const t = useTranslations('crm');
  const [step, setStep] = useState<WizardStep>('search');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<LeadMergeSearchHit[]>([]);
  const [other, setOther] = useState<Lead | null>(null);
  const [currentIsSurvivor, setCurrentIsSurvivor] = useState(true);
  const [choices, setChoices] = useState<LeadMergeFieldChoices>({});
  const [status, setStatus] = useState('NEW');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();

  const survivor = currentIsSurvivor ? currentLead : other;
  const absorbed = currentIsSurvivor ? other : currentLead;
  const fieldLabels = useMemo(() => translateLeadMergeFieldLabels(t), [t]);
  const conflicts = useMemo(
    () => (survivor && absorbed ? buildLeadMergeConflicts(survivor, absorbed, fieldLabels) : []),
    [survivor, absorbed, fieldLabels],
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
        setError(t('merge.loadOtherError'));
      });
  }, [open, preselectedAbsorbedId, t]);

  useEffect(() => {
    if (!survivor || !absorbed) return;
    setStatus(suggestedMergeStatus(survivor, absorbed));
    setChoices(defaultFieldChoices(survivor, absorbed, conflicts));
  }, [survivor, absorbed, conflicts]);

  useEffect(() => {
    if (!open || step !== 'search') return;
    let cancelled = false;

    const loadHits = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextHits = debouncedQuery
          ? (
              await leadsApi.findDuplicates({
                q: debouncedQuery,
                excludeId: currentLead.id,
              })
            ).leads
          : filterRecentLeadMergeHits(
              (
                await leadsApi.getAll({
                  pageSize: 15,
                  scope: 'active',
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                })
              ).items,
              currentLead.id,
            );
        if (!cancelled) setHits(nextHits);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, t('merge.searchError')));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadHits();
    return () => {
      cancelled = true;
    };
  }, [open, step, debouncedQuery, currentLead.id, t]);

  const pickOther = async (id: string) => {
    setLoading(true);
    try {
      setOther(await leadsApi.getById(id));
      setStep('survivor');
    } catch (err) {
      setError(getApiErrorMessage(err, t('merge.openOtherError')));
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
      setError(getApiErrorMessage(err, t('merge.blockedError')));
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
            {t('merge.title')}
          </DialogTitle>
        </DialogHeader>

        {step === 'search' ? (
          <div className="space-y-3">
            <Label htmlFor="lead-merge-search">{t('merge.findOther')}</Label>
            <Input
              id="lead-merge-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('merge.searchPlaceholder')}
              autoComplete="off"
            />
            {loading ? (
              <p className="text-muted-foreground text-xs">{t('merge.searching')}</p>
            ) : null}
            <ul className="max-h-56 space-y-1 overflow-auto">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    className="hover:bg-muted w-full rounded-md px-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLeadMergePickBlocked(hit)}
                    onClick={() => void pickOther(hit.id)}
                  >
                    <span className="font-medium">{getLeadMergeCandidateTitle(hit)}</span>
                    <span className="text-muted-foreground block text-xs">
                      {getLeadMergeCandidateSubtitle(hit, t('merge.hasOpenDeal')) ||
                        t('common.entityLead')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 'survivor' && other ? (
          <div className="space-y-3 text-sm">
            <p>{t('merge.whichSurvivor')}</p>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="survivor"
                checked={currentIsSurvivor}
                onChange={() => setCurrentIsSurvivor(true)}
              />
              <span>
                {t('merge.keepAbsorb', {
                  keep: getLeadMergeEntityLabel(currentLead),
                  absorb: getLeadMergeEntityLabel(other),
                })}
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
                {t('merge.keepAbsorb', {
                  keep: getLeadMergeEntityLabel(other),
                  absorb: getLeadMergeEntityLabel(currentLead),
                })}
              </span>
            </label>
          </div>
        ) : null}

        {step === 'conflicts' && survivor && absorbed ? (
          <div className="max-h-72 space-y-3 overflow-auto text-sm">
            {conflicts.length === 0 ? (
              <p className="text-muted-foreground">{t('merge.noConflicts')}</p>
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
                      {t('merge.keepValue', {
                        name: getLeadMergeEntityLabel(survivor),
                        value: row.survivorValue,
                      })}
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
                      {t('merge.useValue', {
                        name: getLeadMergeEntityLabel(absorbed),
                        value: row.absorbedValue,
                      })}
                    </span>
                  </label>
                </fieldset>
              ))
            )}
            <div className="space-y-1">
              <Label htmlFor="lead-merge-status">{t('merge.survivorStage')}</Label>
              <select
                id="lead-merge-status"
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {LEAD_MERGE_ALLOWED_STATUS_OVERRIDES.map((key) => (
                  <option key={key} value={key}>
                    {translateLeadStageLabel(t, key)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {step === 'preview' && survivor && absorbed ? (
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            <li>
              {t('merge.previewSurvivor', {
                survivorCode: survivor.code,
                absorbedCode: absorbed.code,
              })}
            </li>
            <li>{t('merge.previewStage', { stage: translateLeadStageLabel(t, status) })}</li>
            <li>{t('merge.previewNotes')}</li>
            <li>{t('merge.previewSource')}</li>
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
              {t('merge.back')}
            </Button>
          ) : null}
          {step === 'survivor' ? (
            <Button type="button" disabled={!other} onClick={() => setStep('conflicts')}>
              {t('merge.next')}
            </Button>
          ) : null}
          {step === 'conflicts' ? (
            <Button type="button" onClick={() => setStep('preview')}>
              {t('merge.preview')}
            </Button>
          ) : null}
          {step === 'preview' ? (
            <Button type="button" disabled={loading} onClick={() => void confirm()}>
              {loading ? t('merge.merging') : t('merge.confirmMerge')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
