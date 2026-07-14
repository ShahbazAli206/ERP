'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CheckCircle2Icon, PlusIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import { ApiError } from '@/lib/api-client';
import { FinancePageShell } from './finance-nav';
import { formatMoney, toDateInputValue } from './format';
import { createJournalEntrySchema, type CreateJournalEntryFormInput, type CreateJournalEntryFormValues } from './schemas';
import { useAllAccounts, useCreateJournalEntry } from './hooks';

const BLANK_LINE = { accountId: '', debit: 0, credit: 0 };

const DEFAULTS: CreateJournalEntryFormInput = {
  entryDate: toDateInputValue(new Date()),
  description: '',
  reference: '',
  lines: [
    { ...BLANK_LINE },
    { ...BLANK_LINE },
  ],
};

export function JournalEntryFormView() {
  const router = useRouter();
  const accountsQuery = useAllAccounts();
  const mutation = useCreateJournalEntry();

  const form = useForm<CreateJournalEntryFormInput, unknown, CreateJournalEntryFormValues>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: DEFAULTS,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });

  const lines = form.watch('lines');
  const totalDebit = lines.reduce((sum, l) => sum + (Number(l?.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l?.credit) || 0), 0);
  const diff = totalDebit - totalCredit;
  const isBalanced = Math.abs(diff) < 0.01 && totalDebit > 0;

  const accountOptions = (accountsQuery.data?.data ?? []).map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  // Zod issues whose `path` is exactly `['lines']` (the whole-array balance check) land
  // either directly on `errors.lines.message` or under `.root.message`, depending on
  // whether per-line issues are also present — cast narrowly rather than fighting RHF's
  // generated array-error type for a field that isn't meant to be indexed here.
  const linesErrors = form.formState.errors.lines as unknown as { message?: string; root?: { message?: string } } | undefined;
  const linesError = linesErrors?.root?.message ?? linesErrors?.message;

  const onSubmit = (values: CreateJournalEntryFormValues) => {
    const input = {
      entryDate: values.entryDate ? values.entryDate.toISOString() : undefined,
      description: values.description || undefined,
      reference: values.reference || undefined,
      lines: values.lines.map((line) => ({ accountId: line.accountId, debit: line.debit, credit: line.credit })),
    };

    mutation.mutate(input, {
      onSuccess: (entry) => {
        toast.success('Journal entry created');
        router.push(`/finance/journal-entries/${entry.id}`);
      },
    });
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.isError ? 'Something went wrong. Please try again.' : null;

  return (
    <FinancePageShell title="New Journal Entry" description="Record a double-entry posting to the general ledger.">
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Entry details</CardTitle>
          <CardDescription>Every entry needs at least 2 lines, and total debits must equal total credits.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FieldGroup>
              <div className="grid gap-3 sm:grid-cols-3">
                <TextFormField control={form.control} name="entryDate" label="Entry date" type="date" disabled={mutation.isPending} />
                <TextFormField
                  control={form.control}
                  name="description"
                  label="Description"
                  placeholder="Rent accrual for month 13"
                  disabled={mutation.isPending}
                  className="sm:col-span-2"
                />
              </div>
              <TextFormField control={form.control} name="reference" label="Reference (optional)" placeholder="JE-RENT-01" disabled={mutation.isPending} />
            </FieldGroup>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Lines</p>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ...BLANK_LINE })} disabled={mutation.isPending}>
                  <PlusIcon />
                  Add line
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start">
                    <div className="flex-1">
                      <SelectFormField
                        control={form.control}
                        name={`lines.${index}.accountId` as FieldPath<CreateJournalEntryFormInput>}
                        label="Account"
                        options={accountOptions}
                        disabled={mutation.isPending || accountsQuery.isLoading}
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <TextFormField
                        control={form.control}
                        name={`lines.${index}.debit` as FieldPath<CreateJournalEntryFormInput>}
                        label="Debit"
                        type="number"
                        disabled={mutation.isPending}
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <TextFormField
                        control={form.control}
                        name={`lines.${index}.credit` as FieldPath<CreateJournalEntryFormInput>}
                        label="Credit"
                        type="number"
                        disabled={mutation.isPending}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="sm:mt-6"
                      onClick={() => remove(index)}
                      disabled={mutation.isPending || fields.length <= 2}
                      aria-label="Remove line"
                    >
                      <XIcon />
                    </Button>
                  </div>
                ))}
              </div>

              {linesError && <p className="text-sm text-destructive">{String(linesError)}</p>}

              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm"
                style={{ color: isBalanced ? STATUS_COLOR_VAR.good : STATUS_COLOR_VAR.critical }}
              >
                <span className="flex items-center gap-2 font-medium">
                  {isBalanced ? <CheckCircle2Icon className="size-4" /> : <TriangleAlertIcon className="size-4" />}
                  {isBalanced ? 'Balanced' : `Unbalanced — off by ${formatMoney(Math.abs(diff))}`}
                </span>
                <span className="tabular-nums text-foreground">
                  Debit {formatMoney(totalDebit)} · Credit {formatMoney(totalCredit)}
                </span>
              </div>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>Couldn&apos;t save journal entry</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/finance/journal-entries')} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner />}
                Create journal entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FinancePageShell>
  );
}
