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
import {
  contactsApi,
  type Contact,
  type ContactMergeCandidate,
  type ContactMergeFieldChoices,
} from '@/lib/api/clients';
import { getApiErrorMessage } from '@/lib/api-errors';
import { buildContactMergeConflicts, defaultContactFieldChoices } from './contact-merge-wizard';
import { ContactMergeWizardBody, type ContactMergeWizardStep } from './contact-merge-wizard-steps';

interface ContactMergeDialogProps {
  open: boolean;
  currentContact: Contact;
  onOpenChange: (open: boolean) => void;
  onMerged: (survivor: Contact) => void;
}

export function ContactMergeDialog({
  open,
  currentContact,
  onOpenChange,
  onMerged,
}: ContactMergeDialogProps) {
  const [step, setStep] = useState<ContactMergeWizardStep>('search');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ContactMergeCandidate[]>([]);
  const [other, setOther] = useState<Contact | null>(null);
  const [currentIsSurvivor, setCurrentIsSurvivor] = useState(true);
  const [choices, setChoices] = useState<ContactMergeFieldChoices>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const survivor = currentIsSurvivor ? currentContact : other;
  const absorbed = currentIsSurvivor ? other : currentContact;
  const conflicts = useMemo(
    () => (survivor && absorbed ? buildContactMergeConflicts(survivor, absorbed) : []),
    [survivor, absorbed],
  );

  useEffect(() => {
    if (!open) return;
    setStep('search');
    setQuery('');
    setHits([]);
    setOther(null);
    setCurrentIsSurvivor(true);
    setChoices({});
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!survivor || !absorbed) return;
    setChoices(defaultContactFieldChoices(conflicts));
  }, [survivor, absorbed, conflicts]);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      setHits(await contactsApi.findMergeCandidates({ q, excludeId: currentContact.id }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not search Contacts.'));
    } finally {
      setLoading(false);
    }
  };

  const pickOther = async (id: string) => {
    setLoading(true);
    try {
      setOther(await contactsApi.getById(id));
      setStep('survivor');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not open that Contact.'));
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!survivor || !absorbed) return;
    setLoading(true);
    setError(null);
    try {
      onMerged(
        await contactsApi.merge(survivor.id, { absorbedId: absorbed.id, fieldChoices: choices }),
      );
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
            Merge Contacts
          </DialogTitle>
        </DialogHeader>
        <ContactMergeWizardBody
          step={step}
          query={query}
          hits={hits}
          other={other}
          currentContact={currentContact}
          currentIsSurvivor={currentIsSurvivor}
          survivor={survivor}
          absorbed={absorbed}
          conflicts={conflicts}
          choices={choices}
          loading={loading}
          onQueryChange={setQuery}
          onSearch={() => void search()}
          onPickOther={(id) => void pickOther(id)}
          onCurrentIsSurvivor={setCurrentIsSurvivor}
          onChoices={setChoices}
        />
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
