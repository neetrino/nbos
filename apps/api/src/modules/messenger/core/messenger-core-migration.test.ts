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

describe('Slice 6 message actions migration safety', () => {
  const slice6Sql = readRepo(
    'packages/database/prisma/migrations/20260831140000_messenger_message_actions_mentions/migration.sql',
  );

  it('is additive and does not DROP Channel/DM, Unified, Meta, or Task discussion', () => {
    expect(slice6Sql).not.toMatch(/DROP TABLE/i);
    expect(slice6Sql).not.toMatch(/DROP TYPE/i);
    expect(slice6Sql).not.toMatch(/DROP COLUMN/i);
    expect(slice6Sql).toMatch(/messenger_message_mentions/);
    expect(slice6Sql).toMatch(/sort_order/);
    expect(slice6Sql).not.toMatch(/task_discussion_entries/);
    expect(slice6Sql).not.toMatch(/messenger_channels/);
    expect(slice6Sql).not.toMatch(/messenger_direct_threads/);
  });

  it('does not invent Create Task with AI or Client Ticket/Deal products', () => {
    const createTaskUi = readRepo(
      'apps/web/src/features/messenger-internal/InternalCreateTaskFromMessages.tsx',
    );
    const hooks = readRepo(
      'apps/api/src/modules/messenger/core/messenger-core-client-action-hooks.ts',
    );
    expect(createTaskUi).toMatch(/QuickCreateTaskDialog/);
    expect(createTaskUi).not.toMatch(/defaultTitle|title:.*content/);
    expect(hooks).toMatch(/createTicketImplemented: true/);
    expect(hooks).toMatch(/createDealImplemented: false/);
  });
});

describe('Slice 7 Client Messenger migration safety', () => {
  const slice7Sql = readRepo(
    'packages/database/prisma/migrations/20260831180000_messenger_client_meta_identity/migration.sql',
  );

  it('is additive and does not DROP Meta, Channel/DM, Unified, or Task discussion', () => {
    expect(slice7Sql).not.toMatch(/DROP TABLE/i);
    expect(slice7Sql).not.toMatch(/DROP TYPE/i);
    expect(slice7Sql).not.toMatch(/DROP COLUMN/i);
    expect(slice7Sql).toMatch(/ADD VALUE IF NOT EXISTS 'META_CONVERSATION'/);
    expect(slice7Sql).toMatch(/ADD VALUE IF NOT EXISTS 'META_MESSAGE'/);
    expect(slice7Sql).toMatch(/ADD VALUE IF NOT EXISTS 'LEAD'/);
    expect(slice7Sql).not.toMatch(/meta_conversations/);
    expect(slice7Sql).not.toMatch(/messenger_channels/);
    expect(slice7Sql).not.toMatch(/task_discussion_entries/);
  });

  it('does not accept HTTP canonicalKey on Client controllers or DTOs', () => {
    const controller = readRepo(
      'apps/api/src/modules/messenger/core/messenger-core-client.controller.ts',
    );
    const collections = readRepo(
      'apps/api/src/modules/messenger/core/messenger-core-client-collection.controller.ts',
    );
    const query = readRepo(
      'apps/api/src/modules/messenger/core/dto/list-client-conversations.query.ts',
    );
    const invite = readRepo(
      'apps/api/src/modules/messenger/core/dto/invite-client-read-only.dto.ts',
    );
    expect(controller).not.toMatch(/canonicalKey/);
    expect(collections).not.toMatch(/canonicalKey/);
    expect(query).not.toMatch(/canonicalKey/);
    expect(invite).not.toMatch(/canonicalKey/);
    expect(invite).not.toMatch(/MEMBER|SEND|ADMIN/);
  });

  it('keeps persistAndBroadcast arity 1 and Client send on VIEW not EDIT', async () => {
    const service = readRepo('apps/api/src/modules/messenger/core/messenger-core.service.ts');
    expect(service).not.toMatch(/allowClientPersist/);
    expect(service).not.toMatch(/assertClientPersistBlocked/);
    const { MessengerCoreClientController } = await import('./messenger-core-client.controller');
    expect(
      Reflect.getMetadata(PERMISSION_KEY, MessengerCoreClientController.prototype.sendMessage),
    ).toEqual({ module: 'MESSENGER', action: 'VIEW' });
  });

  it('does not apply Mail exemption patterns to Meta inbound', () => {
    const ingest = readRepo('apps/api/src/modules/integrations/meta/meta-lead-ingest.service.ts');
    expect(ingest).toMatch(/persistLiveMetaInboundToCore/);
    expect(ingest).not.toMatch(/metaMessage\.create/);
    expect(ingest).not.toMatch(/allowClientPersist/);
  });
});

describe('Slice 10 Finance/Support/attention migration safety', () => {
  const slice10Sql = readRepo(
    'packages/database/prisma/migrations/20260901010000_messenger_attention_routing/migration.sql',
  );

  it('is additive and does not DROP legacy Messenger or Product WhatsApp tables', () => {
    expect(slice10Sql).not.toMatch(/DROP TABLE/i);
    expect(slice10Sql).not.toMatch(/DROP TYPE/i);
    expect(slice10Sql).not.toMatch(/DROP COLUMN/i);
    expect(slice10Sql).toMatch(/messenger_conversation_attentions/);
    expect(slice10Sql).not.toMatch(/product_whatsapp_group_bindings/);
    expect(slice10Sql).not.toMatch(/messenger_channels/);
    expect(slice10Sql).not.toMatch(/task_discussion_entries/);
  });
});
