import { describe, expect, it } from 'vitest';
import { classifyProjectHubStatus } from './project-hub-status';

describe('classifyProjectHubStatus', () => {
  it('classifies trash first', () => {
    expect(
      classifyProjectHubStatus({
        trashedAt: new Date(),
        productCount: 0,
        extensionCount: 0,
        hasOpenDelivery: false,
        hasLiveMaintenance: false,
      }),
    ).toBe('trash');
  });

  it('classifies empty projects as incoming', () => {
    expect(
      classifyProjectHubStatus({
        trashedAt: null,
        productCount: 0,
        extensionCount: 0,
        hasOpenDelivery: false,
        hasLiveMaintenance: false,
      }),
    ).toBe('incoming');
  });

  it('classifies open delivery or live maintenance as active', () => {
    expect(
      classifyProjectHubStatus({
        trashedAt: null,
        productCount: 1,
        extensionCount: 0,
        hasOpenDelivery: true,
        hasLiveMaintenance: false,
      }),
    ).toBe('active');
    expect(
      classifyProjectHubStatus({
        trashedAt: null,
        productCount: 1,
        extensionCount: 0,
        hasOpenDelivery: false,
        hasLiveMaintenance: true,
      }),
    ).toBe('active');
  });

  it('classifies finished children without live maintenance as closed', () => {
    expect(
      classifyProjectHubStatus({
        trashedAt: null,
        productCount: 1,
        extensionCount: 0,
        hasOpenDelivery: false,
        hasLiveMaintenance: false,
      }),
    ).toBe('closed');
  });
});
