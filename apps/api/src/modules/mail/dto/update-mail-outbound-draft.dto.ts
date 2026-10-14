import { CreateMailOutboundDraftDto } from './create-mail-outbound-draft.dto';

/**
 * Partial replace of an existing outbound DRAFT (recipients, subject, body).
 * Omit `fileAssetIds` to keep attachments. Send the array to replace them.
 */
export class UpdateMailOutboundDraftDto extends CreateMailOutboundDraftDto {}
