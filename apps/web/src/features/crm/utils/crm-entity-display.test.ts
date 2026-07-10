import { describe, expect, it } from 'vitest';
import {
  getLeadCardMetaLabel,
  getLeadDisplayTitle,
  getLeadLatestMessagePreview,
} from './crm-entity-display';
import type { Lead } from '@/lib/api/leads';

const instagramLead: Lead = {
  id: 'lead-1',
  code: 'L-2026-0001',
  name: 'Karo Gabrielyan',
  contactName: '@karo_gabrielyan',
  phone: null,
  email: null,
  source: 'MARKETING',
  sourceDetail: 'SMM',
  sourcePartnerId: null,
  sourceContactId: null,
  marketingAccountId: 'ma-1',
  marketingActivityId: null,
  status: 'NEW',
  assignedTo: null,
  contactId: null,
  notes: null,
  createdAt: '2026-07-10T10:00:00.000Z',
  updatedAt: '2026-07-10T10:00:00.000Z',
  assignee: null,
  sourcePartner: null,
  sourceContact: null,
  marketingAccount: { id: 'ma-1', name: 'Neetrino IT Company', channel: 'SMM', phone: null },
  marketingActivity: null,
  deal: null,
  metaConversation: {
    platform: 'INSTAGRAM',
    displayName: 'Karo Gabrielyan',
    username: 'karo_gabrielyan',
    firstName: null,
    lastName: null,
    profilePictureUrl: null,
    latestMessagePreview: 'Здравствуйте, хочу заказать сайт',
    lastMessageAt: '2026-07-10T10:00:00.000Z',
  },
};

describe('crm-entity-display meta leads', () => {
  it('shows Instagram display name and username', () => {
    expect(getLeadDisplayTitle(instagramLead)).toBe('Karo Gabrielyan');
    expect(getLeadCardMetaLabel(instagramLead)).toBe('@karo_gabrielyan');
  });

  it('shows latest message preview', () => {
    expect(getLeadLatestMessagePreview(instagramLead)).toBe('Здравствуйте, хочу заказать сайт');
  });

  it('falls back for Facebook generic lead', () => {
    const lead: Lead = {
      ...instagramLead,
      name: 'Facebook user',
      contactName: 'Facebook user',
      metaConversation: {
        platform: 'FACEBOOK',
        displayName: 'Karo Gabrielyan',
        username: null,
        firstName: 'Karo',
        lastName: 'Gabrielyan',
        profilePictureUrl: null,
        latestMessagePreview: 'Здравствуйте',
        lastMessageAt: '2026-07-10T10:00:00.000Z',
      },
    };
    expect(getLeadDisplayTitle(lead)).toBe('Karo Gabrielyan');
    expect(getLeadCardMetaLabel(lead)).toBe('Facebook Messenger');
  });

  it('leaves non-meta leads unchanged', () => {
    const lead = { ...instagramLead, metaConversation: null };
    expect(getLeadDisplayTitle(lead)).toBe('Karo Gabrielyan');
  });
});
