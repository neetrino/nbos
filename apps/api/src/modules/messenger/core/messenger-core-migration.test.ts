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
});
