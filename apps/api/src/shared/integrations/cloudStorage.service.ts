import crypto from 'node:crypto';
import { env } from '../../config/env';
import type { StorageService, StoredFile } from '../services/storage.service';

/**
 * Cloud Storage (S3) — Integration Abstraction (Phase 4.2).
 *
 * Implements the exact same `StorageService` interface as `LocalStorageService` — a
 * literal drop-in replacement, not a parallel interface. Swapping local storage for real
 * S3 later means only changing which implementation is constructed (see
 * `storageService` in localStorage.service.ts) — no calling code in
 * procurement/expenses attachment flows would need to change.
 *
 * No AWS SDK calls are made here. `store`/`delete` simulate success and log what the real
 * SDK call would have been; `resolvePath` builds a plausible virtual-hosted-style S3 URL
 * from the object key. This is NOT wired into any attachment flow — those correctly keep
 * using `LocalStorageService` for real; this class only exists so a real S3
 * implementation can be plugged in later without changing business logic.
 */
export class S3StorageService implements StorageService {
  private readonly bucket = env.AWS_S3_BUCKET || 'erp-demo-bucket';
  private readonly region = env.AWS_S3_REGION || 'us-east-1';

  async store(file: Express.Multer.File): Promise<StoredFile> {
    const key = `uploads/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${file.originalname}`;
    console.log(
      `[FAKE S3] would PUT s3://${this.bucket}/${key} (${file.size} bytes, ${file.mimetype})`,
    );
    return {
      fileName: file.originalname,
      fileUrl: `s3:${key}`,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  resolvePath(fileUrl: string): string {
    const key = fileUrl.replace(/^s3:/, '');
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async delete(fileUrl: string): Promise<void> {
    const key = fileUrl.replace(/^s3:/, '');
    console.log(`[FAKE S3] would DELETE s3://${this.bucket}/${key}`);
  }
}

export const s3StorageService: StorageService = new S3StorageService();
