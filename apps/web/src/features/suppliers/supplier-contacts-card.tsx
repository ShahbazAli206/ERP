'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MailIcon, PhoneIcon, PlusIcon, Trash2Icon, UserRoundIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { SupplierContact } from './api';
import { AddContactDialog } from './add-contact-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { useRemoveSupplierContact } from './hooks';

export function SupplierContactsCard({
  supplierId,
  contacts,
  canEdit,
}: {
  supplierId: string;
  contacts: SupplierContact[];
  canEdit: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<SupplierContact | null>(null);
  const removeMutation = useRemoveSupplierContact();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
        {canEdit && (
          <CardAction>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
              <PlusIcon />
              Add contact
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <Empty className="border-0 p-0 py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRoundIcon />
              </EmptyMedia>
              <EmptyTitle>No contacts yet</EmptyTitle>
              <EmptyDescription>
                {canEdit ? 'Add a contact to keep track of who to reach at this supplier.' : 'This supplier has no contacts on file.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">{contact.name}</p>
                  {contact.designation && <p className="truncate text-xs text-muted-foreground">{contact.designation}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {contact.email && (
                      <span className="inline-flex items-center gap-1">
                        <MailIcon className="size-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="inline-flex items-center gap-1">
                        <PhoneIcon className="size-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setRemoveTarget(contact)}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove {contact.name}</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {canEdit && <AddContactDialog open={addOpen} onOpenChange={setAddOpen} supplierId={supplierId} />}

      {canEdit && (
        <ConfirmDialog
          open={Boolean(removeTarget)}
          onOpenChange={(open) => !open && setRemoveTarget(null)}
          title="Remove contact"
          description={`Remove ${removeTarget?.name ?? 'this contact'} from this supplier? This can't be undone.`}
          confirmLabel="Remove"
          isPending={removeMutation.isPending}
          onConfirm={() => {
            if (!removeTarget) return;
            removeMutation.mutate(
              { supplierId, contactId: removeTarget.id },
              {
                onSuccess: () => {
                  toast.success('Contact removed');
                  setRemoveTarget(null);
                },
                onError: () => toast.error('Could not remove contact'),
              },
            );
          }}
        />
      )}
    </Card>
  );
}
