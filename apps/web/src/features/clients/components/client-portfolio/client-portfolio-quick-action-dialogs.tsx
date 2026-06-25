'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreateDealDialog } from '@/features/crm/components/CreateDealDialog';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { SupportCreateTicketDialog } from '@/features/support/components/SupportCreateTicketDialog';
import { supportApi } from '@/lib/api/support';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { Deal } from '@/lib/api/deals';
import type { Invoice } from '@/lib/api/finance';
import type { FileAsset } from '@/lib/api/drive';
import { PortfolioDriveFileSheet } from './PortfolioDriveFileSheet';
import { PortfolioMessengerSheet } from './PortfolioMessengerSheet';

export type PortfolioQuickActionDialog = 'deal' | 'invoice' | 'ticket';
export type PortfolioQuickActionOverlay = PortfolioQuickActionDialog | 'messenger' | 'drive';

export interface ClientPortfolioQuickActionDialogsProps {
  openDialog: PortfolioQuickActionOverlay | null;
  onOpenDialogChange: (dialog: PortfolioQuickActionOverlay | null) => void;
  dealContactId: string | null;
  projectId: string | null;
  driveFile: FileAsset | null;
}

export function ClientPortfolioQuickActionDialogs({
  openDialog,
  onOpenDialogChange,
  dealContactId,
  projectId,
  driveFile,
}: ClientPortfolioQuickActionDialogsProps) {
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketProjectId, setTicketProjectId] = useState('');
  const [ticketProductId, setTicketProductId] = useState('');
  const [ticketCategory, setTicketCategory] = useState('UNCLASSIFIED');
  const [ticketPriority, setTicketPriority] = useState('P3');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  useEffect(() => {
    if (openDialog !== 'ticket') return;
    setTicketTitle('');
    setTicketProjectId(projectId ?? '');
    setTicketProductId('');
    setTicketCategory('UNCLASSIFIED');
    setTicketPriority('P3');
    setTicketDescription('');
  }, [openDialog, projectId]);

  const closeDialog = useCallback(() => onOpenDialogChange(null), [onOpenDialogChange]);

  const handleDealCreated = useCallback(
    async (_deal: Deal) => {
      closeDialog();
      toast.success('Deal created');
    },
    [closeDialog],
  );

  const handleInvoiceCreated = useCallback(
    async (_invoice?: Invoice) => {
      closeDialog();
      toast.success('Invoice created');
    },
    [closeDialog],
  );

  const submitTicket = useCallback(async () => {
    const title = ticketTitle.trim();
    if (!title) {
      toast.error('Title is required to create a ticket.');
      return;
    }
    setTicketSubmitting(true);
    try {
      await supportApi.create({
        title,
        projectId: ticketProjectId || undefined,
        category: ticketCategory,
        priority: ticketPriority,
        description: ticketDescription.trim() || undefined,
        productId: ticketProductId || undefined,
      });
      closeDialog();
      toast.success('Ticket created');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Ticket could not be created.'));
    } finally {
      setTicketSubmitting(false);
    }
  }, [
    ticketTitle,
    ticketProjectId,
    ticketCategory,
    ticketPriority,
    ticketDescription,
    ticketProductId,
    closeDialog,
  ]);

  return (
    <>
      <CreateDealDialog
        open={openDialog === 'deal'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        prefill={dealContactId ? { contactId: dealContactId } : undefined}
        forceNestedBackdrop
        onCreated={handleDealCreated}
      />

      <CreateInvoiceDialog
        open={openDialog === 'invoice'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        hiddenContext={projectId ? { projectId } : undefined}
        forceNestedBackdrop
        onCreated={handleInvoiceCreated}
      />

      <SupportCreateTicketDialog
        open={openDialog === 'ticket'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        forceNestedBackdrop
        title={ticketTitle}
        projectId={ticketProjectId}
        productId={ticketProductId}
        category={ticketCategory}
        priority={ticketPriority}
        description={ticketDescription}
        onTitleChange={setTicketTitle}
        onProjectIdChange={setTicketProjectId}
        onProductIdChange={setTicketProductId}
        onCategoryChange={setTicketCategory}
        onPriorityChange={setTicketPriority}
        onDescriptionChange={setTicketDescription}
        onSubmit={() => void submitTicket()}
        submitting={ticketSubmitting}
      />

      <PortfolioMessengerSheet
        open={openDialog === 'messenger'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      />

      <PortfolioDriveFileSheet
        file={driveFile}
        open={openDialog === 'drive'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      />
    </>
  );
}
