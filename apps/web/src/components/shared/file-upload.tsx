'use client';

import { useId, useRef, useState } from 'react';
import { FileIcon, UploadCloudIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_MB,
  formatFileSize,
  isAllowedUploadType,
  isWithinUploadSizeLimit,
} from '@/lib/upload-constants';

/**
 * Drag/drop-or-click file picker with client-side pre-validation matching
 * the backend's multer MIME whitelist + size limit (see
 * `src/lib/upload-constants.ts`). This only *selects* files — it does not
 * upload them itself. Wire the resulting `File[]` into a mutation via
 * `apiClient.upload()`:
 *
 *   const [files, setFiles] = useState<File[]>([]);
 *   const mutation = useMutation({ mutationFn: (file: File) => apiClient.upload('/procurement/purchase-orders/123/attachments', file) });
 *   <FileUpload files={files} onFilesChange={setFiles} />
 *   <Button onClick={() => files.forEach((f) => mutation.mutate(f))}>Upload</Button>
 *
 * Rejected files (wrong type / too large) never make it into `files` — the
 * rejection reason is shown inline instead.
 */
export function FileUpload({
  files,
  onFilesChange,
  multiple = false,
  disabled,
  className,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function acceptFiles(incoming: FileList | File[]) {
    const candidates = Array.from(incoming);
    const accepted: File[] = [];

    for (const file of candidates) {
      if (!isAllowedUploadType(file)) {
        setError(`"${file.name}" isn't an allowed file type. Allowed: ${ALLOWED_UPLOAD_EXTENSIONS.join(', ')}.`);
        continue;
      }
      if (!isWithinUploadSizeLimit(file)) {
        setError(`"${file.name}" is larger than the ${MAX_UPLOAD_SIZE_MB}MB limit.`);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length > 0) {
      setError(null);
      onFilesChange(multiple ? [...files, ...accepted] : [accepted[0]!]);
    }
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className={cn('space-y-3', className)}>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingOver(false);
          if (!disabled && event.dataTransfer.files.length) acceptFiles(event.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors',
          isDraggingOver ? 'border-primary bg-accent' : 'border-input hover:bg-muted/50',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <UploadCloudIcon className="size-6 text-muted-foreground" />
        <div className="text-sm">
          <span className="font-medium text-foreground">Click to upload</span>{' '}
          <span className="text-muted-foreground">or drag and drop</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {ALLOWED_UPLOAD_EXTENSIONS.join(', ')} up to {MAX_UPLOAD_SIZE_MB}MB
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple={multiple}
          disabled={disabled}
          accept={ALLOWED_UPLOAD_MIME_TYPES.join(',')}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) acceptFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
