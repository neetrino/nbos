'use client';

import { createElement, type SVGProps } from 'react';
import {
  credentialAccessIcon,
  credentialCategoryIcon,
  credentialCriticalityIcon,
  credentialTypeIcon,
} from '@/features/credentials/utils/credential-vault-card-meta';

type CredentialMetaIconProps = SVGProps<SVGSVGElement> & {
  category: string;
};

type CredentialAccessIconProps = SVGProps<SVGSVGElement> & {
  accessLevel: string;
};

type CredentialCriticalityIconProps = SVGProps<SVGSVGElement> & {
  criticality: string;
};

type CredentialTypeIconProps = SVGProps<SVGSVGElement> & {
  credentialType: string;
};

/** Renders a category icon without dynamic JSX component references. */
export function CredentialCategoryIcon({ category, ...props }: CredentialMetaIconProps) {
  return createElement(credentialCategoryIcon(category), props);
}

/** Renders an access-level icon without dynamic JSX component references. */
export function CredentialAccessIcon({ accessLevel, ...props }: CredentialAccessIconProps) {
  return createElement(credentialAccessIcon(accessLevel), props);
}

/** Renders a criticality icon without dynamic JSX component references. */
export function CredentialCriticalityIcon({
  criticality,
  ...props
}: CredentialCriticalityIconProps) {
  return createElement(credentialCriticalityIcon(criticality), props);
}

/** Renders a credential-type icon without dynamic JSX component references. */
export function CredentialTypeIcon({ credentialType, ...props }: CredentialTypeIconProps) {
  return createElement(credentialTypeIcon(credentialType), props);
}
