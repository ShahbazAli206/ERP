'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { TextFormField } from '@/components/shared/form-fields';
import { ApiError } from '@/lib/api-client';
import { TriangleAlertIcon } from 'lucide-react';
import { supplierContactFormSchema, type SupplierContactFormValues } from './schemas';
import { useAddSupplierContact } from './hooks';

const DEFAULTS: SupplierContactFormValues = { name: '', designation: '', email: '', phone: '' };

export function AddContactDialog({
  open,
  onOpenChange,
  supplierId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
}) {
  const mutation = useAddSupplierContact();
  const form = useForm<SupplierContactFormValues>({
    resolver: zodResolver(supplierContactFormSchema),
    defaultValues: DEFAULTS,
  });

  const onSubmit = (values: SupplierContactFormValues) => {
    mutation.mutate(
      {
        supplierId,
        input: {
          name: values.name,
          designation: values.designation || undefined,
          email: values.email || undefined,
          phone: values.phone || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Contact added');
          form.reset(DEFAULTS);
          onOpenChange(false);
        },
      },
    );
  };

  const errorMessage = mutation.error instanceof ApiError ? mutation.error.message : mutation.isError ? 'Something went wrong. Please try again.' : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          mutation.reset();
          form.reset(DEFAULTS);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
          <DialogDescription>Add a new contact for this supplier.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FieldGroup>
            <TextFormField control={form.control} name="name" label="Name" placeholder="Jane Doe" disabled={mutation.isPending} />
            <TextFormField
              control={form.control}
              name="designation"
              label="Designation"
              placeholder="Optional"
              disabled={mutation.isPending}
            />
            <TextFormField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="Optional"
              disabled={mutation.isPending}
            />
            <TextFormField control={form.control} name="phone" label="Phone" placeholder="Optional" disabled={mutation.isPending} />
          </FieldGroup>

          {errorMessage && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Couldn&apos;t add contact</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              Add contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
