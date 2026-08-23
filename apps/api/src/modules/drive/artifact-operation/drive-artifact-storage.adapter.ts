import { Injectable, NotFoundException } from '@nestjs/common';
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DriveR2Client } from '../drive-r2.client';
import type { ArtifactObjectHead, DriveArtifactStorage } from './drive-artifact-operation.types';

@Injectable()
export class DriveArtifactStorageAdapter implements DriveArtifactStorage {
  constructor(private readonly r2: DriveR2Client) {}

  async putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await this.r2.ensureS3().send(
      new PutObjectCommand({
        Bucket: this.r2.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async headObject(key: string): Promise<ArtifactObjectHead | null> {
    try {
      const head = await this.r2.ensureS3().send(
        new HeadObjectCommand({
          Bucket: this.r2.bucket,
          Key: key,
        }),
      );
      return {
        contentLength: typeof head.ContentLength === 'number' ? head.ContentLength : null,
        contentType: head.ContentType ?? null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      const name = error instanceof Error ? error.name : '';
      if (name === 'NotFound' || name === 'NoSuchKey' || name === 'NotFoundException') {
        return null;
      }
      const http = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (http === 404) return null;
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.r2.ensureS3().send(
      new DeleteObjectCommand({
        Bucket: this.r2.bucket,
        Key: key,
      }),
    );
  }
}
