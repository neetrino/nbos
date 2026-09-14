import type { CreateMailOutboundDraftPayload } from '@/lib/api/mail';
import { splitEmailList } from './mail-thread-helpers';

export function mailComposeDraftPayload(input: {
  to: string;
  cc: string;
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
}): CreateMailOutboundDraftPayload {
  const to = splitEmailList(input.to);
  const cc = splitEmailList(input.cc);
  return {
    to,
    ...(cc.length > 0 ? { cc } : {}),
    subject: input.subject.trim(),
    bodyText: input.bodyText,
    ...(input.bodyHtml ? { bodyHtml: input.bodyHtml } : {}),
  };
}

export function isMailComposeDraftWorthSaving(payload: CreateMailOutboundDraftPayload): boolean {
  if ((payload.to?.length ?? 0) > 0) {
    return true;
  }
  if ((payload.cc?.length ?? 0) > 0) {
    return true;
  }
  if ((payload.subject ?? '').trim().length > 0) {
    return true;
  }
  return (payload.bodyText ?? '').trim().length > 0;
}
