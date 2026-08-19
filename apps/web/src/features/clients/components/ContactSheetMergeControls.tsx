'use client';

import { useState } from 'react';
import { GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canOfferContactMerge } from '@nbos/shared';
import { usePermission } from '@/lib/permissions';
import type { Contact } from '@/lib/api/clients';
import { ContactMergeDialog } from './ContactMergeDialog';

interface ContactSheetMergeControlsProps {
  contact: Contact;
  isTrashView: boolean;
  onMerged: (survivor: Contact) => void;
}

export function ContactSheetMergeControls({
  contact,
  isTrashView,
  onMerged,
}: ContactSheetMergeControlsProps) {
  const { me } = usePermission();
  const [open, setOpen] = useState(false);
  if (isTrashView || !canOfferContactMerge(me?.role.slug)) return null;

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <GitMerge size={14} className="mr-1" />
        Merge
      </Button>
      <ContactMergeDialog
        open={open}
        currentContact={contact}
        onOpenChange={setOpen}
        onMerged={onMerged}
      />
    </>
  );
}
