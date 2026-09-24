import { describe, expect, it } from 'vitest';
import {
  buildMailSearchFilterConfigs,
  hasActiveMailSearchFilters,
  MAIL_SEARCH_FILTER_KEY,
  MAIL_SEARCH_FILTER_VALUE,
  mailSearchFilterListParams,
  mergeMailInboxListParams,
  resolveMailSearchFilterValues,
} from './mail-search-filters';

describe('mail search filters', () => {
  it('builds attribute filters without mailbox', () => {
    const configs = buildMailSearchFilterConfigs();
    expect(configs.map((config) => config.key)).toEqual([
      MAIL_SEARCH_FILTER_KEY.read,
      MAIL_SEARCH_FILTER_KEY.link,
      MAIL_SEARCH_FILTER_KEY.assigned,
      MAIL_SEARCH_FILTER_KEY.direction,
    ]);
  });

  it('resolves filter values from search state only', () => {
    expect(
      resolveMailSearchFilterValues({
        [MAIL_SEARCH_FILTER_KEY.read]: MAIL_SEARCH_FILTER_VALUE.unread,
      }),
    ).toEqual({
      [MAIL_SEARCH_FILTER_KEY.read]: MAIL_SEARCH_FILTER_VALUE.unread,
      [MAIL_SEARCH_FILTER_KEY.link]: MAIL_SEARCH_FILTER_VALUE.all,
      [MAIL_SEARCH_FILTER_KEY.assigned]: MAIL_SEARCH_FILTER_VALUE.all,
      [MAIL_SEARCH_FILTER_KEY.direction]: MAIL_SEARCH_FILTER_VALUE.all,
    });
  });

  it('treats only attribute filters as an active search query', () => {
    expect(hasActiveMailSearchFilters({})).toBe(false);
    expect(hasActiveMailSearchFilters({ [MAIL_SEARCH_FILTER_KEY.read]: 'all' })).toBe(false);
    expect(
      hasActiveMailSearchFilters({
        [MAIL_SEARCH_FILTER_KEY.link]: MAIL_SEARCH_FILTER_VALUE.needsLink,
      }),
    ).toBe(true);
  });

  it('maps attribute filters onto list query flags', () => {
    expect(
      mailSearchFilterListParams({
        [MAIL_SEARCH_FILTER_KEY.read]: MAIL_SEARCH_FILTER_VALUE.unread,
        [MAIL_SEARCH_FILTER_KEY.assigned]: MAIL_SEARCH_FILTER_VALUE.mine,
      }),
    ).toEqual({
      unreadOnly: true,
      assignedToMe: true,
    });
  });

  it('combines folder view flags with search filters', () => {
    expect(
      mergeMailInboxListParams(
        'unread',
        { [MAIL_SEARCH_FILTER_KEY.link]: MAIL_SEARCH_FILTER_VALUE.needsLink },
        'mb-1',
      ),
    ).toEqual({
      unreadOnly: true,
      needsLinkOnly: true,
      mailAccountId: 'mb-1',
    });
  });

  it('passes My mailbox ids for All-inbox', () => {
    expect(mergeMailInboxListParams('all', {}, null, ['a', 'b'])).toEqual({
      scope: 'active',
      mailAccountIds: ['a', 'b'],
    });
  });

  it('maps the Drafts folder to draftsOnly', () => {
    expect(mergeMailInboxListParams('drafts', {}, null)).toEqual({ draftsOnly: true });
  });
});
