import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

export interface StoredFile {
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function storeFile(
  file: File,
  filename: string
): Promise<StoredFile> {
  await ensureUploadDir();

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = join(UPLOAD_DIR, filename);

  await writeFile(filePath, buffer);

  return {
    filePath,
    fileSize: buffer.length,
    mimeType: file.type,
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error if file doesn't exist
  }
}

export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}
