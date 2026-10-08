import { afterEach, describe, expect, it } from 'vitest';
import { admitSchedulerExecution, planOccurrenceReconcile } from './scheduler-occurrence.policy';
import { schedulerExecutionJobId } from './scheduler-occurrence.constants';
import { resolveSchedulerSlot } from './scheduler-slot';

describe('scheduler occurrence policy', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it('keeps the 11:00 Yerevan slot when the host timezone changes', () => {
    process.env.TZ = 'UTC';
    const onTime = resolveSchedulerSlot('0 11 * * *', new Date('2026-10-07T07:00:30.000Z'));
    process.env.TZ = 'America/Los_Angeles';
    const late = resolveSchedulerSlot('0 11 * * *', new Date('2026-10-07T07:20:00.000Z'));
    expect(onTime.toISOString()).toBe('2026-10-07T07:00:00.000Z');
    expect(late.toISOString()).toBe(onTime.toISOString());
  });

  it('waits in the durable lane when both concurrency slots are busy', () => {
    const waiting = ['billing', 'overdue-invoices'];
    let running = 2;
    const parked: string[] = [];
    const invoice = 'invoice-card-reminders';
    if (admitSchedulerExecution(running, 2) === 'wait') parked.push(invoice);
    else waiting.push(invoice);
    expect(parked).toEqual(['invoice-card-reminders']);
    running = 1;
    expect(admitSchedulerExecution(running, 2)).toBe('start');
  });

  it('re-enqueues a persisted occurrence whose Redis job is missing', () => {
    expect(
      planOccurrenceReconcile({ status: 'PENDING', queueState: 'missing', runningStale: false }),
    ).toBe('enqueue');
    expect(
      planOccurrenceReconcile({ status: 'QUEUED', queueState: 'waiting', runningStale: false }),
    ).toBe('wait');
    expect(
      planOccurrenceReconcile({ status: 'RUNNING', queueState: 'missing', runningStale: true }),
    ).toBe('reset_enqueue');
    expect(
      planOccurrenceReconcile({ status: 'SUCCEEDED', queueState: 'missing', runningStale: false }),
    ).toBe('noop');
  });

  it('uses one BullMQ id for the same job and slot', () => {
    const slot = new Date('2026-10-07T07:00:00.000Z');
    expect(schedulerExecutionJobId('invoice-card-reminders', slot)).toBe(
      schedulerExecutionJobId('invoice-card-reminders', new Date(slot.toISOString())),
    );
  });
});
