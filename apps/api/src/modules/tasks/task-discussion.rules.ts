import { BadRequestException } from '@nestjs/common';
import { isActorChannelSource, isActorType, type ActorContext } from '@nbos/shared';
import {
  TASK_DISCUSSION_BODY_MAX_LENGTH,
  TASK_DISCUSSION_DEFAULT_PAGE_SIZE,
  TASK_DISCUSSION_MAX_PAGE_SIZE,
  TASK_DISCUSSION_MIN_PAGE_SIZE,
} from './task-discussion.constants';

export function requireDiscussionBody(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new BadRequestException('body is required');
  }
  const body = raw.trim();
  if (!body) {
    throw new BadRequestException('body is required');
  }
  if (body.length > TASK_DISCUSSION_BODY_MAX_LENGTH) {
    throw new BadRequestException(
      `body must be at most ${TASK_DISCUSSION_BODY_MAX_LENGTH} characters`,
    );
  }
  return body;
}

export function clampDiscussionPage(page: number | undefined): number {
  if (page === undefined || !Number.isFinite(page) || page < 1) {
    return 1;
  }
  return Math.floor(page);
}

export function resolveDiscussionPage(
  query: { page?: number; latest?: boolean },
  totalPages: number,
): number {
  if (query.latest && query.page === undefined) {
    return totalPages === 0 ? 1 : totalPages;
  }
  return clampDiscussionPage(query.page);
}

export function clampDiscussionPageSize(pageSize: number | undefined): number {
  if (pageSize === undefined || !Number.isFinite(pageSize)) {
    return TASK_DISCUSSION_DEFAULT_PAGE_SIZE;
  }
  return Math.min(
    TASK_DISCUSSION_MAX_PAGE_SIZE,
    Math.max(TASK_DISCUSSION_MIN_PAGE_SIZE, Math.floor(pageSize)),
  );
}

export function discussionActorFields(actor: ActorContext): {
  actorType: string;
  actorId: string;
  actorDisplayName: string;
  channelSource: string | null;
  correlationId: string | null;
} {
  if (!isActorType(actor.actor.type)) {
    throw new BadRequestException('Unsupported discussion actor');
  }
  const channel = actor.channel?.source;
  return {
    actorType: actor.actor.type,
    actorId: actor.actor.id,
    actorDisplayName: actor.actor.displayName,
    channelSource: channel && isActorChannelSource(channel) ? channel : null,
    correlationId: actor.correlationId ?? null,
  };
}
