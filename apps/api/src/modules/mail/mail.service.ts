import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { listMailDeliveryLogsForMessage } from './mail-delivery-log-query.ops';
import { listMailAccountHealthSummariesForViewer } from './mail-health-summary.ops';
import { loadMailAccountWithViewerRole } from './mail-account-role.ops';
import { listMailSyncLogs } from './mail-sync-log-query.ops';
import {
  getMailThreadDetailDtoOrNull,
  listMailAccountsForViewer,
  listMailThreadsForViewer,
} from './mail-inbox-query.ops';
import type { ListMailThreadsOptions } from './mail-inbox-query.ops';
import type {
  MailAccountHealthSummaryRow,
  MailAccountRow,
  MailDeliveryLogRow,
  MailSyncLogRow,
  MailThreadDetailDto,
  MailThreadListPageDto,
} from './mail.types';

export type { ListMailThreadsOptions } from './mail-inbox-query.ops';

@Injectable()
export class MailService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listAccounts(employeeId: string, viewScope: string): Promise<MailAccountRow[]> {
    return listMailAccountsForViewer(this.prisma, employeeId, viewScope);
  }

  async listAccountHealthSummaries(
    employeeId: string,
    viewScope: string,
  ): Promise<MailAccountHealthSummaryRow[]> {
    return listMailAccountHealthSummariesForViewer(this.prisma, employeeId, viewScope);
  }

  async listThreads(
    employeeId: string,
    viewScope: string,
    options: ListMailThreadsOptions = {},
  ): Promise<MailThreadListPageDto> {
    const result = await listMailThreadsForViewer(this.prisma, employeeId, viewScope, options);
    if (!result.ok) {
      throw new NotFoundException('Mail account not found');
    }
    return result.data;
  }

  async getThreadDetail(
    employeeId: string,
    viewScope: string,
    threadId: string,
  ): Promise<MailThreadDetailDto> {
    const dto = await getMailThreadDetailDtoOrNull(this.prisma, {
      employeeId,
      viewScope,
      threadId,
    });
    if (!dto) {
      throw new NotFoundException('Thread not found');
    }
    return dto;
  }

  async listMessageDeliveryLogs(
    employeeId: string,
    viewScope: string,
    threadId: string,
    messageId: string,
  ): Promise<MailDeliveryLogRow[]> {
    const rows = await listMailDeliveryLogsForMessage(this.prisma, {
      employeeId,
      viewScope,
      threadId,
      messageId,
    });
    if (rows === null) {
      throw new NotFoundException('Message not found');
    }
    return rows;
  }

  async listSyncLogs(
    employeeId: string,
    viewScope: string,
    mailAccountId: string,
  ): Promise<MailSyncLogRow[]> {
    const loaded = await loadMailAccountWithViewerRole(this.prisma, {
      mailAccountId,
      employeeId,
      viewScope,
    });
    if (!loaded) {
      throw new NotFoundException('Mail account not found');
    }
    return listMailSyncLogs(this.prisma, mailAccountId);
  }
}
