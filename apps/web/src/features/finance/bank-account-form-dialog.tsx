'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TriangleAlertIcon } from 'lucide-react';
import { bankAccountSchema, type BankAccountFormInput, type BankAccountFormValues } from './schemas';
import { useCreateBankAccount, useUpdateBankAccount } from './hooks';
import type { BankAccount } from './api';

const CREATE_DEFAULTS: BankAccountFormInput = {
  name: '',
  bankName: '',
  accountNumber: '',
  currency: '',
  balance: 0,
};

export function BankAccountFormDialog({
  open,
  onOpenChange,
  bankAccount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present => edit mode; absent => create mode. */
  bankAccount?: BankAccount;
}) {
  const isEditMode = Boolean(bankAccount);
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm<BankAccountFormInput, unknown, BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      bankAccount
        ? {
            name: bankAccount.name,
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            currency: bankAccount.currency,
            balance: bankAccount.balance,
          }
        : CREATE_DEFAULTS,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/bankAccount change
  }, [open, bankAccount]);

  const onSubmit = (values: BankAccountFormValues) => {
    const handlers = {
      onSuccess: () => {
        toast.success(isEditMode ? 'Bank account updated' : 'Bank account created');
        onOpenChange(false);
      },
    };
    if (isEditMode && bankAccount) {
      updateMutation.mutate({ id: bankAccount.id, input: values }, handlers);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit bank account' : 'New bank account'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update this bank account’s details.' : 'Add a new bank account for cash-position tracking.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <TextFormField control={form.control} name="name" label="Account name" placeholder="Main Operating Account" disabled={mutation.isPending} />
            <TextFormField control={form.control} name="bankName" label="Bank" placeholder="Habib Bank Limited" disabled={mutation.isPending} />
            <TextFormField
              control={form.control}
              name="accountNumber"
              label="Account number"
              placeholder="HBL-0142-3390021"
              disabled={mutation.isPending}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextFormField control={form.control} name="currency" label="Currency" placeholder="PKR" disabled={mutation.isPending} />
              <TextFormField control={form.control} name="balance" label="Balance" type="number" disabled={mutation.isPending} />
            </div>
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t save bank account</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {isEditMode ? 'Save changes' : 'Create bank account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
