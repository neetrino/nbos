import { describe, expect, it } from 'vitest';
import {
  isUsableUniqueLegacyWorkDestination,
  loadWorkTransportChatId,
  resolveWorkTransportChatId,
} from './product-communication-legacy-destination';
import {
  createSlice9RuntimeStore,
  SLICE9_ACCOUNTANT,
} from '../../integrations/whatsapp-gateway/product-whatsapp-runtime.store';

const ACCOUNTANT = '120363000000000000@g.us';
const GROUP_1 = '120363111111111111@g.us';
const GROUP_B = '120363222222222222@g.us';

describe('FINDING-S9-04 unique-legacy destination rule', () => {
  it('is usable only when unique-legacy matches resolver WORK and is not accountant', () => {
    expect(
      isUsableUniqueLegacyWorkDestination({
        status: 'ACTIVE',
        groupChatId: GROUP_1,
        workGroupChatId: GROUP_1,
        accountantGroupChatId: ACCOUNTANT,
      }),
    ).toBe(true);
    expect(
      isUsableUniqueLegacyWorkDestination({
        status: 'ACTIVE',
        groupChatId: ACCOUNTANT,
        workGroupChatId: null,
        accountantGroupChatId: ACCOUNTANT,
      }),
    ).toBe(false);
    expect(
      isUsableUniqueLegacyWorkDestination({
        status: 'ACTIVE',
        groupChatId: GROUP_B,
        workGroupChatId: GROUP_1,
        accountantGroupChatId: ACCOUNTANT,
      }),
    ).toBe(false);
  });

  it('transport JID is resolver WORK only', () => {
    expect(resolveWorkTransportChatId(GROUP_1, ACCOUNTANT)).toBe(GROUP_1);
    expect(resolveWorkTransportChatId(null, ACCOUNTANT)).toBeNull();
    expect(resolveWorkTransportChatId(ACCOUNTANT, ACCOUNTANT)).toBeNull();
  });

  it('accountant unique-legacy without WORK is not a transport destination', async () => {
    const store = createSlice9RuntimeStore();
    store.seedLegacyActive('p-a', SLICE9_ACCOUNTANT, 'Accountant');
    const chatId = await loadWorkTransportChatId(store.prisma as never, 'p-a');
    expect(chatId).toBeNull();
    expect(chatId).not.toBe(SLICE9_ACCOUNTANT);
  });
});
