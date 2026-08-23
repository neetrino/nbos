import type { ArtifactObjectHead, DriveArtifactStorage } from './drive-artifact-operation.types';

export class InMemoryDriveArtifactStorage implements DriveArtifactStorage {
  private readonly objects = new Map<string, { body: Uint8Array; contentType: string }>();

  async putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
    this.objects.set(key, { body: new Uint8Array(body), contentType });
  }

  async headObject(key: string): Promise<ArtifactObjectHead | null> {
    const found = this.objects.get(key);
    if (!found) return null;
    return { contentLength: found.body.byteLength, contentType: found.contentType };
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  has(key: string): boolean {
    return this.objects.has(key);
  }

  size(): number {
    return this.objects.size;
  }
}
