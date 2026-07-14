/**
 * Mirrors the multer config in `apps/api/src/middleware/upload.middleware.ts`
 * so the frontend can reject an obviously-invalid file before spending a
 * round trip on it. This is a client-side convenience only — the backend
 * re-validates independently and is the actual source of truth; keep these
 * two lists in sync by hand if the backend's whitelist ever changes.
 */
export const ALLOWED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
] as const;

export const ALLOWED_UPLOAD_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.csv'];

/** Mirrors apps/api's `MAX_UPLOAD_SIZE_MB` (see apps/api/.env.example) via NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB. */
export const MAX_UPLOAD_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB ?? 10);

export function isAllowedUploadType(file: File): boolean {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type);
}

export function isWithinUploadSizeLimit(file: File): boolean {
  return file.size <= MAX_UPLOAD_SIZE_MB * 1024 * 1024;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
