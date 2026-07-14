'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2Icon, TriangleAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api-client';
import { useDeleteShipment } from './hooks';

/** Delete is allowed ONLY while a shipment is still BOOKED — see `status.ts`'s `canDeleteShipment`. */
export function ShipmentDeleteDialog({ shipmentId, shipmentNumber }: { shipmentId: string; shipmentNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useDeleteShipment();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="text-destructive hover:text-destructive" />}>
        <Trash2Icon />
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete shipment {shipmentNumber}?</DialogTitle>
          <DialogDescription>This permanently removes the shipment. This action cannot be undone.</DialogDescription>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Couldn&apos;t delete shipment</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => {
              setFormError(null);
              mutation.mutate(shipmentId, {
                onSuccess: () => router.push('/shipments'),
                onError: (error) => {
                  setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
                },
              });
            }}
          >
            {mutation.isPending && <Spinner />}
            Delete shipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
