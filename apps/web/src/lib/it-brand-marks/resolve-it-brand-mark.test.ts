import { describe, expect, it } from 'vitest';
import { resolveItBrandMark, resolveItBrandMarkFromHints } from './resolve-it-brand-mark';

describe('resolveItBrandMark', () => {
  it('matches GitHub from hostname even when the label is generic', () => {
    const mark = resolveItBrandMark('https://github.com/nbos/app', 'git');
    expect(mark?.slug).toBe('github');
  });

  it('matches the Git logo from a git label when the host is unknown', () => {
    const mark = resolveItBrandMark('https://git.internal.company', 'git');
    expect(mark?.slug).toBe('git');
  });

  it('prefers a more specific Google host over google.com', () => {
    expect(resolveItBrandMark('https://docs.google.com/document/d/1', 'docs')?.slug).toBe(
      'googledocs',
    );
  });

  it('accepts bare hosts without a protocol', () => {
    expect(resolveItBrandMark('figma.com/file/abc', 'design')?.slug).toBe('figma');
  });

  it('uses the Slack local mark for slack.com', () => {
    expect(resolveItBrandMark('https://app.slack.com/client', 'slack')?.slug).toBe('slack');
    expect(resolveItBrandMark('https://app.slack.com/client', 'slack')?.hex).toBe('4A154B');
  });

  it('returns null for internal NBOS paths', () => {
    expect(resolveItBrandMark('/tasks', 'My tasks')).toBeNull();
  });

  it('matches AWS, Adobe and OpenAI from credential-style names', () => {
    expect(resolveItBrandMark('', 'AWS')?.slug).toBe('amazonaws');
    expect(resolveItBrandMark('', 'Adobe')?.slug).toBe('adobe');
    expect(resolveItBrandMark('', 'OPENAI')?.slug).toBe('openai');
    expect(resolveItBrandMark('', 'ChatGPT')?.slug).toBe('openai');
    expect(resolveItBrandMark('', 'ANTHROPIC')?.slug).toBe('anthropic');
  });

  it('matches a Gmail token in the name even when the first word is unrelated', () => {
    expect(resolveItBrandMark('', 'Busines Gmail')?.slug).toBe('gmail');
  });

  it('matches Gmail from an email login host', () => {
    expect(resolveItBrandMark('edgarneet1@gmail.com', 'Android App testing')?.slug).toBe('gmail');
  });

  it('matches Hetzner from a bare host-style name', () => {
    expect(resolveItBrandMark('', 'hetzner.com')?.slug).toBe('hetzner');
  });

  it('matches Beget, Timeweb and Selectel from provider names', () => {
    expect(resolveItBrandMark('', 'Beget')?.slug).toBe('beget');
    expect(resolveItBrandMark('https://beget.com', 'panel')?.slug).toBe('beget');
    expect(resolveItBrandMark('', 'Timeweb')?.slug).toBe('timeweb');
    expect(resolveItBrandMark('', 'Selectel')?.slug).toBe('selectel');
  });

  it('uses the short Yandex Y for Yandex Mail and Yandex Cloud', () => {
    expect(resolveItBrandMark('', 'Yandex')?.slug).toBe('yandex');
    expect(resolveItBrandMark('', 'Yandex Mail')?.slug).toBe('yandex');
    expect(resolveItBrandMark('https://mail.yandex.ru', 'Inbox')?.slug).toBe('yandex');
    expect(resolveItBrandMark('https://yandex.cloud', 'Cloud')?.slug).toBe('yandex');
  });

  it('matches remaining regional registrar and mail marks', () => {
    expect(resolveItBrandMark('', 'Name.am')?.slug).toBe('nameam');
    expect(resolveItBrandMark('', 'HayHost')?.slug).toBe('hayhost');
    expect(resolveItBrandMark('', 'REG.AM')?.slug).toBe('regam');
    expect(resolveItBrandMark('https://www.reg.ru', 'domains')?.slug).toBe('regru');
    expect(resolveItBrandMark('', 'Mail.ru')?.slug).toBe('mailru');
    expect(resolveItBrandMark('', 'SendGrid')?.slug).toBe('sendgrid');
    expect(resolveItBrandMark('', 'Amnic')?.slug).toBe('amnic');
    expect(resolveItBrandMark('https://www.amnic.net', 'registry')?.slug).toBe('amnic');
    expect(resolveItBrandMark('', 'Ucom')?.slug).toBe('ucom');
    expect(resolveItBrandMark('https://www.ucom.am', 'cabinet')?.slug).toBe('ucom');
    expect(resolveItBrandMark('', 'Viva')?.slug).toBe('viva');
    expect(resolveItBrandMark('', 'Viva Armenia')?.slug).toBe('viva');
    expect(resolveItBrandMark('https://www.viva.am', 'mobile')?.slug).toBe('viva');
  });

  it('matches a provider-style name by a later token', () => {
    expect(resolveItBrandMark('', 'Google Workspace')?.slug).toBe('google');
  });

  it('matches WhatsApp, Facebook and Instagram brand marks', () => {
    expect(resolveItBrandMark('', 'WhatsApp')?.slug).toBe('whatsapp');
    expect(resolveItBrandMark('https://facebook.com', '')?.slug).toBe('facebook');
    expect(resolveItBrandMark('', 'Instagram')?.slug).toBe('instagram');
    expect(resolveItBrandMark('', 'Google Contacts')?.slug).toBe('google');
  });
});

describe('resolveItBrandMarkFromHints', () => {
  it('uses the provider name when the URL is unknown', () => {
    const mark = resolveItBrandMarkFromHints('https://login.internal', 'Slack', 'Work chat');
    expect(mark?.slug).toBe('slack');
  });

  it('matches OpenAI from ChatGPT and Anthropic from Claude hosts', () => {
    expect(resolveItBrandMarkFromHints('https://chatgpt.com', 'Chat')?.slug).toBe('openai');
    expect(resolveItBrandMarkFromHints('claude.ai', 'Assistant')?.slug).toBe('claude');
  });

  it('uses a Gmail name before a corporate login domain', () => {
    expect(
      resolveItBrandMarkFromHints(null, null, 'Busines Gmail', 'info@qtm-group.com')?.slug,
    ).toBe('gmail');
  });

  it('uses a Gmail login when the credential name is generic', () => {
    expect(resolveItBrandMarkFromHints(null, null, 'NBOS', 'neetrinoagency@gmail.com')?.slug).toBe(
      'gmail',
    );
  });
});
