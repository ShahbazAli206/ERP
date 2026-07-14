'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { TextareaFormField } from '@/components/shared/form-fields';
import { Spinner } from '@/components/ui/spinner';
import { rejectFormSchema, type RejectFormValues } from '../schemas';

/** Reject requires a reason (`rejectPurchaseOrderSchema.reason`) — a plain confirm dialog isn't enough, so this is its own small form-in-a-dialog. */
export function RejectDialog({
  trigger,
  isPending,
  onConfirm,
}: {
  trigger: React.ReactElement;
  isPending: boolean;
  onConfirm: (reason: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: { reason: '' },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject purchase order</DialogTitle>
          <DialogDescription>This sends the order back with a reason recorded on its status history.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await onConfirm(values.reason);
              setOpen(false);
              form.reset();
            } catch {
              // Error toast already surfaced by the mutation's onError.
            }
          })}
          className="space-y-4"
        >
          <FieldGroup>
            <TextareaFormField
              control={form.control}
              name="reason"
              label="Reason"
              placeholder="Why is this purchase order being rejected?"
              disabled={isPending}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Spinner />}
              Reject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
