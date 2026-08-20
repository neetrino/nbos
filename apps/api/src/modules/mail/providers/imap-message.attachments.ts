import type { Attachment, ParsedMail } from 'mailparser';
import type { DownloadedAttachment, NormalizedAttachment } from './mail-provider-adapter';
import { MailAttachmentPermanentError } from '../mail-provider-error.classify';

export const IMAP_PART_ID_PREFIX = 'imap-part:';
export const DEFAULT_ATTACHMENT_MIME = 'application/octet-stream';

const IMAP_ROOT_BODY_SECTION = '1';
const LEGACY_PART_ID_RE = /^part:(\d+):(.+)$/;
const IMAP_SECTION_RE = /^\d+(?:\.\d+)*$/;

export interface ImapBodyStructureNode {
  part?: string;
  type: string;
  id?: string;
  parameters?: { [key: string]: string };
  dispositionParameters?: { [key: string]: string };
  childNodes?: ImapBodyStructureNode[];
}

function stripCidBrackets(value: string): string {
  return value.replace(/^<|>$/g, '').trim();
}

/** IMAP BODYSTRUCTURE section from `imap-part:{section}`, else null. */
export function parseImapPartSection(providerAttachmentId: string): string | null {
  if (!providerAttachmentId.startsWith(IMAP_PART_ID_PREFIX)) {
    return null;
  }
  const section = providerAttachmentId.slice(IMAP_PART_ID_PREFIX.length);
  return IMAP_SECTION_RE.test(section) ? section : null;
}

/** Stable IMAP part id: content-id / cid, else `imap-part:{section}`, else `part:{index}:{filename}`. */
export function imapProviderAttachmentId(
  attachment: Pick<Attachment, 'contentId' | 'cid' | 'filename'>,
  index: number,
  imapSection?: string,
): string {
  const cid = stripCidBrackets(attachment.contentId || attachment.cid || '');
  if (cid) {
    return cid;
  }
  if (imapSection) {
    return `${IMAP_PART_ID_PREFIX}${imapSection}`;
  }
  return `part:${index}:${attachment.filename ?? 'unnamed'}`;
}

function structureFilename(node: ImapBodyStructureNode): string {
  return node.dispositionParameters?.filename ?? node.parameters?.name ?? '';
}

function collectStructureLeaves(node: ImapBodyStructureNode): ImapBodyStructureNode[] {
  const children = node.childNodes ?? [];
  if (children.length === 0) {
    return [{ ...node, part: node.part ?? IMAP_ROOT_BODY_SECTION }];
  }
  return children.flatMap(collectStructureLeaves);
}

function takeMatchingLeaf(
  unusedLeaves: ImapBodyStructureNode[],
  predicate: (leaf: ImapBodyStructureNode) => boolean,
): string | undefined {
  const index = unusedLeaves.findIndex(predicate);
  if (index < 0) {
    return undefined;
  }
  const [matched] = unusedLeaves.splice(index, 1);
  return matched?.part;
}

function matchImapSection(
  attachment: Pick<Attachment, 'contentId' | 'cid' | 'filename'>,
  unusedLeaves: ImapBodyStructureNode[],
): string | undefined {
  const cid = stripCidBrackets(attachment.contentId || attachment.cid || '');
  if (cid) {
    const byCid = takeMatchingLeaf(unusedLeaves, (leaf) => stripCidBrackets(leaf.id ?? '') === cid);
    if (byCid) {
      return byCid;
    }
  }
  const filename = (attachment.filename ?? '').toLowerCase();
  if (!filename) {
    return undefined;
  }
  return takeMatchingLeaf(
    unusedLeaves,
    (leaf) => structureFilename(leaf).toLowerCase() === filename,
  );
}

function toNormalizedAttachment(
  attachment: Attachment,
  index: number,
  imapSection?: string,
): NormalizedAttachment {
  return {
    providerAttachmentId: imapProviderAttachmentId(attachment, index, imapSection),
    fileName: attachment.filename || `attachment-${index + 1}`,
    mimeType: attachment.contentType || null,
    sizeBytes: typeof attachment.size === 'number' ? attachment.size : null,
    isInline: attachment.contentDisposition === 'inline' || Boolean(attachment.related),
  };
}

/** Metadata only — does not copy `content` buffers into the normalized message. */
export function collectImapAttachments(
  parsed: ParsedMail,
  bodyStructure?: ImapBodyStructureNode,
): NormalizedAttachment[] {
  const unusedLeaves = bodyStructure ? collectStructureLeaves(bodyStructure) : [];
  return (parsed.attachments ?? []).map((attachment, index) =>
    toNormalizedAttachment(attachment, index, matchImapSection(attachment, unusedLeaves)),
  );
}

function attachmentContent(attachment: Attachment): Buffer {
  const raw = attachment.content;
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
}

function toDownloaded(attachment: Attachment, index: number): DownloadedAttachment {
  return {
    filename: attachment.filename || `attachment-${index + 1}`,
    contentType: attachment.contentType || DEFAULT_ATTACHMENT_MIME,
    content: attachmentContent(attachment),
  };
}

function parseLegacyPartId(providerAttachmentId: string): { filename: string } | null {
  const match = LEGACY_PART_ID_RE.exec(providerAttachmentId);
  if (!match?.[2]) {
    return null;
  }
  return { filename: match[2] };
}

function extractLegacyByFilename(
  attachments: Attachment[],
  filename: string,
): DownloadedAttachment | null {
  const index = attachments.findIndex((item) => (item.filename ?? 'unnamed') === filename);
  const attachment = index >= 0 ? attachments[index] : undefined;
  return attachment ? toDownloaded(attachment, index) : null;
}

export function extractImapAttachment(
  parsed: ParsedMail,
  providerAttachmentId: string,
): DownloadedAttachment {
  const attachments = parsed.attachments ?? [];
  for (let index = 0; index < attachments.length; index += 1) {
    const attachment = attachments[index];
    if (!attachment || imapProviderAttachmentId(attachment, index) !== providerAttachmentId) {
      continue;
    }
    return toDownloaded(attachment, index);
  }
  const legacy = parseLegacyPartId(providerAttachmentId);
  const byFilename = legacy ? extractLegacyByFilename(attachments, legacy.filename) : null;
  if (byFilename) {
    return byFilename;
  }
  throw new MailAttachmentPermanentError(`IMAP attachment part not found: ${providerAttachmentId}`);
}
