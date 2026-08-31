import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PERMISSION_KEY } from '../../../common/decorators/require-permission.decorator';
import { MessengerCoreController } from './messenger-core.controller';
import { MessengerController } from '../messenger.controller';

const ROOT = process.cwd();

function readRepo(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('Slice 1 migration safety', () => {
  const coreSql = readRepo(
    'packages/database/prisma/migrations/20260830190000_messenger_core_relational_foundation/migration.sql',
  );
  const schema = readRepo('packages/database/prisma/schema/messenger.prisma');
  const coreSchema = readRepo('packages/database/prisma/schema/messenger-core.prisma');

  it('does not drop Channel/DM, Unified, Meta, or Task discussion tables', () => {
    expect(coreSql).not.toMatch(/DROP TABLE/i);
    expect(coreSql).not.toMatch(/DROP TYPE/i);
    expect(coreSql).not.toMatch(/task_discussion/i);
    expect(coreSql).not.toMatch(/meta_conversations/i);
    expect(coreSql).not.toMatch(/messenger_channels/i);
    expect(coreSql).not.toMatch(/messenger_direct_threads/i);
  });

  it('does not reintroduce Topic/L1/L2 types', () => {
    expect(schema).not.toMatch(/MessengerTopic/);
    expect(coreSchema).not.toMatch(/MessengerTopic/);
    expect(schema).not.toMatch(/L1|L2/);
    expect(coreSchema).not.toMatch(/TOPIC/);
  });

  it('adds INTERNAL|CLIENT zone and MessageReference without Product-owned provider ids', () => {
    expect(coreSchema).toMatch(/enum MessengerConversationZone/);
    expect(coreSchema).toMatch(/model MessengerMessageReference/);
    expect(coreSchema).toMatch(/model MessengerExternalConversationMapping/);
    expect(coreSchema).not.toMatch(/groupChatId/);
    expect(coreSql).toMatch(/MessengerConversationZone/);
    expect(coreSql).toMatch(/messenger_external_mapping_client_zone_only/);
    expect(coreSql).toMatch(/Conversation\.zone is immutable/);
  });
});

describe('Slice 2 collection migration safety', () => {
  const slice2Sql = readRepo(
    'packages/database/prisma/migrations/20260830200000_messenger_core_permissions_boundary/migration.sql',
  );

  it('is additive and does not drop Channel/DM, Unified, Meta, or Task discussion', () => {
    expect(slice2Sql).not.toMatch(/DROP TABLE/i);
    expect(slice2Sql).not.toMatch(/DROP TYPE/i);
    expect(slice2Sql).not.toMatch(/task_discussion/i);
    expect(slice2Sql).not.toMatch(/meta_conversations/i);
    expect(slice2Sql).not.toMatch(/messenger_channels/i);
    expect(slice2Sql).not.toMatch(/messenger_direct_threads/i);
  });

  it('enforces Collection zone immutability and item zone match', () => {
    expect(slice2Sql).toMatch(/Collection\.zone is immutable/);
    expect(slice2Sql).toMatch(/Collection zone must match conversation zone/);
    expect(slice2Sql).toMatch(/messenger_conversation_collections/);
  });
});

describe('Slice 3 cutover does not drop Channel/DM', () => {
  it('keeps Channel/DM models in schema after Internal UI cutover', () => {
    const schema = readRepo('packages/database/prisma/schema/messenger.prisma');
    expect(schema).toMatch(/model MessengerChannel /);
    expect(schema).toMatch(/model MessengerDirectThread /);
    expect(schema).toMatch(/model MessengerChannelMessage /);
    expect(schema).toMatch(/model MessengerDirectMessage /);
  });
});

describe('Core HTTP authorization metadata', () => {
  it('requires MESSENGER VIEW/EDIT on Core routes', () => {
    expect(
      Reflect.getMetadata(PERMISSION_KEY, MessengerCoreController.prototype.createConversation),
    ).toEqual({ module: 'MESSENGER', action: 'EDIT' });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, MessengerCoreController.prototype.getConversation),
    ).toEqual({ module: 'MESSENGER', action: 'VIEW' });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, MessengerCoreController.prototype.sendMessage),
    ).toEqual({ module: 'MESSENGER', action: 'EDIT' });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, MessengerCoreController.prototype.inviteParticipant),
    ).toEqual({ module: 'MESSENGER', action: 'EDIT' });
  });

  it('keeps the live Channel/DM controller on the legacy routes', () => {
    expect(Reflect.getMetadata(PERMISSION_KEY, MessengerController.prototype.sendMessage)).toEqual({
      module: 'MESSENGER',
      action: 'EDIT',
    });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, MessengerController.prototype.sendDirectMessage),
    ).toEqual({
      module: 'MESSENGER',
      action: 'EDIT',
    });
  });
});

