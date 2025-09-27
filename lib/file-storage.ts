import { writeFile, mkdir, unlink, readdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const TEMP_DIR = join(process.cwd(), 'temp');

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

export async function ensureTempDir(): Promise<void> {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

export async function createTempJobFolder(jobId: string): Promise<string> {
  await ensureTempDir();
  const jobDir = join(TEMP_DIR, jobId);
  await mkdir(jobDir, { recursive: true });
  return jobDir;
}

export async function copyFileToTemp(
  sourcePath: string,
  tempDir: string,
  filename: string
): Promise<string> {
  const tempFilePath = join(tempDir, filename);
  const sourceBuffer = await import('fs').then((fs) =>
    fs.promises.readFile(sourcePath)
  );
  await writeFile(tempFilePath, sourceBuffer);
  return tempFilePath;
}

export async function cleanupTempJobFolder(jobId: string): Promise<void> {
  try {
    const jobDir = join(TEMP_DIR, jobId);
    if (existsSync(jobDir)) {
      await rm(jobDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Error cleaning up temp folder:', error);
  }
}
