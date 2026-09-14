import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { mailApi } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { emailsForRecipientKind, latestOutboundDraftMessage } from './mail-thread-helpers';

export interface MailComposeResumeDraft {
  mailAccountId: string;
  to: string;
  cc: string;
  subject: string;
  bodyHtml: string | null;
  bodyText: string;
}

interface UseMailComposeResumeArgs {
  enabled: boolean;
  resumeThreadId: string | null;
  hydrate: (threadId: string, draftId: string) => void;
  onHydrated: (draft: MailComposeResumeDraft) => void;
  onSettled: () => void;
}

export function useMailComposeResume({
  enabled,
  resumeThreadId,
  hydrate,
  onHydrated,
  onSettled,
}: UseMailComposeResumeArgs): void {
  const onHydratedRef = useRef(onHydrated);
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onHydratedRef.current = onHydrated;
    onSettledRef.current = onSettled;
  }, [onHydrated, onSettled]);

  useEffect(() => {
    if (!enabled || !resumeThreadId) {
      return;
    }
    let cancelled = false;
    void mailApi
      .getThread(resumeThreadId)
      .then((detail) => {
        if (cancelled) {
          return;
        }
        const draft = latestOutboundDraftMessage(detail.messages);
        if (draft) {
          onHydratedRef.current({
            mailAccountId: detail.thread.mailAccountId,
            to: emailsForRecipientKind(draft, 'TO'),
            cc: emailsForRecipientKind(draft, 'CC'),
            subject: draft.subject,
            bodyHtml: draft.bodyHtmlSanitized,
            bodyText: draft.bodyText ?? '',
          });
          hydrate(detail.thread.id, draft.id);
        }
        onSettledRef.current();
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, 'Draft could not be opened.'));
          onSettledRef.current();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, hydrate, resumeThreadId]);
}
