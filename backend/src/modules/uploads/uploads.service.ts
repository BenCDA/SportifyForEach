import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const UPLOADS_BASE = path.resolve(process.cwd(), 'uploads');

export function safeDeleteFile(relUrl: string | null | undefined): void {
  if (!relUrl) return;
  const filename = path.basename(relUrl);
  const subdir   = relUrl.includes('/avatars/') ? 'avatars' : 'sessions';
  const abs      = path.resolve(UPLOADS_BASE, subdir, filename);
  if (!abs.startsWith(UPLOADS_BASE)) return;
  fs.unlink(abs, () => undefined);
}

export async function processAvatar(buffer: Buffer, userId: string): Promise<string> {
  const filename = `${userId}-${Date.now()}.webp`;
  const dest     = path.resolve(UPLOADS_BASE, 'avatars', filename);
  await sharp(buffer)
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(dest);
  return `/uploads/avatars/${filename}`;
}

export async function processSessionCover(buffer: Buffer, sessionId: string): Promise<string> {
  const filename = `${sessionId}-${Date.now()}.webp`;
  const dest     = path.resolve(UPLOADS_BASE, 'sessions', filename);
  await sharp(buffer)
    .resize(1600, 900, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(dest);
  return `/uploads/sessions/${filename}`;
}
