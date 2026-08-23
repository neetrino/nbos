import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CALL_NOTE_MAX_LENGTH } from '../calls.constants';
import { UpdateCallNoteDto } from './update-call-note.dto';

async function validateBody(input: object) {
  return validate(plainToInstance(UpdateCallNoteDto, input));
}

function propertyErrors(errors: Awaited<ReturnType<typeof validate>>, property: string) {
  return errors.filter((error) => error.property === property);
}

describe('UpdateCallNoteDto', () => {
  it('requires note (null allowed) and rejects an omitted field', async () => {
    expect(await validateBody({ note: 'Follow up', expectedNoteVersion: 4 })).toEqual([]);
    expect(await validateBody({ note: null, expectedNoteVersion: 0 })).toEqual([]);
    expect(
      propertyErrors(await validateBody({ expectedNoteVersion: 0 }), 'note').length,
    ).toBeGreaterThan(0);
  });

  it('requires expectedNoteVersion and rejects negative, float, and string values', async () => {
    expect(
      propertyErrors(await validateBody({ note: 'x' }), 'expectedNoteVersion').length,
    ).toBeGreaterThan(0);
    expect(
      propertyErrors(await validateBody({ expectedNoteVersion: -1 }), 'expectedNoteVersion').length,
    ).toBeGreaterThan(0);
    expect(
      propertyErrors(await validateBody({ expectedNoteVersion: 4.5 }), 'expectedNoteVersion')
        .length,
    ).toBeGreaterThan(0);
    expect(
      propertyErrors(await validateBody({ expectedNoteVersion: '4' }), 'expectedNoteVersion')
        .length,
    ).toBeGreaterThan(0);
  });

  it('keeps the existing note max length', async () => {
    const tooLong = 'n'.repeat(CALL_NOTE_MAX_LENGTH + 1);
    expect(
      propertyErrors(await validateBody({ note: tooLong, expectedNoteVersion: 0 }), 'note').length,
    ).toBeGreaterThan(0);
    expect(
      await validateBody({ note: 'n'.repeat(CALL_NOTE_MAX_LENGTH), expectedNoteVersion: 0 }),
    ).toEqual([]);
  });
});
