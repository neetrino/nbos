'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Contact, ContactMergeCandidate, ContactMergeFieldChoices } from '@/lib/api/clients';
import {
  buildContactMergeConflicts,
  contactDisplayName,
  contactMergePreviewLines,
} from './contact-merge-wizard';

export type ContactMergeWizardStep = 'search' | 'survivor' | 'conflicts' | 'preview';

export interface ContactMergeWizardBodyProps {
  step: ContactMergeWizardStep;
  query: string;
  hits: ContactMergeCandidate[];
  other: Contact | null;
  currentContact: Contact;
  currentIsSurvivor: boolean;
  survivor: Contact | null;
  absorbed: Contact | null;
  conflicts: ReturnType<typeof buildContactMergeConflicts>;
  choices: ContactMergeFieldChoices;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onPickOther: (id: string) => void;
  onCurrentIsSurvivor: (value: boolean) => void;
  onChoices: (
    value:
      | ContactMergeFieldChoices
      | ((prev: ContactMergeFieldChoices) => ContactMergeFieldChoices),
  ) => void;
}

export function ContactMergeWizardBody(props: ContactMergeWizardBodyProps) {
  if (props.step === 'search') return <ContactMergeSearchStep {...props} />;
  if (props.step === 'survivor' && props.other) {
    return <ContactMergeSurvivorStep {...props} other={props.other} />;
  }
  if (props.step === 'conflicts' && props.survivor && props.absorbed) {
    return (
      <ContactMergeConflictsStep
        survivor={props.survivor}
        absorbed={props.absorbed}
        conflicts={props.conflicts}
        choices={props.choices}
        onChoices={props.onChoices}
      />
    );
  }
  if (props.step === 'preview' && props.survivor && props.absorbed) {
    return (
      <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
        {contactMergePreviewLines(props.survivor, props.absorbed).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    );
  }
  return null;
}

function ContactMergeSearchStep(
  props: Pick<
    ContactMergeWizardBodyProps,
    'query' | 'hits' | 'loading' | 'onQueryChange' | 'onSearch' | 'onPickOther'
  >,
) {
  return (
    <div className="space-y-3">
      <Label htmlFor="contact-merge-search">Find the other Contact</Label>
      <div className="flex gap-2">
        <Input
          id="contact-merge-search"
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
          placeholder="Name, phone, email…"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              props.onSearch();
            }
          }}
        />
        <Button type="button" onClick={props.onSearch} disabled={props.loading}>
          Search
        </Button>
      </div>
      <ul className="max-h-56 space-y-1 overflow-auto">
        {props.hits.map((hit) => (
          <li key={hit.id}>
            <button
              type="button"
              className="hover:bg-muted w-full rounded-md px-2 py-1.5 text-left text-sm"
              onClick={() => props.onPickOther(hit.id)}
            >
              <span className="font-medium">{contactDisplayName(hit)}</span>
              <span className="text-muted-foreground block text-xs">
                {[hit.phone, hit.email].filter(Boolean).join(' · ') || 'No phone or email'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactMergeSurvivorStep(props: {
  currentContact: Contact;
  other: Contact;
  currentIsSurvivor: boolean;
  onCurrentIsSurvivor: (value: boolean) => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      <p>Which card should remain?</p>
      <label className="flex items-start gap-2">
        <input
          type="radio"
          name="contact-survivor"
          checked={props.currentIsSurvivor}
          onChange={() => props.onCurrentIsSurvivor(true)}
        />
        <span>
          Keep {contactDisplayName(props.currentContact)} — absorb {contactDisplayName(props.other)}
        </span>
      </label>
      <label className="flex items-start gap-2">
        <input
          type="radio"
          name="contact-survivor"
          checked={!props.currentIsSurvivor}
          onChange={() => props.onCurrentIsSurvivor(false)}
        />
        <span>
          Keep {contactDisplayName(props.other)} — absorb {contactDisplayName(props.currentContact)}
        </span>
      </label>
    </div>
  );
}

function ContactMergeConflictsStep(props: {
  survivor: Contact;
  absorbed: Contact;
  conflicts: ReturnType<typeof buildContactMergeConflicts>;
  choices: ContactMergeFieldChoices;
  onChoices: ContactMergeWizardBodyProps['onChoices'];
}) {
  if (props.conflicts.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No conflicting fields. Empty values will fill from the other card. Extra phones are unioned.
      </p>
    );
  }
  return (
    <div className="max-h-72 space-y-3 overflow-auto text-sm">
      {props.conflicts.map((row) => (
        <fieldset key={row.key} className="space-y-1">
          <legend className="font-medium">{row.label}</legend>
          <label className="flex gap-2">
            <input
              type="radio"
              name={row.key}
              checked={(props.choices[row.key] ?? 'survivor') === 'survivor'}
              onChange={() => props.onChoices((prev) => ({ ...prev, [row.key]: 'survivor' }))}
            />
            <span>
              Keep {contactDisplayName(props.survivor)}: {row.survivorValue}
            </span>
          </label>
          <label className="flex gap-2">
            <input
              type="radio"
              name={row.key}
              checked={props.choices[row.key] === 'absorbed'}
              onChange={() => props.onChoices((prev) => ({ ...prev, [row.key]: 'absorbed' }))}
            />
            <span>
              Use {contactDisplayName(props.absorbed)}: {row.absorbedValue}
            </span>
          </label>
        </fieldset>
      ))}
    </div>
  );
}
