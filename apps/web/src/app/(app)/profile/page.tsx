'use client';

import { CalendarClockIcon, MailIcon, ShieldIcon, UserIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/use-auth';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/**
 * Read-only profile — matches the backend, which has no profile-update
 * endpoint (only `GET /api/auth/me`). Shows exactly what that endpoint
 * returns; nothing here is editable.
 */
export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  return (
    <>
      <PageHeader title="Profile" description="Your account details, as returned by the API." />
      <Card>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {isLoading || !user ? (
            <>
              <Skeleton className="size-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="size-16">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                <AvatarFallback className="text-lg">{initialsOf(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-lg font-semibold">{user.name}</h2>
                  <Badge variant="secondary" className="mt-1">
                    {user.role}
                  </Badge>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MailIcon className="size-4" />
                    <dt className="sr-only">Email</dt>
                    <dd>{user.email}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldIcon className="size-4" />
                    <dt className="sr-only">Role</dt>
                    <dd>{user.role}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserIcon className="size-4" />
                    <dt className="sr-only">Status</dt>
                    <dd>{user.isActive ? 'Active' : 'Inactive'}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClockIcon className="size-4" />
                    <dt className="sr-only">Last login</dt>
                    <dd>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
