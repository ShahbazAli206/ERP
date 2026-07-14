'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DownloadIcon, FileIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FileUpload } from '@/components/shared/file-upload';
import { formatFileSize } from '@/lib/upload-constants';
import { useAuth } from '@/features/auth/use-auth';
import { downloadExpenseAttachment, useRemoveExpenseAttachment, useUploadExpenseAttachment } from '../hooks';
import { formatDateTime } from '../format';
import type { ExpenseAttachment } from '../api';

/** Mirrors `features/procurement/components/attachments-section.tsx` — same multer + local storage service pattern on the API side, just against `/expenses/:id/attachments`. */
export function AttachmentsSection({ expenseId, attachments }: { expenseId: string; attachments: ExpenseAttachment[] }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('expenses:edit');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const uploadMutation = useUploadExpenseAttachment(expenseId);
  const removeMutation = useRemoveExpenseAttachment(expenseId);

  async function handleUpload() {
    for (const file of pendingFiles) {
      await uploadMutation.mutateAsync(file);
    }
    setPendingFiles([]);
  }

  async function handleDownload(attachment: ExpenseAttachment) {
    setDownloadingId(attachment.id);
    try {
      await downloadExpenseAttachment(expenseId, attachment.id, attachment.fileName);
    } catch {
      toast.error('Could not download the attachment.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments yet.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{attachment.fileName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                {formatDateTime(attachment.uploadedAt)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={downloadingId === attachment.id}
                onClick={() => handleDownload(attachment)}
                aria-label={`Download ${attachment.fileName}`}
              >
                {downloadingId === attachment.id ? <Spinner /> : <DownloadIcon />}
              </Button>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(attachment.id)}
                  aria-label={`Remove ${attachment.fileName}`}
                >
                  <Trash2Icon />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="space-y-3">
          <FileUpload files={pendingFiles} onFilesChange={setPendingFiles} multiple disabled={uploadMutation.isPending} />
          {pendingFiles.length > 0 && (
            <Button type="button" size="sm" disabled={uploadMutation.isPending} onClick={handleUpload}>
              {uploadMutation.isPending && <Spinner />}
              Upload {pendingFiles.length} {pendingFiles.length === 1 ? 'file' : 'files'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
