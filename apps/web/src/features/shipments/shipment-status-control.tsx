'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FieldGroup } from '@/components/ui/field';
import { TextFormField, TextareaFormField } from '@/components/shared/form-fields';
import { ShipmentSelectFormField } from './select-form-field';
import { TriangleAlertIcon } from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import { useUpdateShipmentStatus } from './hooks';
import { allowedNextStatuses, shipmentStatusLabel } from './status';
import {
  updateShipmentStatusSchema,
  type UpdateShipmentStatusFormInput,
  type UpdateShipmentStatusFormValues,
} from './schemas';

const DEFAULT_VALUES: UpdateShipmentStatusFormInput = { status: '', note: '', actualArrival: '' };

/**
 * Status-transition control: advance to any status the current one allows —
 * including `DELAYED`, which is reachable from every non-terminal status and
 * itself resumes into any later stage (never a dead end). The set of allowed
 * next statuses mirrors the API's authoritative transition map
 * (`src/features/shipments/status.ts`); the server re-validates regardless.
 */
export function ShipmentStatusControl({ shipmentId, currentStatus }: { shipmentId: string; currentStatus: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const nextOptions = allowedNextStatuses(currentStatus);
  const mutation = useUpdateShipmentStatus(shipmentId);

  const form = useForm<UpdateShipmentStatusFormInput, unknown, UpdateShipmentStatusFormValues>({
    resolver: zodResolver(updateShipmentStatusSchema),
    defaultValues: DEFAULT_VALUES,
  });

  if (nextOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>This shipment is delivered — there are no further transitions.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const onSubmit = (values: UpdateShipmentStatusFormValues) => {
    setFormError(null);
    mutation.mutate(values, {
      onSuccess: () => form.reset(DEFAULT_VALUES),
      onError: (error) => {
        setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advance status</CardTitle>
        <CardDescription>
          From <span className="font-medium">{shipmentStatusLabel(currentStatus)}</span>, this shipment can move to:{' '}
          {nextOptions.map(shipmentStatusLabel).join(', ')}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <ShipmentSelectFormField
              control={form.control}
              name="status"
              label="New status"
              options={nextOptions.map((value) => ({ value, label: shipmentStatusLabel(value) }))}
            />
            <TextFormField control={form.control} name="actualArrival" label="Actual arrival (optional)" type="date" />
          </FieldGroup>
          <TextareaFormField control={form.control} name="note" label="Note (optional)" placeholder="Reason, carrier update, etc." rows={2} />

          {formError && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t update status</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              Update status
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