describe('Slice 3 Internal HTTP', () => {
  it('requires MESSENGER VIEW/EDIT on Internal Core routes', async () => {
    const { MessengerCoreInternalController } =
      await import('./messenger-core-internal.controller');
    expect(
      Reflect.getMetadata(
        PERMISSION_KEY,
        MessengerCoreInternalController.prototype.listConversations,
      ),
    ).toEqual({ module: 'MESSENGER', action: 'VIEW' });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, MessengerCoreInternalController.prototype.sendMessage),
    ).toEqual({ module: 'MESSENGER', action: 'EDIT' });
  });
});

describe('Slice 4 entity conversation migration safety', () => {
  const slice4Sql = readRepo(
    'packages/database/prisma/migrations/20260830210000_messenger_entity_workspace_type/migration.sql',
  );

  it('is additive and does not drop Channel/DM, Unified, Meta, or Task discussion', () => {
    expect(slice4Sql).not.toMatch(/DROP TABLE/i);
    expect(slice4Sql).not.toMatch(/DROP TYPE/i);
    expect(slice4Sql).not.toMatch(/task_discussion/i);
    expect(slice4Sql).not.toMatch(/meta_conversations/i);
    expect(slice4Sql).not.toMatch(/messenger_channels/i);
    expect(slice4Sql).not.toMatch(/messenger_direct_threads/i);
    expect(slice4Sql).toMatch(/ADD VALUE IF NOT EXISTS 'WORKSPACE'/);
  });

  it('does not add a global unique on ConversationLink entity identity', () => {
    expect(slice4Sql).not.toMatch(/entity_type.*entity_id.*UNIQUE/i);
    const schema = readRepo('packages/database/prisma/schema/messenger.prisma');
    expect(schema).toMatch(/@@unique\(\[conversationId, entityType, entityId, relationType\]\)/);
    expect(schema).not.toMatch(/@@unique\(\[entityType, entityId\]\)/);
  });

  it('does not create Project General from Project create or list', () => {
    const projectService = readRepo('apps/api/src/modules/projects/projects.service.ts');
    const projectController = readRepo('apps/api/src/modules/projects/projects.controller.ts');
    expect(projectService).not.toMatch(/ensureProjectGeneral/);
    expect(projectService).not.toMatch(/PROJECT_GENERAL/);
    expect(projectService).not.toMatch(/messengerConversation\.create/);
    expect(projectController).not.toMatch(/ensureProjectGeneral/);
  });

  it('entity HTTP ensure has no caller canonicalKey field', () => {
    const entityController = readRepo(
      'apps/api/src/modules/messenger/core/messenger-core-internal-entity.controller.ts',
    );
    expect(entityController).not.toMatch(/canonicalKey/);
    expect(entityController).toMatch(/products\/:productId/);
    expect(entityController).toMatch(/work-spaces\/:workspaceId/);
    expect(entityController).toMatch(/deals\/:dealId/);
  });
});

