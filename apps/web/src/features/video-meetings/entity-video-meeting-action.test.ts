import { afterEach, describe, expect, it } from 'vitest';
import { canShowEntityVideoMeetingAction } from './entity-video-meeting-action-gate';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('canShowEntityVideoMeetingAction', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED;
  });

  it('hides when feature flag is off (default)', () => {
    expect(
      canShowEntityVideoMeetingAction({
        featureFlagEnv: undefined,
        canAdd: true,
        canEdit: true,
      }),
    ).toBe(false);
  });

  it('hides when flag on but user lacks ADD/EDIT', () => {
    expect(
      canShowEntityVideoMeetingAction({
        featureFlagEnv: 'true',
        canAdd: false,
        canEdit: false,
      }),
    ).toBe(false);
  });

  it('shows when flag on and user has ADD or EDIT', () => {
    expect(
      canShowEntityVideoMeetingAction({
        featureFlagEnv: 'true',
        canAdd: true,
        canEdit: false,
      }),
    ).toBe(true);
    expect(
      canShowEntityVideoMeetingAction({
        featureFlagEnv: 'true',
        canAdd: false,
        canEdit: true,
      }),
    ).toBe(true);
  });
});

describe('EntityVideoMeetingAction wiring', () => {
  it('DealSheetQuickActions mounts EntityVideoMeetingAction', () => {
    const source = readFileSync(join(here, '../crm/components/DealSheetQuickActions.tsx'), 'utf8');
    expect(source).toContain('EntityVideoMeetingAction');
    expect(source).toContain('entityType="DEAL"');
  });

  it('Contact / Project / Product surfaces mount EntityVideoMeetingAction', () => {
    const contact = readFileSync(
      join(here, '../clients/components/ContactSheetHeaderActions.tsx'),
      'utf8',
    );
    const project = readFileSync(
      join(here, '../projects/hooks/use-project-detail-header.tsx'),
      'utf8',
    );
    const product = readFileSync(
      join(here, '../projects/components/ProductDetailHeader.tsx'),
      'utf8',
    );
    expect(contact).toContain('EntityVideoMeetingAction');
    expect(project).toContain('EntityVideoMeetingAction');
    expect(product).toContain('EntityVideoMeetingAction');
  });
});
