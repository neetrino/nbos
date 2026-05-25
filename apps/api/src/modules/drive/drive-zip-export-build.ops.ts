import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import { finished } from 'node:stream/promises';

export async function buildDriveZipBufferFromFiles(
  manifestJson: string,
  files: ReadonlyArray<{ pathInZip: string; body: Buffer }>,
): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 6 } });
  const pass = new PassThrough();
  const chunks: Buffer[] = [];
  pass.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });
  archive.on('error', (err: Error) => {
    pass.destroy(err);
  });
  archive.pipe(pass);
  archive.append(manifestJson, { name: '_manifest/export-manifest.json' });
  for (const f of files) {
    archive.append(f.body, { name: f.pathInZip });
  }
  await archive.finalize();
  await finished(pass);
  return Buffer.concat(chunks);
}
