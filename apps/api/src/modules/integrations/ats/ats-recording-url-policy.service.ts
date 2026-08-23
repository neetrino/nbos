import { Injectable, Logger } from '@nestjs/common';
import { assertAtsRecordingResolvedIps } from './ats-recording-ip';
import { NodeAtsRecordingDnsResolver } from './ats-recording-dns';
import { assertAtsRecordingHostnameAllowed, parseAtsRecordingUrl } from './ats-recording-url';
import { AtsProviderConfig } from './ats-provider.config';

export interface AtsRecordingValidatedTarget {
  url: URL;
  hostname: string;
  pinnedAddresses: readonly string[];
}

@Injectable()
export class AtsRecordingUrlPolicy {
  private readonly logger = new Logger(AtsRecordingUrlPolicy.name);

  constructor(
    private readonly config: AtsProviderConfig,
    private readonly dns: NodeAtsRecordingDnsResolver,
  ) {}

  async validate(rawUrl: string, baseUrl?: URL): Promise<AtsRecordingValidatedTarget> {
    const url = this.parseOrReject(rawUrl, baseUrl);
    const hostname = url.hostname;
    try {
      assertAtsRecordingHostnameAllowed(hostname, this.config.recordingAllowedHosts);
    } catch (error) {
      this.logReject('hostname', hostname);
      throw error;
    }
    const pinnedAddresses = await this.resolvePublicAddresses(hostname);
    return { url, hostname, pinnedAddresses };
  }

  private parseOrReject(rawUrl: string, baseUrl?: URL): URL {
    try {
      return parseAtsRecordingUrl(rawUrl, baseUrl);
    } catch (error) {
      this.logReject(reasonFromReject(error), '');
      throw error;
    }
  }

  private async resolvePublicAddresses(hostname: string): Promise<readonly string[]> {
    let addresses: string[];
    try {
      addresses = await this.dns.resolveAll(hostname);
    } catch (error) {
      this.logReject(reasonFromReject(error), hostname);
      throw error;
    }
    try {
      assertAtsRecordingResolvedIps(addresses);
    } catch (error) {
      this.logReject('private_ip', hostname);
      throw error;
    }
    return addresses;
  }

  private logReject(reason: string, hostname: string): void {
    this.logger.warn({
      event: 'ats_recording_url_rejected',
      reason,
      hostname,
    });
  }
}

function reasonFromReject(error: unknown): string {
  if (!(error instanceof Error)) return 'malformed';
  const match = /\((?<reason>[a-z_]+)\)$/u.exec(error.message);
  return match?.groups?.reason ?? 'malformed';
}
