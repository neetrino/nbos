import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB_SRC = path.join(process.cwd(), 'apps/web/src');

function readWeb(relative: string): string {
  return readFileSync(path.join(WEB_SRC, relative), 'utf8');
}

describe('Internal Messenger web client', () => {
  it('does not call Channel/DM send endpoints', () => {
    const client = readWeb('lib/api/messenger-core.ts');
    expect(client).toMatch(/\/api\/messenger\/core\/internal/);
    expect(client).not.toMatch(/\/api\/messenger\/channels/);
    expect(client).not.toMatch(/\/api\/messenger\/dm/);
    expect(client).not.toMatch(/messengerChannelMessage/);
    expect(client).not.toMatch(/sendChannelMessage/);
    expect(client).not.toMatch(/sendDirectMessage/);
  });

  it('product Internal surfaces do not embed Channel/DM send', () => {
    const sheet = readWeb(
      'features/clients/components/client-portfolio/PortfolioMessengerSheet.tsx',
    );
    const app = readWeb('features/messenger-internal/InternalMessengerApp.tsx');
    expect(sheet).toMatch(/InternalMessengerApp/);
    expect(sheet).not.toMatch(/MessengerClient/);
    expect(sheet).not.toMatch(/\/api\/messenger\/channels/);
    expect(sheet).not.toMatch(/\/api\/messenger\/dm/);
    expect(app).not.toMatch(/legacy-map/);
    expect(app).not.toMatch(/mapLegacy/);
    expect(app).toMatch(/collection\.conversations/);
    expect(app).toMatch(/active\.canWrite/);
    expect(app).not.toMatch(/\/api\/messenger\/channels/);
    expect(app).not.toMatch(/\/api\/messenger\/dm/);
  });

  it('entity ensure client uses Internal Core paths only', () => {
    const client = readWeb('lib/api/messenger-core.ts');
    expect(client).toMatch(/entities\/products\//);
    expect(client).toMatch(/entities\/work-spaces\//);
    expect(client).toMatch(/entities\/deals\//);
    expect(client).toMatch(/async ensureProduct\(productId: string\)/);
    expect(client).not.toMatch(/ensureProduct\([^)]*canonicalKey/);
    const panel = readWeb('features/messenger-internal/EntityConversationPanel.tsx');
    const hook = readWeb('features/messenger-internal/use-entity-conversation.ts');
    expect(hook).toMatch(/messengerCoreApi\.ensureProduct/);
    expect(hook).toMatch(/messengerCoreApi\.ensureWorkSpace/);
    expect(panel).not.toMatch(/\/api\/messenger\/channels/);
    expect(hook).not.toMatch(/\/api\/messenger\/channels/);
    expect(hook).not.toMatch(/\/api\/messenger\/dm/);
    expect(hook).not.toMatch(/tasksApi\.addDiscussion/);
  });
});
