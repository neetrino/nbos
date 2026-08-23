import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { assertCreateTaskRequiredFields, createTask } from './create-task.op';
import { allocateTaskCode } from './task-code-generation';
import type { CreateTaskInput, TaskCreatedByActor } from './task-create.input';
import type { TasksDbClient } from './tasks-db-client';

export interface CreateTaskCallOptions {
  actor?: TaskCreatedByActor;
  tx?: TasksDbClient;
  reservedCode?: string;
}

/**
 * Narrow Tasks-owned create port. Human/API, Support, Automation and other
 * trusted producers share this path. It is not an External Agent authorization
 * gateway and does not invent Employee identities for machine producers.
 */
@Injectable()
export class TaskCreationService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * Reserves the next `T-{year}` code on the committed client.
   * Call this before opening a longer transaction that writes the task.
   */
  async reserveCode(): Promise<string> {
    return allocateTaskCode(this.prisma);
  }

  async create(data: CreateTaskInput, options?: CreateTaskCallOptions) {
    assertCreateTaskRequiredFields(data);
    const db = options?.tx ?? this.prisma;
    const code = options?.reservedCode ?? (await this.reserveCode());
    return createTask({
      db,
      data,
      code,
      actor: options?.actor,
    });
  }
}