describe('FINDING-S1-01 / FINDING-S1-02 closures', () => {
  it('does not accept canonicalKey on the HTTP create DTO or controller', () => {
    const dto = readRepo('apps/api/src/modules/messenger/core/dto/create-core-conversation.dto.ts');
    const controller = readRepo('apps/api/src/modules/messenger/core/messenger-core.controller.ts');
    const types = readRepo('apps/api/src/modules/messenger/core/messenger-core.types.ts');
    const ops = readRepo('apps/api/src/modules/messenger/core/messenger-core-conversation.ops.ts');
    expect(dto).not.toMatch(/canonicalKey/);
    expect(controller).not.toMatch(/canonicalKey/);
    expect(types).not.toMatch(/canonicalKey\?:/);
    expect(ops).not.toMatch(/input\.canonicalKey/);
  });

  it('does not expose allowClientPersist on persistAndBroadcast', () => {
    const service = readRepo('apps/api/src/modules/messenger/core/messenger-core.service.ts');
    expect(service).not.toMatch(/allowClientPersist/);
  });

  it('does not add a Core HTTP provider-mapping route', () => {
    const controller = readRepo('apps/api/src/modules/messenger/core/messenger-core.controller.ts');
    expect(controller).not.toMatch(/external-mapping|createCoreExternalMapping/);
  });
});

describe('Slice 5 Task Discussion migration safety', () => {
  const slice5Sql = readRepo(
    'packages/database/prisma/migrations/20260831120000_messenger_task_discussion_legacy_identity/migration.sql',
  );

  it('is additive and does not DROP Task discussion, Channel/DM, Unified, or Meta', () => {
    expect(slice5Sql).not.toMatch(/DROP TABLE/i);
    expect(slice5Sql).not.toMatch(/DROP TYPE/i);
    expect(slice5Sql).not.toMatch(/DROP COLUMN/i);
    expect(slice5Sql).toMatch(/ADD VALUE IF NOT EXISTS 'TASK'/);
    expect(slice5Sql).toMatch(/ADD VALUE IF NOT EXISTS 'TASK_DISCUSSION_ENTRY'/);
    expect(slice5Sql).toMatch(/ADD COLUMN IF NOT EXISTS "metadata"/);
    expect(slice5Sql).not.toMatch(/DROP TABLE .*task_discussion/i);
    expect(slice5Sql).not.toMatch(/messenger_channels/);
  });

  it('does not eager-ensure Task conversations on Task create or list', () => {
    const createOp = readRepo('apps/api/src/modules/tasks/create-task.op.ts');
    const tasksService = readRepo('apps/api/src/modules/tasks/tasks.service.ts');
    expect(createOp).not.toMatch(/ensureTaskConversation/);
    expect(createOp).not.toMatch(/messengerConversation/);
    expect(tasksService).not.toMatch(/ensureTaskConversation/);
    expect(tasksService).not.toMatch(/messengerConversation\.delete/);
  });

  it('does not reuse Task.chatId as the conversation pointer', () => {
    const ensure = readRepo(
      'apps/api/src/modules/messenger/core/messenger-core-task-ensure.ops.ts',
    );
    const discussion = readRepo('apps/api/src/modules/tasks/task-discussion.service.ts');
    expect(ensure).not.toMatch(/task\.update/);
    expect(ensure).not.toMatch(/chat_id/);
    expect(discussion).not.toMatch(/chatId/);
    expect(ensure).toMatch(/taskCanonicalKey/);
  });

  it('keeps Activity on the Task Card and does not persist it as Core human notes', () => {
    const panel = readRepo('apps/web/src/features/tasks/components/TaskSheetChatPanel.tsx');
    const discussion = readRepo('apps/api/src/modules/tasks/task-discussion.service.ts');
    expect(panel).toMatch(/function buildTaskActivity/);
    expect(discussion).not.toMatch(/buildTaskActivity/);
    expect(discussion).not.toMatch(/Task marked completed/);
  });

  it('does not add HTTP entity ensure for empty Tasks', () => {
    const entityController = readRepo(
      'apps/api/src/modules/messenger/core/messenger-core-internal-entity.controller.ts',
    );
    expect(entityController).not.toMatch(/tasks\/:taskId/);
    expect(entityController).not.toMatch(/canonicalKey/);
  });
});
