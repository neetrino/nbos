import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import enDeliveryBoard from '@/messages/en/delivery-board.json';
import ruDeliveryBoard from '@/messages/ru/delivery-board.json';
import {
  DELIVERY_STATUS_FILTER_MESSAGE_KEYS,
  translateDeliveryHoldCopy,
  translateDeliveryHoldStatusLabel,
  translateDeliveryLifecycleLabel,
  translateDeliveryStatusFilter,
  translateLifecycleActionDialogCopy,
  type DeliveryBoardTranslate,
} from './delivery-board-message-keys';

const PAST_HOLD = '2020-01-01T00:00:00.000Z';
const FUTURE_HOLD = '2099-01-01T00:00:00.000Z';

function createDeliveryBoardT(locale: 'en' | 'ru'): DeliveryBoardTranslate {
  return createTranslator({
    locale,
    messages: { deliveryBoard: locale === 'en' ? enDeliveryBoard : ruDeliveryBoard },
    namespace: 'deliveryBoard',
  });
}

describe('translateDeliveryLifecycleLabel', () => {
  it('keeps VALUE codes and translates chrome in EN/RU', () => {
    const en = createDeliveryBoardT('en');
    const ru = createDeliveryBoardT('ru');
    const done = {
      stage: 'TRANSFER',
      workStatus: 'IN_PROGRESS',
      resolution: 'DONE',
    };
    const cancelled = {
      stage: 'QA',
      workStatus: 'IN_PROGRESS',
      resolution: 'CANCELLED',
    };
    const startingHold = {
      stage: 'STARTING',
      workStatus: 'ON_HOLD',
      resolution: null,
      onHoldUntil: FUTURE_HOLD,
    };
    const expired = {
      stage: 'DEVELOPMENT',
      workStatus: 'ON_HOLD',
      resolution: null,
      onHoldUntil: PAST_HOLD,
    };
    const unstaged = {
      stage: null,
      workStatus: 'IN_PROGRESS',
      resolution: null,
    };

    expect(translateDeliveryLifecycleLabel(done, en)).toBe('Done');
    expect(translateDeliveryLifecycleLabel(done, ru)).toBe('Готово');
    expect(translateDeliveryLifecycleLabel(cancelled, en)).toBe('Cancelled');
    expect(translateDeliveryLifecycleLabel(cancelled, ru)).toBe('Отменено');
    expect(translateDeliveryLifecycleLabel(startingHold, en)).toBe('Starting · On Hold');
    expect(translateDeliveryLifecycleLabel(startingHold, ru)).toBe('Запуск · на паузе');
    expect(translateDeliveryLifecycleLabel(expired, en)).toBe('Development · Hold expired');
    expect(translateDeliveryLifecycleLabel(expired, ru)).toBe('Разработка · пауза истекла');
    expect(translateDeliveryLifecycleLabel(unstaged, en)).toBe('Not staged');
    expect(translateDeliveryLifecycleLabel(unstaged, ru)).toBe('Без этапа');
    expect(startingHold.workStatus).toBe('ON_HOLD');
    expect(done.resolution).toBe('DONE');
  });
});

describe('translateDeliveryHoldCopy', () => {
  it('interpolates dates as user data and translates chrome', () => {
    const en = createDeliveryBoardT('en');
    const ru = createDeliveryBoardT('ru');
    const hold = {
      workStatus: 'ON_HOLD',
      resolution: null,
      onHoldUntil: FUTURE_HOLD,
    };
    const expired = {
      workStatus: 'ON_HOLD',
      resolution: null,
      onHoldUntil: PAST_HOLD,
    };

    expect(translateDeliveryHoldCopy(hold, '12 Sep 2026', en)).toBe('On hold until 12 Sep 2026');
    expect(translateDeliveryHoldCopy(hold, '12 Sep 2026', ru)).toBe('На паузе до 12 Sep 2026');
    expect(translateDeliveryHoldCopy(expired, '1 Jan 2020', en)).toBe('Hold expired on 1 Jan 2020');
    expect(translateDeliveryHoldCopy(expired, '1 Jan 2020', ru)).toBe('Пауза истекла 1 Jan 2020');
    expect(translateDeliveryHoldCopy(hold, null, en)).toBe('On Hold');
    expect(translateDeliveryHoldCopy({ workStatus: 'IN_PROGRESS', resolution: null }, null, en)).toBe(
      null,
    );
  });
});

describe('translateDeliveryHoldStatusLabel', () => {
  it('returns hold chrome without changing workStatus codes', () => {
    const en = createDeliveryBoardT('en');
    const ru = createDeliveryBoardT('ru');
    const hold = { workStatus: 'ON_HOLD', resolution: null, onHoldUntil: FUTURE_HOLD };
    const expired = { workStatus: 'ON_HOLD', resolution: null, onHoldUntil: PAST_HOLD };

    expect(translateDeliveryHoldStatusLabel(hold, en)).toBe('On Hold');
    expect(translateDeliveryHoldStatusLabel(hold, ru)).toBe('На паузе');
    expect(translateDeliveryHoldStatusLabel(expired, en)).toBe('Hold expired');
    expect(translateDeliveryHoldStatusLabel(expired, ru)).toBe('Пауза истекла');
    expect(hold.workStatus).toBe('ON_HOLD');
  });
});

describe('translateLifecycleActionDialogCopy', () => {
  it('keeps entity names as user data', () => {
    const en = createDeliveryBoardT('en');
    const ru = createDeliveryBoardT('ru');
    const enPause = translateLifecycleActionDialogCopy('pause', 'Acme Site', false, en);
    const ruCancel = translateLifecycleActionDialogCopy('cancel', 'Acme Site', true, ru);

    expect(enPause.title).toBe('Pause delivery?');
    expect(enPause.description).toBe('Pause Acme Site and set the expected resume date.');
    expect(enPause.submitLabel).toBe('Pause delivery');
    expect(ruCancel.title).toBe('Отменить поставку?');
    expect(ruCancel.description).toBe('Отменить Acme Site с обязательной причиной.');
    expect(ruCancel.submitLabel).toBe('Отмена…');
  });
});

describe('delivery status filter keys', () => {
  it('maps VALUE codes to existing catalog keys', () => {
    expect(DELIVERY_STATUS_FILTER_MESSAGE_KEYS).toEqual({
      ACTIVE: 'pipelineTabs.active',
      ON_HOLD: 'lifecycle.onHold',
      CLOSED: 'pipelineTabs.closed',
      ALL: 'kind.all',
    });
    const en = createDeliveryBoardT('en');
    const ru = createDeliveryBoardT('ru');
    expect(translateDeliveryStatusFilter('ACTIVE', en)).toBe('Active');
    expect(translateDeliveryStatusFilter('ON_HOLD', en)).toBe('On Hold');
    expect(translateDeliveryStatusFilter('CLOSED', en)).toBe('Closed');
    expect(translateDeliveryStatusFilter('ACTIVE', ru)).toBe('Активные');
    expect(translateDeliveryStatusFilter('ON_HOLD', ru)).toBe('На паузе');
    expect(translateDeliveryStatusFilter('CLOSED', ru)).toBe('Закрытые');
  });

  it('formats header counts with Russian ICU 0/1/2/5/11/21', () => {
    const ru = createDeliveryBoardT('ru');
    const samples = [
      [0, '0 активных'],
      [1, '1 активная'],
      [2, '2 активные'],
      [5, '5 активных'],
      [11, '11 активных'],
      [21, '21 активная'],
    ] as const;

    for (const [count, expected] of samples) {
      expect(ru('counts.active', { count })).toBe(expected);
    }
  });
});
