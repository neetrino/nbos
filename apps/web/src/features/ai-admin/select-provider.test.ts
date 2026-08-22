import { describe, expect, it } from 'vitest';
import { draftValidateProvider, draftValidateRequest } from './select-provider';

describe('draftValidateProvider', () => {
  it('uses the stored connection provider when rotating', () => {
    expect(
      draftValidateProvider({
        mode: 'rotate',
        selected: 'OPENAI',
        connectionProvider: 'ANTHROPIC',
      }),
    ).toBe('ANTHROPIC');
  });

  it('refuses rotate without the stored connection provider', () => {
    expect(() =>
      draftValidateProvider({
        mode: 'rotate',
        selected: 'OPENAI',
      }),
    ).toThrow(/stored connection provider/);
  });

  it('includes the stored custom baseUrl when rotating', () => {
    expect(
      draftValidateRequest({
        mode: 'rotate',
        selected: 'OPENAI',
        apiKey: 'sk-ant-replacement-key-value',
        connectionProvider: 'ANTHROPIC',
        connectionBaseUrl: 'https://anthropic.example.test',
      }),
    ).toEqual({
      provider: 'ANTHROPIC',
      apiKey: 'sk-ant-replacement-key-value',
      baseUrl: 'https://anthropic.example.test',
    });
  });

  it('uses the selected provider when creating', () => {
    expect(
      draftValidateProvider({
        mode: 'create',
        selected: 'ANTHROPIC',
      }),
    ).toBe('ANTHROPIC');
  });
});
