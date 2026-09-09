/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { resolvePageHeroCreateButton } from './resolve-page-hero-create-button';

function hostWith(html: string): HTMLDivElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('resolvePageHeroCreateButton', () => {
  it('prefers an explicit dock create mark', () => {
    const root = hostWith(
      '<button aria-label="New Lead">New Lead</button><button data-mobile-dock-create="true">Marked</button>',
    );
    expect(resolvePageHeroCreateButton(root)?.textContent).toBe('Marked');
  });

  it('picks a New / Create action and ignores settings', () => {
    const root = hostWith(
      '<button aria-label="Leads settings">Settings</button><button>New Lead</button>',
    );
    expect(resolvePageHeroCreateButton(root)?.textContent).toBe('New Lead');
  });

  it('returns null when trailing has no create action', () => {
    const root = hostWith('<button aria-label="Leads settings">Settings</button>');
    expect(resolvePageHeroCreateButton(root)).toBeNull();
  });
});
