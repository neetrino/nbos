import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { DEFAULT_INTERFACE_LOCALE } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { DriveR2Client } from '../drive/drive-r2.client';
import { buildSensitiveReportAuditContext } from './reports-audit-context';
import { loadReportExportAttachment } from './reports-export-email-file';
import {
  buildReportExportEmailHtml,
  buildReportExportEmailSubject,
  buildReportExportPeriodLabel,
  buildReportFilesHref,
} from './reports-export-email-html';
import type { ReportExportEmailJob } from './reports-export-email.types';
import {
  parseRecipientRoles,
  resolveReportScheduleRecipientEmails,
} from './reports-recipient-resolve';

const RESEND_API_URL = 'https://api.resend.com/emails';
const REPORT_EXPORT_AUDIT_ENTITY = 'REPORT_EXPORT_JOB';

@Injectable()
export class ReportsExportEmailService {
  private readonly logger = new Logger(ReportsExportEmailService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly driveR2: DriveR2Client,
  ) {}

  async sendForCompletedJob(job: ReportExportEmailJob, actorId: string): Promise<void> {
    if (!hasCompletedDriveFile(job)) return;
    try {
      await this.deliverCompletedExport(job, actorId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Report export email failed for job ${job.id}: ${message}`);
    }
  }

  private async deliverCompletedExport(job: ReportExportEmailJob, actorId: string): Promise<void> {
    const schedule = await this.prisma.reportSchedule.findFirst({
      where: { lastExportJobId: job.id },
      select: {
        id: true,
        ownerId: true,
        recipientEmails: true,
        recipientRoles: true,
        reportKey: true,
      },
    });
    if (!schedule) return;
    const recipients = await resolveReportScheduleRecipientEmails(this.prisma, {
      recipientRoles: parseRecipientRoles(schedule.recipientRoles),
      ownerId: schedule.ownerId,
      storedEmails: schedule.recipientEmails,
    });
    if (recipients.length === 0) return;
    const file = job.fileAsset;
    if (!file) return;
    const attachment = await loadReportExportAttachment(this.driveR2, file);
    if (!attachment) {
      this.logger.warn(
        `Report export email skipped attachment for job ${job.id}: file bytes missing.`,
      );
      return;
    }
    const locale = await this.readOwnerLocale(schedule.ownerId);
    const sent = await this.sendResend(job, recipients, attachment, locale);
    if (!sent) return;
    await this.auditService.log({
      entityType: REPORT_EXPORT_AUDIT_ENTITY,
      entityId: job.id,
      action: 'report_export.emailed',
      userId: actorId,
      changes: {
        scheduleId: schedule.id,
        recipientCount: recipients.length,
        recipientRoles: schedule.recipientRoles,
        ...buildSensitiveReportAuditContext(job.reportKey),
      },
    });
  }

  private async readOwnerLocale(ownerId: string): Promise<string> {
    const owner = await this.prisma.employee.findUnique({
      where: { id: ownerId },
      select: { interfaceLocale: true },
    });
    return owner?.interfaceLocale ?? DEFAULT_INTERFACE_LOCALE;
  }

  private async sendResend(
    job: ReportExportEmailJob,
    recipients: string[],
    attachment: { filename: string; content: string; contentType: string },
    locale: string,
  ): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !fromEmail) {
      this.logger.warn('Report export email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL is unset');
      return false;
    }
    const replyTo = process.env.RESEND_ADMIN_EMAIL;
    const html = buildReportExportEmailHtml({
      reportTitle: job.reportTitle,
      format: job.format,
      fileName: attachment.filename,
      generatedAt: new Date(),
      periodLabel: buildReportExportPeriodLabel(job.filters, locale),
      filesHref: buildReportFilesHref(),
      locale,
    });
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        reply_to: replyTo ? [replyTo] : undefined,
        subject: buildReportExportEmailSubject(job.reportTitle, job.format, locale),
        html,
        attachments: [
          {
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType,
          },
        ],
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend rejected report email: ${errorText}`);
    }
    return true;
  }
}

function hasCompletedDriveFile(job: ReportExportEmailJob): boolean {
  return (
    job.status === 'COMPLETED' && Boolean(job.fileAssetId) && Boolean(job.fileAsset?.storageKey)
  );
}
