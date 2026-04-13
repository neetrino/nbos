import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  type _Object,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface FileEntry {
  key: string;
  name: string;
  size: number;
  lastModified: Date | undefined;
  isFolder: boolean;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  files: FileEntry[];
}

const PRESIGNED_URL_EXPIRY_SECONDS = 3600;

@Injectable()
export class DriveService {
  private readonly s3: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly logger = new Logger(DriveService.name);

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

  private ensureS3(): S3Client {
    if (!this.s3) throw new NotFoundException('Drive (R2) is not configured');
    return this.s3;
  }

  async listFiles(projectId: string, prefix?: string): Promise<FileEntry[]> {
    const fullPrefix = this.buildPrefix(projectId, prefix);

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: fullPrefix,
      Delimiter: '/',
    });

    const response = await this.ensureS3().send(command);
    const files: FileEntry[] = [];

    for (const folder of response.CommonPrefixes ?? []) {
      if (!folder.Prefix) continue;
      files.push({
        key: folder.Prefix,
        name: this.extractName(folder.Prefix, true),
        size: 0,
        lastModified: undefined,
        isFolder: true,
      });
    }

    for (const obj of response.Contents ?? []) {
      if (!obj.Key || obj.Key === fullPrefix) continue;
      files.push(this.mapS3Object(obj));
    }

    return files;
  }

  async getUploadUrl(
    projectId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const key = `${DriveService.R2_DRIVE_PREFIX}projects/${projectId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.ensureS3(), command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    return {
      uploadUrl,
      key,
      publicUrl: this.publicUrl ? `${this.publicUrl}/${key}` : '',
    };
  }

  async getDownloadUrl(projectId: string, filePath: string): Promise<{ downloadUrl: string }> {
    const key = this.resolveKey(projectId, filePath);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(this.ensureS3(), command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    return { downloadUrl };
  }

  async deleteFile(projectId: string, filePath: string): Promise<void> {
    const key = this.resolveKey(projectId, filePath);

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.ensureS3().send(command);
    this.logger.log(`Deleted file: ${key}`);
  }

  async getProjectStructure(projectId: string): Promise<FolderNode> {
    const prefix = `${DriveService.R2_DRIVE_PREFIX}projects/${projectId}/`;

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.ensureS3().send(command);
    const root: FolderNode = { name: projectId, path: prefix, children: [], files: [] };

    for (const obj of response.Contents ?? []) {
      if (!obj.Key) continue;
      const relativePath = obj.Key.slice(prefix.length);
      this.insertIntoTree(root, relativePath, obj);
    }

    return root;
  }

  /** Base prefix in R2: all Drive files live under Drive/projects/{projectId}/ */
  private static readonly R2_DRIVE_PREFIX = 'Drive/';

  private buildPrefix(projectId: string, prefix?: string): string {
    const base = `${DriveService.R2_DRIVE_PREFIX}projects/${projectId}/`;
    return prefix ? `${base}${prefix}` : base;
  }

  private resolveKey(projectId: string, filePath: string): string {
    const withProject = `projects/${projectId}/`;
    const fullPrefix = `${DriveService.R2_DRIVE_PREFIX}${withProject}`;
    if (filePath.startsWith(fullPrefix)) return filePath;
    if (filePath.startsWith(withProject)) return DriveService.R2_DRIVE_PREFIX + filePath;
    return `${fullPrefix}${filePath}`;
  }

  private extractName(key: string, isFolder: boolean): string {
    const trimmed = isFolder ? key.slice(0, -1) : key;
    return trimmed.split('/').pop() ?? trimmed;
  }

  private mapS3Object(obj: _Object): FileEntry {
    return {
      key: obj.Key!,
      name: this.extractName(obj.Key!, false),
      size: obj.Size ?? 0,
      lastModified: obj.LastModified,
      isFolder: false,
    };
  }

  private insertIntoTree(root: FolderNode, relativePath: string, obj: _Object): void {
    const parts = relativePath.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      let child = current.children.find((c) => c.name === parts[i]);
      if (!child) {
        child = {
          name: parts[i]!,
          path: `${current.path}${parts[i]}/`,
          children: [],
          files: [],
        };
        current.children.push(child);
      }
      current = child;
    }

    current.files.push(this.mapS3Object(obj));
  }
}
