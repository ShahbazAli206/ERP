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
import { SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TriangleAlertIcon } from 'lucide-react';
import { ACCOUNT_TYPE_OPTIONS, accountSchema, type AccountFormValues } from './schemas';
import { useCreateAccount, useUpdateAccount } from './hooks';
import type { Account } from './api';

const CREATE_DEFAULTS: AccountFormValues = { code: '', name: '', type: 'ASSET' };

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present => edit mode; absent => create mode. */
  account?: Account;
}) {
  const isEditMode = Boolean(account);
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(account ? { code: account.code, name: account.name, type: account.type } : CREATE_DEFAULTS);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on open/account change
  }, [open, account]);

  const onSubmit = (values: AccountFormValues) => {
    const handlers = {
      onSuccess: () => {
        toast.success(isEditMode ? 'Account updated' : 'Account created');
        onOpenChange(false);
      },
    };
    if (isEditMode && account) {
      updateMutation.mutate({ id: account.id, input: values }, handlers);
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
          <DialogTitle>{isEditMode ? 'Edit account' : 'New account'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update this chart-of-accounts entry.' : 'Add a new chart-of-accounts entry.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <TextFormField control={form.control} name="code" label="Code" placeholder="1050" disabled={mutation.isPending} />
            <TextFormField control={form.control} name="name" label="Name" placeholder="Petty Cash" disabled={mutation.isPending} />
            <SelectFormField
              control={form.control}
              name="type"
              label="Type"
              options={ACCOUNT_TYPE_OPTIONS as unknown as { value: string; label: string }[]}
              disabled={mutation.isPending}
            />
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t save account</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {isEditMode ? 'Save changes' : 'Create account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
