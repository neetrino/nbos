import { Injectable } from '@nestjs/common';
import { MetaGraphClient } from './meta-graph.client';
import { MetaInstagramGraphClient } from './meta-instagram-graph.client';
import {
  identityToProfile,
  profileToIdentityFields,
  type MetaLeadPlatform,
} from './meta-lead-display';
import { META_PROFILE_CACHE_MS, usesInstagramLoginGraph } from './meta-lead-ingest.helpers';
import type {
  MetaMessagingUserProfile,
  MetaProfileFetchStatus,
  MetaProfileLookupResult,
} from './meta-messaging-profile.types';
import {
  META_PROFILE_FETCH_STATUS_FAILED,
  META_PROFILE_FETCH_STATUS_OK,
  META_PROFILE_FETCH_STATUS_SKIPPED,
} from './meta-messaging-profile.types';
import { MetaProviderConfig } from './meta-provider.config';
import { MetaProviderSecretStore } from './meta-provider-secret.store';

export interface MetaConnectedAccountForProfile {
  id: string;
  platform: MetaLeadPlatform;
  scopes: unknown;
}

export interface MetaSenderIdentityProfileState {
  displayName: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  profileFetchedAt: Date | null;
  profileFetchStatus: string | null;
  lastProfileFetchError: string | null;
}

export interface ResolvedSenderProfile {
  profile: MetaMessagingUserProfile;
  profileFetchedAt: Date | null;
  profileFetchStatus: MetaProfileFetchStatus;
  lastProfileFetchError: string | null;
  identityPatch: ReturnType<typeof profileToIdentityFields>;
  fetchedNow: boolean;
}

@Injectable()
export class MetaProfileService {
  constructor(
    private readonly config: MetaProviderConfig,
    private readonly secretStore: MetaProviderSecretStore,
  ) {}

  async resolveSenderProfile(
    account: MetaConnectedAccountForProfile,
    senderScopedId: string,
    existing: MetaSenderIdentityProfileState | null,
  ): Promise<ResolvedSenderProfile> {
    const cachedProfile = existing ? identityToProfile(existing) : emptyProfile();
    const cacheFresh =
      existing?.profileFetchedAt !== null &&
      existing?.profileFetchedAt !== undefined &&
      existing.profileFetchStatus === META_PROFILE_FETCH_STATUS_OK &&
      Date.now() - existing.profileFetchedAt.getTime() < META_PROFILE_CACHE_MS;

    if (cacheFresh) {
      return {
        profile: cachedProfile,
        profileFetchedAt: existing?.profileFetchedAt ?? null,
        profileFetchStatus: META_PROFILE_FETCH_STATUS_SKIPPED,
        lastProfileFetchError: existing?.lastProfileFetchError ?? null,
        identityPatch: profileToIdentityFields(cachedProfile),
        fetchedNow: false,
      };
    }

    const lookup = await this.lookupMessagingProfile(account, senderScopedId);
    if (lookup.ok) {
      const patch = profileToIdentityFields(lookup.profile);
      return {
        profile: lookup.profile,
        profileFetchedAt: new Date(),
        profileFetchStatus: META_PROFILE_FETCH_STATUS_OK,
        lastProfileFetchError: null,
        identityPatch: patch,
        fetchedNow: true,
      };
    }

    return {
      profile: cachedProfile,
      profileFetchedAt: existing?.profileFetchedAt ?? new Date(),
      profileFetchStatus: META_PROFILE_FETCH_STATUS_FAILED,
      lastProfileFetchError: `${lookup.errorCode}: ${lookup.errorMessage}`,
      identityPatch: profileToIdentityFields(cachedProfile),
      fetchedNow: true,
    };
  }

  private async lookupMessagingProfile(
    account: MetaConnectedAccountForProfile,
    senderScopedId: string,
  ): Promise<MetaProfileLookupResult> {
    const secret = await this.secretStore.read(account.id);
    if (!secret?.pageAccessToken) {
      return {
        ok: false,
        errorCode: 'token_unavailable',
        errorMessage: 'Provider token is not available',
      };
    }

    if (account.platform === 'FACEBOOK') {
      return this.createFacebookGraphClient().fetchMessagingUserProfile(
        senderScopedId,
        secret.pageAccessToken,
      );
    }

    if (usesInstagramLoginGraph(account.scopes)) {
      return this.createInstagramGraphClient().fetchMessagingUserProfile(
        senderScopedId,
        secret.pageAccessToken,
      );
    }

    return this.createFacebookGraphClient().fetchMessagingUserProfile(
      senderScopedId,
      secret.pageAccessToken,
    );
  }

  private createFacebookGraphClient(): MetaGraphClient {
    return new MetaGraphClient(this.config.graphBaseUrl, this.config.appId, this.config.appSecret);
  }

  private createInstagramGraphClient(): MetaInstagramGraphClient {
    return new MetaInstagramGraphClient(
      this.config.instagramGraphBaseUrl,
      this.config.instagramAppId,
      this.config.instagramAppSecret,
    );
  }
}

function emptyProfile(): MetaMessagingUserProfile {
  return {
    displayName: null,
    username: null,
    firstName: null,
    lastName: null,
    profilePictureUrl: null,
  };
}
