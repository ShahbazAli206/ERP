'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { exchangeRateFormSchema, type ExchangeRateFormInput, type ExchangeRateFormValues } from './schemas';
import { useCreateExchangeRate, useUpdateExchangeRate } from './hooks';
import type { ExchangeRate } from './api';

const CREATE_DEFAULTS: ExchangeRateFormInput = {
  currencyCode: '',
  rateToBase: 0,
};

export function ExchangeRateFormDialog({
  open,
  onOpenChange,
  exchangeRate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present => edit mode (currency code locked); absent => create mode. */
  exchangeRate?: ExchangeRate;
}) {
  const isEditMode = Boolean(exchangeRate);
  const createMutation = useCreateExchangeRate();
  const updateMutation = useUpdateExchangeRate();
  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm<ExchangeRateFormInput, unknown, ExchangeRateFormValues>({
    resolver: zodResolver(exchangeRateFormSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      exchangeRate
        ? { currencyCode: exchangeRate.currencyCode, rateToBase: exchangeRate.rateToBase }
        : CREATE_DEFAULTS,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/exchangeRate change
  }, [open, exchangeRate]);

  const onSubmit = (values: ExchangeRateFormValues) => {
    const handlers = {
      onSuccess: () => {
        toast.success(isEditMode ? 'Exchange rate updated' : 'Exchange rate created');
        onOpenChange(false);
      },
    };
    if (isEditMode && exchangeRate) {
      updateMutation.mutate({ currencyCode: exchangeRate.currencyCode, input: { rateToBase: values.rateToBase } }, handlers);
    } else {
      createMutation.mutate(values, handlers);
    }
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.isError ? 'Something went wrong. Please try again.' : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) mutation.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit exchange rate' : 'New exchange rate'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Update the rate used to convert ${exchangeRate?.currencyCode} amounts into the base currency.`
              : 'Add a currency and its rate to the base currency.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <TextFormField
              control={form.control}
              name="currencyCode"
              label="Currency code"
              placeholder="USD"
              disabled={isEditMode || mutation.isPending}
              description={isEditMode ? 'The currency code can’t be changed once created.' : undefined}
            />
            <TextFormField control={form.control} name="rateToBase" label="Rate to base currency" type="number" disabled={mutation.isPending} />
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t save exchange rate</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {isEditMode ? 'Save changes' : 'Create exchange rate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
