import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class DriveR2Client {
  private readonly s3: S3Client | null;
  readonly bucket: string;
  readonly publicUrl: string;
  private readonly logger = new Logger(DriveR2Client.name);

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    this.bucket = this.config.get<string>('R2_BUCKET_NAME') ?? '';
    this.publicUrl = this.config.get<string>('R2_PUBLIC_URL') ?? '';

    if (!accountId) {
      this.logger.warn('R2 not configured — Drive module will return empty results');
      this.s3 = null;
      return;
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  ensureS3(): S3Client {
    if (!this.s3) throw new NotFoundException('Drive (R2) is not configured');
    return this.s3;
  }
}
