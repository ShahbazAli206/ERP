'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PencilIcon, TriangleAlertIcon } from 'lucide-react';
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
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { useUpdateShipment } from './hooks';
import { updateShipmentSchema, type UpdateShipmentFormInput, type UpdateShipmentFormValues } from './schemas';
import type { ShipmentDetail } from './api';

/**
 * Edits the fields the API's PATCH actually allows (`updateShipmentSchema`
 * on the backend omits `items`/`purchaseOrderId` — those are fixed at
 * creation). Only rendered enabled when `canEditShipment(status)` is true,
 * i.e. any status except DELIVERED (see `status.ts`'s doc comment for why
 * this is looser than "past BOOKED").
 */
export function ShipmentEditDialog({ shipment }: { shipment: ShipmentDetail }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useUpdateShipment(shipment.id);

  const form = useForm<UpdateShipmentFormInput, unknown, UpdateShipmentFormValues>({
    resolver: zodResolver(updateShipmentSchema),
    defaultValues: {
      containerNumber: shipment.containerNumber ?? '',
      originPort: shipment.originPort,
      destinationPort: shipment.destinationPort,
      estimatedArrival: shipment.estimatedArrival ? shipment.estimatedArrival.slice(0, 10) : '',
      freightCost: shipment.landedCostSummary.freightCost as unknown as number,
      insuranceCost: shipment.landedCostSummary.insuranceCost as unknown as number,
      dutyCost: shipment.landedCostSummary.dutyCost as unknown as number,
      customsCharges: shipment.landedCostSummary.customsCharges as unknown as number,
      currency: shipment.currency,
      exchangeRateToBase: shipment.landedCostSummary.exchangeRateToBase as unknown as number,
    },
  });

  const onSubmit = (values: UpdateShipmentFormValues) => {
    setFormError(null);
    mutation.mutate(values, {
      onSuccess: () => setOpen(false),
      onError: (error) => {
        setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <PencilIcon />
        Edit details
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit shipment {shipment.shipmentNumber}</DialogTitle>
          <DialogDescription>
            Container, route, dates and cost inputs can be updated. Items and the linked purchase order are fixed
            after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <TextFormField control={form.control} name="containerNumber" label="Container number" />
            <TextFormField control={form.control} name="estimatedArrival" label="Estimated arrival" type="date" />
            <TextFormField control={form.control} name="originPort" label="Origin port" />
            <TextFormField control={form.control} name="destinationPort" label="Destination port" />
            <TextFormField control={form.control} name="currency" label="Currency" />
            <TextFormField control={form.control} name="exchangeRateToBase" label="Exchange rate to base" type="number" />
            <TextFormField control={form.control} name="freightCost" label="Freight cost" type="number" />
            <TextFormField control={form.control} name="insuranceCost" label="Insurance cost" type="number" />
            <TextFormField control={form.control} name="dutyCost" label="Duty cost" type="number" />
            <TextFormField control={form.control} name="customsCharges" label="Customs charges" type="number" />
          </FieldGroup>

          {formError && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t save changes</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
