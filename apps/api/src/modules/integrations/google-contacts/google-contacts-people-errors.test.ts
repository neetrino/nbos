import { describe, expect, it } from 'vitest';
import {
  isGooglePeopleEtagConflict,
  isGooglePeopleNotFound,
} from './google-contacts-people-errors';

describe('google-contacts-people-errors', () => {
  it('detects People API not found', () => {
    expect(isGooglePeopleNotFound({ response: { status: 404 } })).toBe(true);
    expect(isGooglePeopleNotFound({ code: 404 })).toBe(true);
  });

  it('detects etag / precondition conflicts', () => {
    expect(isGooglePeopleEtagConflict({ response: { status: 412 } })).toBe(true);
    expect(isGooglePeopleEtagConflict({ response: { status: 409 } })).toBe(true);
    expect(isGooglePeopleEtagConflict(new Error('ETag mismatch'))).toBe(true);
  });
});
