'use client';

import { ShieldIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsPageShell } from './settings-nav';
import { useSettingsRoles } from './hooks';

/** Turns `"finance:edit"` into `{ module: "finance", action: "edit" }`. */
function splitPermission(permission: string): { module: string; action: string } {
  const [module, action] = permission.split(':');
  return { module: module ?? permission, action: action ?? '' };
}

/** Groups a role's flat `permissions: string[]` by module, e.g. `{ finance: ["view", "edit"] }`. */
function groupByModule(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const permission of permissions) {
    const { module, action } = splitPermission(permission);
    (groups[module] ??= []).push(action);
  }
  return groups;
}

/**
 * Read-only. `GET /settings/roles` returns each role's full flat permission
 * list (`RoleWithPermissionsDto.permissions: string[]`) — there's no
 * separate permissions endpoint, so this one view covers both the "Roles"
 * and "Permissions" spec sections: each role's permissions are grouped by
 * module here for readability instead of dumping the flat `"module:action"`
 * strings.
 */
export function RolesView() {
  const query = useSettingsRoles();

  return (
    <SettingsPageShell title="Roles & Permissions" description="Every role in the system and the exact permissions it grants, grouped by module.">
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : query.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {query.data.map((role) => {
            const grouped = groupByModule(role.permissions);
            const modules = Object.keys(grouped).sort();
            return (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle>{role.name}</CardTitle>
                  <CardDescription>
                    {role.description || `${role.permissions.length} permission${role.permissions.length === 1 ? '' : 's'}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {modules.length ? (
                    <dl className="space-y-2.5">
                      {modules.map((module) => (
                        <div key={module} className="flex flex-wrap items-start gap-2">
                          <dt className="w-28 shrink-0 text-sm font-medium capitalize">{module}</dt>
                          <dd className="flex flex-1 flex-wrap gap-1">
                            {grouped[module]!.sort().map((action) => (
                              <Badge key={action} variant="secondary" className="capitalize">
                                {action}
                              </Badge>
                            ))}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">No permissions granted.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldIcon />
            </EmptyMedia>
            <EmptyTitle>No roles found</EmptyTitle>
            <EmptyDescription>No roles exist yet.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </SettingsPageShell>
  );
}
