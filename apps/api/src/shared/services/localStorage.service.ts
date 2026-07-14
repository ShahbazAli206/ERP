import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env';
import type { StorageService, StoredFile } from './storage.service';

const uploadRoot = path.resolve(env.UPLOAD_DIR);

export class LocalStorageService implements StorageService {
  async store(file: Express.Multer.File): Promise<StoredFile> {
    await fs.mkdir(uploadRoot, { recursive: true });
    return {
      fileName: file.originalname,
      fileUrl: `local:${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  resolvePath(fileUrl: string): string {
    const fileName = fileUrl.replace(/^local:/, '');
    return path.join(uploadRoot, fileName);
  }

  async delete(fileUrl: string): Promise<void> {
    await fs.rm(this.resolvePath(fileUrl), { force: true });
  }
}

export const storageService: StorageService = new LocalStorageService();
